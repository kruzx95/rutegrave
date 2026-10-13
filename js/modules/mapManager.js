/**
 * Map Manager Module
 * Manages Leaflet map instance, multi-layer basemaps (CyclOSM, Satellite, Topo, OSM),
 * route polyline overlays, waypoint markers, and elevation scrub crosshair.
 */

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
    this.customWaypointsLayer = null;
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
      zoomControl: false // Custom placement later
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

  renderRoute(points, options = {}) {
    if (!this.map || !this.L || !Array.isArray(points) || points.length === 0) {
      return;
    }

    this.clearRoute();

    const latLngs = points.map((p) => [p.lat, p.lon]);
    const routeColor = options.color || '#e67e22';

    // Casing line (halo effect for contrast against satellite/topo maps)
    this.routeCasing = this.L.polyline(latLngs, {
      color: '#121516',
      weight: 8,
      opacity: 0.7,
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

    const startIcon = this.createCustomIcon('Start', 'pin-start', '🚩');
    this.startMarker = this.L.marker([startPt.lat, startPt.lon], {
      icon: startIcon || undefined
    }).addTo(this.map);

    if (points.length > 1) {
      const finishIcon = this.createCustomIcon('Finish', 'pin-finish', '🏁');
      this.finishMarker = this.L.marker([finishPt.lat, finishPt.lon], {
        icon: finishIcon || undefined
      }).addTo(this.map);
    }

    if (options.autoFit !== false) {
      this.fitBounds(points);
    }
  }

  setCrosshairPosition(lat, lon, eleText = '') {
    if (!this.map || !this.L) return;

    if (!this.crosshairMarker) {
      const crosshairIcon = this.createCustomIcon('Position', 'pin-crosshair', '📍');
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

  clearRoute() {
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
