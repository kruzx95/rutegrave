/**
 * Elevation Engine Module
 * Computes Haversine distances, route metrics (gain, loss, gradient), and generates elevation charts.
 */

const EARTH_RADIUS_KM = 6371;

/**
 * Calculates great-circle distance between two coordinates in kilometers using Haversine formula
 * @param {{lat: number, lon: number}} p1
 * @param {{lat: number, lon: number}} p2
 * @returns {number} Distance in km
 */
export function calculateDistanceKm(p1, p2) {
  if (!p1 || !p2) return 0;
  if (p1.lat === p2.lat && p1.lon === p2.lon) return 0;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(p2.lat - p1.lat);
  const dLon = toRad(p2.lon - p1.lon);
  const lat1 = toRad(p1.lat);
  const lat2 = toRad(p2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Computes comprehensive route metrics including total distance, elevation gain, loss, min, max
 * @param {Array<{lat: number, lon: number, ele?: number}>} points
 * @returns {Object} Route metrics
 */
export function computeRouteMetrics(points) {
  if (!Array.isArray(points) || points.length === 0) {
    return {
      totalDistanceKm: 0,
      elevationGainM: 0,
      elevationLossM: 0,
      minEleM: 0,
      maxEleM: 0,
      avgGradientPct: 0,
      estimatedTimeMinutes: 0
    };
  }

  if (points.length === 1) {
    const singleEle = Math.round(points[0].ele || 0);
    return {
      totalDistanceKm: 0,
      elevationGainM: 0,
      elevationLossM: 0,
      minEleM: singleEle,
      maxEleM: singleEle,
      avgGradientPct: 0,
      estimatedTimeMinutes: 0
    };
  }

  let totalDist = 0;
  let gain = 0;
  let loss = 0;
  let minEle = points[0].ele !== undefined ? points[0].ele : Infinity;
  let maxEle = points[0].ele !== undefined ? points[0].ele : -Infinity;

  for (let i = 0; i < points.length; i++) {
    const curEle = points[i].ele !== undefined ? points[i].ele : 0;
    if (curEle < minEle) minEle = curEle;
    if (curEle > maxEle) maxEle = curEle;

    if (i > 0) {
      const d = calculateDistanceKm(points[i - 1], points[i]);
      totalDist += d;

      const prevEle = points[i - 1].ele !== undefined ? points[i - 1].ele : 0;
      const diff = curEle - prevEle;
      if (diff > 0) {
        gain += diff;
      } else {
        loss += Math.abs(diff);
      }
    }
  }

  if (minEle === Infinity) minEle = 0;
  if (maxEle === -Infinity) maxEle = 0;

  // Average gravel speed: ~18 km/h on flat with additional time for climbing (+1 min per 10m gain)
  const baseMinutes = (totalDist / 18) * 60;
  const climbingMinutes = (gain / 10);
  const estimatedTimeMinutes = Math.round(baseMinutes + climbingMinutes);

  const avgGradient = totalDist > 0 ? (gain / (totalDist * 1000)) * 100 : 0;

  return {
    totalDistanceKm: Number(totalDist.toFixed(1)),
    elevationGainM: Math.round(gain),
    elevationLossM: Math.round(loss),
    minEleM: Math.round(minEle),
    maxEleM: Math.round(maxEle),
    avgGradientPct: Number(avgGradient.toFixed(1)),
    estimatedTimeMinutes
  };
}

/**
 * Computes smoothed gradient percentage (%) around a given point index using an 80m window
 */
export function computeSmoothedGradient(points, index, dists) {
  if (!Array.isArray(points) || points.length < 2 || index < 0 || index >= points.length) {
    return 0;
  }

  let cumulativeDists = dists;
  if (!Array.isArray(cumulativeDists) || cumulativeDists.length !== points.length) {
    cumulativeDists = [0];
    let dAcc = 0;
    for (let i = 1; i < points.length; i++) {
      dAcc += calculateDistanceKm(points[i - 1], points[i]);
      cumulativeDists.push(dAcc);
    }
  }

  const targetDist = cumulativeDists[index];
  const halfWindowKm = 0.08; // 80m on each side

  let iBack = index;
  while (iBack > 0 && targetDist - cumulativeDists[iBack] < halfWindowKm) {
    iBack--;
  }

  let iFwd = index;
  while (iFwd < points.length - 1 && cumulativeDists[iFwd] - targetDist < halfWindowKm) {
    iFwd++;
  }

  const distSpanM = (cumulativeDists[iFwd] - cumulativeDists[iBack]) * 1000;
  if (distSpanM <= 5) return 0;

  const eleDiff = (points[iFwd].ele || 0) - (points[iBack].ele || 0);
  const gradePct = (eleDiff / distSpanM) * 100;
  return Number(gradePct.toFixed(1));
}

/**
 * Returns gradient category info and color token
 */
export function getGradientCategory(gradePct) {
  if (gradePct < -1.5) {
    return { label: 'Turunan', color: '#3498db', textColor: '#ffffff' };
  }
  if (gradePct < 4.0) {
    return { label: 'Landai', color: '#2ecc71', textColor: '#ffffff' };
  }
  if (gradePct < 8.0) {
    return { label: 'Sedang', color: '#f1c40f', textColor: '#121516' };
  }
  if (gradePct < 12.0) {
    return { label: 'Curam', color: '#e67e22', textColor: '#ffffff' };
  }
  return { label: 'Ekstrem', color: '#e74c3c', textColor: '#ffffff' };
}

/**
 * Generates responsive SVG markup representing the elevation profile with ClimbPro-style gradient visualization
 * @param {Array<{lat: number, lon: number, ele?: number}>} points
 * @param {number} width
 * @param {number} height
 * @param {Object} [options]
 * @returns {string} SVG HTML string
 */
export function generateElevationSvg(points, width = 600, height = 140, options = {}) {
  if (!Array.isArray(points) || points.length < 2) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <text x="${width / 2}" y="${height / 2}" fill="#6b7280" font-size="12" text-anchor="middle">Data elevasi belum tersedia</text>
    </svg>`;
  }

  const keySectors = Array.isArray(options.keySectors) ? options.keySectors : [];

  // Precompute distances and altitudes
  const dists = [0];
  let totalDist = 0;
  let minEle = points[0].ele || 0;
  let maxEle = points[0].ele || 0;

  for (let i = 1; i < points.length; i++) {
    totalDist += calculateDistanceKm(points[i - 1], points[i]);
    dists.push(totalDist);
    const ele = points[i].ele || 0;
    if (ele < minEle) minEle = ele;
    if (ele > maxEle) maxEle = ele;
  }

  const padding = { top: 22, right: 20, bottom: 25, left: 45 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const eleMinPadded = Math.max(0, Math.floor((minEle - 20) / 50) * 50);
  const eleMaxPadded = Math.ceil((maxEle + 20) / 50) * 50;
  const totalEleSpan = Math.max(eleMaxPadded - eleMinPadded, 50);

  const getX = (d) => padding.left + (d / (totalDist || 1)) * plotW;
  const getY = (ele) => padding.top + plotH - ((ele - eleMinPadded) / totalEleSpan) * plotH;

  const svgPoints = points.map((p, idx) => {
    const x = getX(dists[idx]).toFixed(1);
    const y = getY(p.ele || 0).toFixed(1);
    return `${x},${y}`;
  });

  const polylineStr = svgPoints.join(' ');
  const polygonStr = `${padding.left},${padding.top + plotH} ${polylineStr} ${padding.left + plotW},${padding.top + plotH}`;

  // Key sectors highlight overlays
  const sectorHighlights = keySectors.map((sec) => {
    const sStart = Math.max(0, sec.startKm || 0);
    const sEnd = Math.min(totalDist, sec.endKm || totalDist);
    if (sEnd <= sStart) return '';

    const x1 = Math.max(padding.left, getX(sStart));
    const x2 = Math.min(padding.left + plotW, getX(sEnd));
    const secWidth = Math.max(x2 - x1, 4);
    const midX = x1 + secWidth / 2;

    return `
      <g class="sector-highlight-band">
        <rect x="${x1.toFixed(1)}" y="${padding.top}" width="${secWidth.toFixed(1)}" height="${plotH}" fill="rgba(255, 183, 3, 0.12)" stroke="rgba(255, 183, 3, 0.45)" stroke-dasharray="3 3"/>
        <text x="${midX.toFixed(1)}" y="${padding.top - 6}" fill="#ffb703" font-size="9" font-weight="700" text-anchor="middle">⛰️ ${sec.name.split(' - ')[0].replace('Tanjakan ', '')}</text>
      </g>
    `;
  });

  // ClimbPro bottom gradient color bar (divided into slices)
  const gradientBars = [];
  const barHeight = 4;
  const barY = padding.top + plotH - barHeight;
  const sliceCount = Math.min(points.length - 1, 80);
  const sliceStep = Math.max(1, Math.floor(points.length / sliceCount));

  for (let i = 0; i < points.length - 1; i += sliceStep) {
    const iNext = Math.min(i + sliceStep, points.length - 1);
    const x1 = getX(dists[i]);
    const x2 = getX(dists[iNext]);
    const grade = computeSmoothedGradient(points, i, dists);
    const cat = getGradientCategory(grade);

    gradientBars.push(`
      <rect x="${x1.toFixed(1)}" y="${barY}" width="${Math.max(x2 - x1, 1).toFixed(1)}" height="${barHeight}" fill="${cat.color}"/>
    `);
  }

  // Y-axis grid markers
  const yGridLines = [];
  const steps = 3;
  for (let s = 0; s <= steps; s++) {
    const val = Math.round(eleMinPadded + (totalEleSpan / steps) * s);
    const yPos = getY(val).toFixed(1);
    yGridLines.push(`
      <line x1="${padding.left}" y1="${yPos}" x2="${padding.left + plotW}" y2="${yPos}" stroke="#2a3036" stroke-dasharray="3 3" />
      <text x="${padding.left - 8}" y="${Number(yPos) + 3}" fill="#8b949e" font-size="10" text-anchor="end">${val}m</text>
    `);
  }

  // X-axis distance markers
  const xDistLabels = [];
  const xSteps = 4;
  for (let xs = 0; xs <= xSteps; xs++) {
    const dVal = ((totalDist / xSteps) * xs).toFixed(0);
    const xPos = (padding.left + (plotW / xSteps) * xs).toFixed(1);
    xDistLabels.push(`
      <text x="${xPos}" y="${height - 6}" fill="#8b949e" font-size="10" text-anchor="middle">${dVal} km</text>
    `);
  }

  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="eleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#e67e22" stop-opacity="0.6"/>
        <stop offset="70%" stop-color="#d35400" stop-opacity="0.2"/>
        <stop offset="100%" stop-color="#121516" stop-opacity="0.05"/>
      </linearGradient>
    </defs>
    <g class="grid-lines">${yGridLines.join('')}</g>
    <g class="sector-highlights">${sectorHighlights.join('')}</g>
    <polygon points="${polygonStr}" fill="url(#eleGradient)"/>
    <polyline points="${polylineStr}" fill="none" stroke="#e67e22" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    <g class="gradient-bars">${gradientBars.join('')}</g>
    <g class="x-labels">${xDistLabels.join('')}</g>
  </svg>`;
}

/**
 * Finds the closest point and rich telemetry (distance, elevation, gradient %, and active sector)
 * @param {Array<{lat: number, lon: number, ele?: number}>} points
 * @param {number} fraction (0 to 1)
 * @param {Array} [keySectors]
 */
export function getScrubTelemetry(points, fraction, keySectors = []) {
  if (!points || points.length === 0) return null;
  const clamped = Math.max(0, Math.min(1, fraction));
  const idx = Math.min(Math.floor(clamped * points.length), points.length - 1);
  const pt = points[idx];

  let curKm = 0;
  for (let i = 1; i <= idx; i++) {
    curKm += calculateDistanceKm(points[i - 1], points[i]);
  }

  const gradientPct = computeSmoothedGradient(points, idx);
  const gradientCategory = getGradientCategory(gradientPct);

  const activeSector =
    Array.isArray(keySectors) && keySectors.length > 0
      ? keySectors.find((s) => curKm >= s.startKm && curKm <= s.endKm) || null
      : null;

  return {
    point: pt,
    index: idx,
    currentKm: Number(curKm.toFixed(1)),
    gradientPct,
    gradientCategory,
    activeSector
  };
}
