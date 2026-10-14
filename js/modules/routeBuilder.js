/**
 * Route Builder Module
 * Allows users to interactively plot and edit custom gravel routes,
 * perform road-snapping via OpenStreetMap OSRM bicycle routing,
 * route reversal, undo/redo points, and estimate surface compositions.
 */

import { computeRouteMetrics } from './elevationEngine.js';

export class RouteBuilderState {
  constructor() {
    this.waypoints = [];
    this.points = [];
    this.history = [];
    this.active = false;
  }

  /**
   * Estimates elevation based on Tasikmalaya topography model if external SRTM is unavailable
   * Tasikmalaya valley center is ~350m, rises towards NW (Galunggung, up to 1200m),
   * SW (Taraju tea ridge, up to 1050m), and drops towards E (Ciwulan river basin, down to 260m).
   */
  estimateElevation(lat, lon) {
    // Reference center: Alun-alun Tasikmalaya (-7.3274, 108.2207, ~350m)
    const dLatNW = -7.2400 - lat; // Northwest towards Galunggung
    const dLonNW = 108.1200 - lon;
    const distNW = Math.hypot(dLatNW, dLonNW);

    const dLatSW = -7.4100 - lat; // Southwest towards Taraju
    const dLonSW = 108.0200 - lon;
    const distSW = Math.hypot(dLatSW, dLonSW);

    const dLatE = -7.3500 - lat;  // East towards Ciwulan
    const dLonE = 108.3100 - lon;
    const distE = Math.hypot(dLatE, dLonE);

    let baseEle = 350;

    if (distNW < 0.15) {
      baseEle = 350 + (0.15 - distNW) * 3500;
    } else if (distSW < 0.2) {
      baseEle = 380 + (0.2 - distSW) * 3200;
    } else if (distE < 0.12) {
      baseEle = 350 - (0.12 - distE) * 600;
    }

    // Add mild natural terrain noise
    const terrainNoise = Math.sin(lat * 80) * 15 + Math.cos(lon * 80) * 12;
    return Math.max(260, Math.min(1250, Math.round(baseEle + terrainNoise)));
  }

  saveSnapshot() {
    this.history.push({
      waypoints: JSON.parse(JSON.stringify(this.waypoints)),
      points: JSON.parse(JSON.stringify(this.points))
    });
    if (this.history.length > 50) this.history.shift();
  }

  addPoint(lat, lon, ele) {
    this.saveSnapshot();
    const finalEle = ele !== undefined ? ele : this.estimateElevation(lat, lon);
    const newPt = {
      lat: Number(lat),
      lon: Number(lon),
      ele: Number(finalEle)
    };
    this.waypoints.push({ lat: Number(lat), lon: Number(lon) });
    this.points.push(newPt);
    return newPt;
  }

  getWaypointsCount() {
    return this.waypoints.length;
  }

  /**
   * Snaps the route to real OpenStreetMap roads using OSRM bicycle routing
   */
  async resolveRoadGeometry() {
    if (this.waypoints.length < 2) {
      this.points = this.waypoints.map(w => ({
        lat: w.lat,
        lon: w.lon,
        ele: this.estimateElevation(w.lat, w.lon)
      }));
      return this.points;
    }

    try {
      const coordStr = this.waypoints.map(w => `${w.lon.toFixed(6)},${w.lat.toFixed(6)}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/bicycle/${coordStr}?overview=full&geometries=geojson`;
      const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined }).then(r => r.json());

      if (res && res.code === 'Ok' && res.routes && res.routes[0]) {
        const rawCoords = res.routes[0].geometry.coordinates; // [[lon, lat], ...]
        const step = Math.max(1, Math.floor(rawCoords.length / 450));
        const snapped = [];

        for (let i = 0; i < rawCoords.length; i += step) {
          const [lon, lat] = rawCoords[i];
          snapped.push({
            lat: Number(lat.toFixed(6)),
            lon: Number(lon.toFixed(6)),
            ele: Number(this.estimateElevation(lat, lon).toFixed(1))
          });
        }

        const last = rawCoords[rawCoords.length - 1];
        if (snapped.length === 0 || snapped[snapped.length - 1].lat !== last[1] || snapped[snapped.length - 1].lon !== last[0]) {
          snapped.push({
            lat: Number(last[1].toFixed(6)),
            lon: Number(last[0].toFixed(6)),
            ele: Number(this.estimateElevation(last[1], last[0]).toFixed(1))
          });
        }

        this.points = snapped;
        return this.points;
      }
    } catch (err) {
      console.warn('OSRM routing fetch failed, falling back to direct waypoints:', err);
    }

