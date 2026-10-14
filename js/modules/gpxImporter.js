/**
 * GPX Importer Module
 * Parses TopoGrafix GPX 1.0 & 1.1 XML files, extracts coordinates and elevations,
 * detects key climbing sectors, and converts them to standard route objects.
 */

import { calculateDistanceKm, computeRouteMetrics, computeSmoothedGradient } from './elevationEngine.js';

/**
 * Parses a GPX XML string and extracts track name, description, and coordinate points
 * @param {string} xmlString
 * @returns {{name: string, description: string, points: Array<{lat: number, lon: number, ele: number}>}}
 */
export function parseGpxXml(xmlString) {
  if (!xmlString || typeof xmlString !== 'string' || xmlString.trim().length === 0) {
    throw new Error('Konten file GPX kosong atau tidak valid.');
  }

  let name = 'Rute GPX Impor';
  let description = 'Rute hasil impor file GPX eksternal.';
  const points = [];

  // Check if browser DOMParser is available
  if (typeof DOMParser !== 'undefined') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error('Format XML pada file GPX rusak atau tidak terbaca.');
    }

    // Extract Name
    const nameEl = doc.querySelector('trk > name') || doc.querySelector('metadata > name') || doc.querySelector('name');
    if (nameEl && nameEl.textContent) {
      name = nameEl.textContent.trim();
    }

    // Extract Description
    const descEl = doc.querySelector('trk > desc') || doc.querySelector('metadata > desc') || doc.querySelector('desc');
    if (descEl && descEl.textContent) {
      description = descEl.textContent.trim();
    }

    // Extract Track Points (<trkpt> or <rtept>)
    let ptEls = doc.querySelectorAll('trkpt');
    if (!ptEls || ptEls.length === 0) {
      ptEls = doc.querySelectorAll('rtept');
    }

    ptEls.forEach((pt) => {
      const latAttr = pt.getAttribute('lat');
      const lonAttr = pt.getAttribute('lon');
      if (latAttr !== null && lonAttr !== null) {
        const lat = parseFloat(latAttr);
        const lon = parseFloat(lonAttr);
        if (!isNaN(lat) && !isNaN(lon)) {
          const eleEl = pt.querySelector('ele');
          const ele = eleEl && eleEl.textContent ? parseFloat(eleEl.textContent) : 0;
          points.push({
            lat: Number(lat.toFixed(6)),
            lon: Number(lon.toFixed(6)),
            ele: isNaN(ele) ? 0 : Number(ele.toFixed(1))
          });
        }
      }
    });
  } else {
    // Regex-based parser for Node.js test environment without DOMParser
    const nameMatch = xmlString.match(/<name>([^<]+)<\/name>/i);
    if (nameMatch) name = nameMatch[1].trim();

    const descMatch = xmlString.match(/<desc>([^<]+)<\/desc>/i);
    if (descMatch) description = descMatch[1].trim();

    const ptRegex = /<(?:trkpt|rtept)\s+[^>]*lat=["']([^"']+)["'][^>]*lon=["']([^"']+)["'][^>]*>(?:[\s\S]*?<ele>([^<]+)<\/ele>)?/gi;
    let match;
    while ((match = ptRegex.exec(xmlString)) !== null) {
      const lat = parseFloat(match[1]);
      const lon = parseFloat(match[2]);
      const ele = match[3] ? parseFloat(match[3]) : 0;
      if (!isNaN(lat) && !isNaN(lon)) {
        points.push({
          lat: Number(lat.toFixed(6)),
          lon: Number(lon.toFixed(6)),
          ele: isNaN(ele) ? 0 : Number(ele.toFixed(1))
        });
      }
    }
  }

  if (points.length < 2) {
    throw new Error('File GPX tidak memiliki titik koordinat lintasan (<trkpt> atau <rtept>) yang valid.');
  }

  return {
    name,
    description,
    points
  };
}

/**
 * Automatically detects steep climb sectors (>= 5% grade over >= 1.5 km) from points
 * @param {Array<{lat: number, lon: number, ele: number}>} points
 * @returns {Array<Object>} Detected climb sectors
 */
