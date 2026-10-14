/**
 * Map Manager Module
 * Manages Leaflet map instance, multi-layer basemaps (CyclOSM, Satellite, Topo, OSM),
 * route polyline overlays, directional flow arrows, milestone markers,
 * waypoint markers, and elevation scrub crosshair.
 */

import { calculateDistanceKm } from './elevationEngine.js';

export const TASIKMALAYA_CENTER = {
  lat: -7.3274,
  lon: 108.2207,
  zoom: 12
};

export const BASE_LAYERS_CONFIG = {
  cyclosm: {
    name: 'CyclOSM (Cycling & Surface)',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    options: {
      maxZoom: 20,
      attribution: '© OpenStreetMap contributors, CyclOSM'
    }
  },
  satellite: {
    name: 'Esri Satellite (Visual Ground)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      maxZoom: 19,
      attribution: 'Tiles © Esri, Maxar, Earthstar Geographics'
    }
  },
  topo: {
    name: 'OpenTopoMap (Contours & Elevation)',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 17,
      attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap'
    }
  },
  osm: {
    name: 'OpenStreetMap (Standard Road)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }
  }
};

/**
 * Calculates compass bearing (0-360 degrees) from coordinate 1 to coordinate 2
 */
export function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Finds the coordinate point along the route closest to target kilometer
 */
export function findPointAtKm(points, targetKm) {
  if (!Array.isArray(points) || points.length === 0) return null;
  if (targetKm <= 0) return { point: points[0], index: 0, distanceKm: 0 };

  let accDist = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const d = calculateDistanceKm(points[i], points[i + 1]);
    if (accDist + d >= targetKm) {
      return { point: points[i + 1], index: i + 1, distanceKm: accDist + d };
    }
    accDist += d;
  }
  return { point: points[points.length - 1], index: points.length - 1, distanceKm: accDist };
}

export class MapManager {
  /**
   * @param {Object} [leafletInstance] - Leaflet L object (defaults to window.L if in browser)
   */
  constructor(leafletInstance) {
    this.L = leafletInstance || (typeof window !== 'undefined' ? window.L : null);
    this.map = null;
    this.baseLayers = {};
    this.currentBaseLayerKey = 'cyclosm';
    this.routePolyline = null;
    this.routeCasing = null;
    this.startMarker = null;
    this.finishMarker = null;
    this.crosshairMarker = null;
    this.directionMarkers = [];
    this.animTimer = null;
  }

  init(containerId) {
    if (!this.L) {
      console.warn('Leaflet instance not loaded');
      return null;
    }

    const { lat, lon, zoom } = TASIKMALAYA_CENTER;
    this.map = this.L.map(containerId, {
      center: [lat, lon],
      zoom: zoom,
      zoomControl: false
    });

    // Create tile layers
    Object.keys(BASE_LAYERS_CONFIG).forEach((key) => {
      const cfg = BASE_LAYERS_CONFIG[key];
      this.baseLayers[key] = this.L.tileLayer(cfg.url, cfg.options);
    });

    // Add default layer
    this.baseLayers[this.currentBaseLayerKey].addTo(this.map);

    return this.map;
  }

  switchBaseLayer(layerKey) {
    if (!this.map || !this.baseLayers[layerKey] || layerKey === this.currentBaseLayerKey) {
      return;
    }
    this.map.removeLayer(this.baseLayers[this.currentBaseLayerKey]);
    this.baseLayers[layerKey].addTo(this.map);
    this.currentBaseLayerKey = layerKey;
  }