    // Fallback: direct waypoints with elevation
    this.points = this.waypoints.map(w => ({
      lat: w.lat,
      lon: w.lon,
      ele: this.estimateElevation(w.lat, w.lon)
    }));
    return this.points;
  }

  removePoint(index) {
    if (index >= 0 && index < this.waypoints.length) {
      this.saveSnapshot();
      this.waypoints.splice(index, 1);
      return this.points.splice(index, 1)[0];
    }
    return null;
  }

  updatePoint(index, lat, lon) {
    if (index >= 0 && index < this.waypoints.length) {
      this.saveSnapshot();
      this.waypoints[index].lat = Number(lat);
      this.waypoints[index].lon = Number(lon);
      this.points[index].lat = Number(lat);
      this.points[index].lon = Number(lon);
      this.points[index].ele = this.estimateElevation(lat, lon);
      return this.points[index];
    }
    return null;
  }

  undo() {
    if (this.history.length > 0) {
      const snap = this.history.pop();
      this.waypoints = snap.waypoints;
      this.points = snap.points;
      return true;
    }
    return false;
  }

  reverse() {
    if (this.waypoints.length > 1) {
      this.saveSnapshot();
      this.waypoints.reverse();
      this.points.reverse();
      return true;
    }
    return false;
  }

  clear() {
    if (this.waypoints.length > 0 || this.points.length > 0) {
      this.saveSnapshot();
      this.waypoints = [];
      this.points = [];
      return true;
    }
    return false;
  }

  getPoints() {
    return this.points;
  }

  /**
   * Estimates surface percentage ratio based on coordinates and terrain characteristics
   */
  estimateSurfaceRatio() {
    if (this.points.length === 0) {
      return { gravel: 40, brokenPaved: 35, paved: 25 };
    }

    let gravelCount = 0;
    let brokenCount = 0;
    let pavedCount = 0;

    for (const p of this.points) {
      // Mountainous slopes (elevations > 550m) or riverbeds (< 295m) are mostly gravel/unpaved
      if (p.ele > 550 || p.ele < 295) {
        gravelCount += 2;
        brokenCount += 1;
      } else if (p.ele > 400) {
        gravelCount += 1;
        brokenCount += 2;
      } else {
        brokenCount += 1;
        pavedCount += 1;
      }
    }

    const total = gravelCount + brokenCount + pavedCount || 1;
    let gravel = Math.round((gravelCount / total) * 100);
    let broken = Math.round((brokenCount / total) * 100);
    let paved = 100 - gravel - broken;

    // Safety clamps
    if (gravel < 15) gravel = 20;
    if (paved < 10) paved = 15;
    broken = 100 - gravel - paved;

    return {
      gravel,
      brokenPaved: broken,
      paved
    };
  }

  toRouteObject(name = 'Rute Kustom Tasikmalaya', description = 'Rute kustom mixed-road buatan pengguna.') {
    const metrics = computeRouteMetrics(this.points);
    const surfaces = this.estimateSurfaceRatio();

    return {
      id: 'custom-route',
      name,
      description,
      distanceKm: metrics.totalDistanceKm,
      elevationGainM: metrics.elevationGainM,
      elevationLossM: metrics.elevationLossM,
      minElevationM: metrics.minEleM,
      maxElevationM: metrics.maxEleM,
      recommendedTire: surfaces.gravel > 40 ? '38c - 45c' : '35c - 40c',
      surfaceRatio: surfaces,
      points: this.points
    };
  }
}