export function detectKeySectorsFromPoints(points) {
  if (!Array.isArray(points) || points.length < 10) return [];

  const sectors = [];
  const dists = [0];
  let totalDist = 0;
  for (let i = 1; i < points.length; i++) {
    totalDist += calculateDistanceKm(points[i - 1], points[i]);
    dists.push(totalDist);
  }

  let climbStartIdx = -1;
  let climbGain = 0;

  for (let i = 1; i < points.length; i++) {
    const grade = computeSmoothedGradient(points, i, dists);
    if (grade >= 4.5) {
      if (climbStartIdx === -1) {
        climbStartIdx = i;
        climbGain = 0;
      }
      const eleDiff = (points[i].ele || 0) - (points[i - 1].ele || 0);
      if (eleDiff > 0) climbGain += eleDiff;
    } else {
      if (climbStartIdx !== -1) {
        const climbDistKm = dists[i] - dists[climbStartIdx];
        if (climbDistKm >= 1.2 && climbGain >= 60) {
          const avgGrade = (climbGain / (climbDistKm * 1000)) * 100;
          let cat = 'Cat 3 Climb';
          if (climbGain >= 350) cat = 'Cat 1 HC Climb';
          else if (climbGain >= 180) cat = 'Cat 2 Climb';

          sectors.push({
            id: `sec-auto-${sectors.length + 1}`,
            name: `Tanjakan KM ${dists[climbStartIdx].toFixed(1)}`,
            category: cat,
            startKm: Number(dists[climbStartIdx].toFixed(1)),
            endKm: Number(dists[i].toFixed(1)),
            lengthKm: Number(climbDistKm.toFixed(1)),
            elevationGainM: Math.round(climbGain),
            avgGrade: Number(avgGrade.toFixed(1)),
            maxGrade: Number((avgGrade * 1.6).toFixed(1)),
            surface: 'Campuran Gravel & Aspal Kasar',
            description: `Sektor tanjakan hasil deteksi otomatis sepanjang ${climbDistKm.toFixed(1)} km dengan elevasi gain +${Math.round(climbGain)}m.`
          });
        }
        climbStartIdx = -1;
        climbGain = 0;
      }
    }
  }

  return sectors;
}

/**
 * Converts parsed GPX data to a full route object compatible with GravelApp
 * @param {{name: string, description: string, points: Array}} gpxData
 * @param {Function} [elevationEstimator]
 * @returns {Object} Route object
 */
export function gpxToRouteObject(gpxData, elevationEstimator) {
  const points = gpxData.points.map((p) => {
    let ele = p.ele;
    if ((!ele || ele === 0) && typeof elevationEstimator === 'function') {
      ele = elevationEstimator(p.lat, p.lon);
    }
    return {
      lat: p.lat,
      lon: p.lon,
      ele: Math.round(ele || 0)
    };
  });

  const metrics = computeRouteMetrics(points);
  const detectedSectors = detectKeySectorsFromPoints(points);

  const halfDist = metrics.totalDistanceKm / 2;
  const itinerary = [
    { km: '0 km', label: `Start: ${gpxData.name || 'Titik Awal'}` },
    { km: `${halfDist.toFixed(1)} km`, label: 'Titik Balik Jalur (Midpoint)' },
    { km: `${metrics.totalDistanceKm.toFixed(1)} km`, label: 'Finish: Titik Akhir Gowes' }
  ];

  return {
    id: `imported-${Date.now()}`,
    name: gpxData.name || 'Rute GPX Impor',
    description: gpxData.description || 'Rute hasil unggah berkas GPX.',
    distanceKm: metrics.totalDistanceKm,
    elevationGainM: metrics.elevationGainM,
    elevationLossM: metrics.elevationLossM,
    minElevationM: metrics.minEleM,
    maxElevationM: metrics.maxEleM,
    recommendedTire: '38c - 45c (All-Terrain)',
    surfaceRatio: {
      gravel: 40,
      brokenPaved: 35,
      paved: 25
    },
    difficulty: metrics.elevationGainM > 800 ? 'Menantang (Challenging)' : metrics.elevationGainM > 400 ? 'Sedang (Moderate)' : 'Ringan (Friendly)',
    highlights: [
      `Diimpor dari file GPX: ${points.length} titik koordinat`,
      `Total jarak ${metrics.totalDistanceKm} km dengan gain +${metrics.elevationGainM}m`,
      detectedSectors.length > 0 ? `Terdeteksi ${detectedSectors.length} sektor tanjakan signifikan` : 'Profil jalur rolling'
    ],
    itinerary,
    keySectors: detectedSectors,
    points
  };
}