  createCustomIcon(label, bgClass, symbol) {
    if (!this.L?.divIcon) return null;
    return this.L.divIcon({
      className: 'custom-map-pin',
      html: `<div class="pin-badge ${bgClass}" title="${label}"><span>${symbol}</span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  createLoopBadge(totalDistanceKm) {
    if (!this.L?.divIcon) return null;
    const kmText = typeof totalDistanceKm === 'number' ? `${totalDistanceKm.toFixed(1)} km` : '';
    return this.L.divIcon({
      className: 'route-loop-badge-icon',
      html: `<div class="pin-loop-pill" title="Titik Start dan Finish Rute Loop">
        <span class="loop-tag-start">🚩 Mulai 0k</span>
        <span class="loop-divider">➔</span>
        <span class="loop-tag-finish">🏁 Finish ${kmText}</span>
      </div>`,
      iconSize: [160, 32],
      iconAnchor: [80, 16]
    });
  }

  createGuideIcon(label, type = 'depart') {
    if (!this.L?.divIcon) return null;
    return this.L.divIcon({
      className: 'route-guide-icon',
      html: `<div class="badge-flow-guide ${type}" title="${label}"><span>${label}</span></div>`,
      iconSize: [120, 26],
      iconAnchor: [60, 13]
    });
  }

  createDirectionArrowIcon(bearing, isOutbound = true) {
    if (!this.L?.divIcon) return null;
    const roundedBearing = Math.round(bearing);
    const flowClass = isOutbound ? 'outbound' : 'inbound';
    const flowLabel = isOutbound ? 'Jalur Pergi (Outbound)' : 'Jalur Pulang Menuju Finish';
    const fillHex = isOutbound ? '#2ecc71' : '#ffb703';
    const strokeHex = isOutbound ? '#05140b' : '#121516';

    return this.L.divIcon({
      className: 'route-dir-icon',
      html: `<div class="dir-arrow-wrapper ${flowClass}" style="transform: rotate(${roundedBearing}deg);" title="${flowLabel} (${roundedBearing}°)">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L21 21L12 16.5L3 21L12 2Z" fill="${fillHex}" stroke="${strokeHex}" stroke-width="2.5" stroke-linejoin="round"/>
        </svg>
      </div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11]
    });
  }

  createMilestoneIcon(km, isOutbound = true) {
    if (!this.L?.divIcon) return null;
    const flowClass = isOutbound ? 'outbound' : 'inbound';
    const flowTitle = isOutbound ? `KM ${km} - Jalur Pergi (Outbound)` : `KM ${km} - Jalur Menuju Finish`;

    return this.L.divIcon({
      className: 'route-milestone-icon',
      html: `<div class="milestone-badge ${flowClass}" title="${flowTitle}"><span>${km}k</span></div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  }

  renderRoute(points, options = {}) {
    if (!this.map || !this.L || !Array.isArray(points) || points.length === 0) {
      return;
    }

    this.clearRoute();

    const latLngs = points.map((p) => [p.lat, p.lon]);
    const routeColor = options.color || '#e67e22';

    // Calculate total route distance
    let totalRouteDistanceKm = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalRouteDistanceKm += calculateDistanceKm(points[i], points[i + 1]);
    }

    // Casing line (halo effect for contrast)
    this.routeCasing = this.L.polyline(latLngs, {
      color: '#121516',
      weight: 8,
      opacity: 0.75,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    // Foreground track
    this.routePolyline = this.L.polyline(latLngs, {
      color: routeColor,
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    // Start & Finish Markers
    const startPt = points[0];
    const finishPt = points[points.length - 1];
    const loopDistance = calculateDistanceKm(startPt, finishPt);

    if (loopDistance < 0.25 && points.length > 5) {
      // Loop route: unified Start & Finish badge
      const loopIcon = this.createLoopBadge(totalRouteDistanceKm);
      this.startMarker = this.L.marker([startPt.lat, startPt.lon], {
        icon: loopIcon || undefined,
        zIndexOffset: 700
      }).addTo(this.map);

      // Add departure guide badge at ~400m
      const departPt = this.findPointAtKm(points, 0.4);
      if (departPt && departPt.point) {
        const departIcon = this.createGuideIcon('🟢 Jalur Berangkat ➔', 'depart');
        if (departIcon) {
          const m = this.L.marker([departPt.point.lat, departPt.point.lon], {
            icon: departIcon,
            zIndexOffset: 650
          }).addTo(this.map);
          this.directionMarkers.push(m);
        }
      }

      // Add approach guide badge at ~400m before finish
      const approachKm = Math.max(0.5, totalRouteDistanceKm - 0.4);
      const approachPt = this.findPointAtKm(points, approachKm);
      if (approachPt && approachPt.point) {
        const approachIcon = this.createGuideIcon('🏁 Menuju Finish ➔', 'approach');
        if (approachIcon) {
          const m = this.L.marker([approachPt.point.lat, approachPt.point.lon], {
            icon: approachIcon,
            zIndexOffset: 650
          }).addTo(this.map);
          this.directionMarkers.push(m);
        }
      }
    } else {
      // Distinct Start and Finish
      const startIcon = this.createCustomIcon('Mulai (0 km)', 'pin-start', '🚩');
      this.startMarker = this.L.marker([startPt.lat, startPt.lon], {
        icon: startIcon || undefined,
        zIndexOffset: 500
      }).addTo(this.map);

      if (points.length > 1) {
        const finishIcon = this.createCustomIcon(`Selesai (${totalRouteDistanceKm.toFixed(1)} km)`, 'pin-finish', '🏁');
        this.finishMarker = this.L.marker([finishPt.lat, finishPt.lon], {
          icon: finishIcon || undefined,
          zIndexOffset: 500
        }).addTo(this.map);
      }
    }

    // Direction Chevrons & Milestones
    this.renderDirectionFlow(points, totalRouteDistanceKm);

    if (options.autoFit !== false) {
      this.fitBounds(points);
    }
  }

  /**
   * Finds point and index at target kilometer
   */
  findPointAtKm(points, targetKm) {
    return findPointAtKm(points, targetKm);
  }

  /**
   * Renders directional arrows every ~1.5 km and milestone badges every 10 km
   * Distinguishes outbound (first half) vs inbound/finish (second half)
   */
  renderDirectionFlow(points, totalRouteDistanceKm = 0) {
    if (!this.map || !this.L || points.length < 2) return;

    if (!totalRouteDistanceKm) {
      for (let i = 0; i < points.length - 1; i++) {
        totalRouteDistanceKm += calculateDistanceKm(points[i], points[i + 1]);
      }
    }

    const halfDist = totalRouteDistanceKm / 2;
    let totalDist = 0;
    let nextArrowDist = 0.8; // First arrow at 0.8 km
    const arrowIntervalKm = 1.6; // Arrow every 1.6 km

    const milestoneIntervalKm = totalRouteDistanceKm < 20 ? 5.0 : 10.0;
    let nextMilestoneDist = milestoneIntervalKm;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const d = calculateDistanceKm(p1, p2);
      totalDist += d;

      const isOutbound = totalDist <= halfDist;

      // Check for Direction Arrow
      if (totalDist >= nextArrowDist) {
        const bearing = calculateBearing(p1.lat, p1.lon, p2.lat, p2.lon);
        const icon = this.createDirectionArrowIcon(bearing, isOutbound);
        if (icon) {
          const arrowMarker = this.L.marker([p2.lat, p2.lon], {
            icon,
            interactive: false,
            zIndexOffset: 200
          }).addTo(this.map);
          this.directionMarkers.push(arrowMarker);
        }
        nextArrowDist += arrowIntervalKm;
      }

      // Check for Milestone (10k, 20k, 30k...)
      if (totalDist >= nextMilestoneDist && nextMilestoneDist < totalRouteDistanceKm - 0.5) {
        const kmLabel = Math.round(nextMilestoneDist);
        const icon = this.createMilestoneIcon(kmLabel, isOutbound);
        if (icon) {
          const msMarker = this.L.marker([p2.lat, p2.lon], {
            icon,
            interactive: true,
            zIndexOffset: 300
          }).addTo(this.map);
          this.directionMarkers.push(msMarker);
        }
        nextMilestoneDist += milestoneIntervalKm;
      }
    }
  }

  setCrosshairPosition(lat, lon, eleText = '') {
    if (!this.map || !this.L) return;

    if (!this.crosshairMarker) {
      const crosshairIcon = this.createCustomIcon('Posisi Gowes', 'pin-crosshair', '🚴');
      this.crosshairMarker = this.L.marker([lat, lon], {
        icon: crosshairIcon || undefined,
        zIndexOffset: 1000
      }).addTo(this.map);
    } else {
      this.crosshairMarker.setLatLng([lat, lon]);
    }
  }

  clearCrosshair() {
    if (this.crosshairMarker && this.map) {
      this.map.removeLayer(this.crosshairMarker);
      this.crosshairMarker = null;
    }
  }

  /**
   * Animates the cyclist marker along the route to visually demonstrate the flow
   */
  animateRouteFlow(points, onStep, onDone) {
    this.stopAnimation();
    if (!points || points.length < 2) return;

    let currentIndex = 0;
    const stepInterval = 45; // ~45ms per step
    const stepSkip = Math.max(1, Math.floor(points.length / 120)); // ~120 frames total (~5.5 seconds)

    this.animTimer = setInterval(() => {
      currentIndex += stepSkip;
      if (currentIndex >= points.length - 1) {
        currentIndex = points.length - 1;
        const pt = points[currentIndex];
        this.setCrosshairPosition(pt.lat, pt.lon);
        if (onStep) onStep(currentIndex, pt, true);
        this.stopAnimation();
        if (onDone) onDone();
        return;
      }

      const pt = points[currentIndex];
      this.setCrosshairPosition(pt.lat, pt.lon);
      if (onStep) onStep(currentIndex, pt, false);
    }, stepInterval);
  }

  isAnimating() {
    return this.animTimer !== null;
  }

  stopAnimation() {
    if (this.animTimer) {
      clearInterval(this.animTimer);
      this.animTimer = null;
    }
  }

  clearRoute() {
    this.stopAnimation();
    if (!this.map) return;
    if (this.routeCasing) {
      this.map.removeLayer(this.routeCasing);
      this.routeCasing = null;
    }
    if (this.routePolyline) {
      this.map.removeLayer(this.routePolyline);
      this.routePolyline = null;
    }
    if (this.startMarker) {
      this.map.removeLayer(this.startMarker);
      this.startMarker = null;
    }
    if (this.finishMarker) {
      this.map.removeLayer(this.finishMarker);
      this.finishMarker = null;
    }

    if (this.directionMarkers && this.directionMarkers.length > 0) {
      this.directionMarkers.forEach((m) => {
        if (m && this.map) this.map.removeLayer(m);
      });
      this.directionMarkers = [];
    }

    this.clearCrosshair();
  }

  fitBounds(points) {
    if (!this.map || !this.L || !Array.isArray(points) || points.length === 0) return;
    const latLngs = points.map((p) => [p.lat, p.lon]);
    this.map.fitBounds(latLngs, {
      padding: [40, 40],
      maxZoom: 15
    });
  }

  centerOnTasikmalaya() {
    if (!this.map) return;
    this.map.setView([TASIKMALAYA_CENTER.lat, TASIKMALAYA_CENTER.lon], TASIKMALAYA_CENTER.zoom);
  }
}
