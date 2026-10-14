/**
 * Tasikmalaya Gravel Navigator - Main Application Controller
 */

import { MapManager } from './modules/mapManager.js';
import { RouteBuilderState } from './modules/routeBuilder.js';
import { TASIK_GRAVEL_ROUTES } from './data/routes.js';
import { downloadGpxFile } from './modules/gpxExporter.js';
import { computeRouteMetrics, generateElevationSvg, getScrubTelemetry } from './modules/elevationEngine.js';

class GravelApp {
  constructor() {
    this.mapManager = new MapManager();
    this.routeBuilder = new RouteBuilderState();
    this.currentRoute = TASIK_GRAVEL_ROUTES[0];
    this.isCustomMode = false;

    // DOM Elements
    this.dom = {
      presetContainer: document.getElementById('preset-routes-container'),
      panelPresets: document.getElementById('panel-presets'),
      panelCustom: document.getElementById('panel-custom'),
      tabPresets: document.getElementById('tab-presets'),
      tabCustom: document.getElementById('tab-custom'),
      
      btnUndo: document.getElementById('btn-builder-undo'),
      btnReverse: document.getElementById('btn-builder-reverse'),
      btnClear: document.getElementById('btn-builder-clear'),
      
      statDistance: document.getElementById('stat-distance'),
      statGain: document.getElementById('stat-gain'),
      statEleRange: document.getElementById('stat-elevation-range'),
      statTime: document.getElementById('stat-time'),
      statTire: document.getElementById('stat-tire'),
      difficultyBadge: document.getElementById('route-difficulty-badge'),
      
      barGravel: document.getElementById('bar-gravel'),
      barBroken: document.getElementById('bar-broken'),
      barPaved: document.getElementById('bar-paved'),
      ratioGravel: document.getElementById('ratio-gravel'),
      ratioBroken: document.getElementById('ratio-broken'),
      ratioPaved: document.getElementById('ratio-paved'),
      
      routeDescText: document.getElementById('route-desc-text'),
      routeHighlightsList: document.getElementById('route-highlights-list'),
      btnDownloadGpx: document.getElementById('btn-download-gpx'),
      
      layerSelect: document.getElementById('select-layer'),
      btnQuickCenter: document.getElementById('btn-quick-center'),
      btnToggleElevation: document.getElementById('btn-toggle-elevation'),
      btnCloseElevation: document.getElementById('btn-close-elevation'),
      elevationDrawer: document.getElementById('elevation-drawer'),
      elevationChart: document.getElementById('elevation-chart'),
      scrubPill: document.getElementById('scrub-telemetry-pill'),
      toastContainer: document.getElementById('toast-container')
    };
  }

  init() {
    this.map = this.mapManager.init('map');
    if (!this.map) {
      this.showToast('Gagal memuat peta Leaflet', 'error');
      return;
    }

    this.renderPresetList();
    this.attachEventListeners();
    this.loadRoute(this.currentRoute);
    this.showToast('Selamat datang di Tasik Gravel! Rute Galunggung dimuat.', 'info');
  }

  showToast(message, type = 'info') {
    if (!this.dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  renderPresetList() {
    if (!this.dom.presetContainer) return;
    this.dom.presetContainer.innerHTML = '';

    TASIK_GRAVEL_ROUTES.forEach((route) => {
      const card = document.createElement('button');
      card.className = `preset-card ${route.id === this.currentRoute?.id ? 'active' : ''}`;
      card.setAttribute('aria-label', `Pilih rute ${route.name}`);

      card.innerHTML = `
        <div class="preset-header">
          <div class="preset-name">${route.name}</div>
          <span class="preset-badge">${route.difficulty.split(' ')[0]}</span>
        </div>
        <div class="preset-meta">
          <div class="meta-item">📏 ${route.distanceKm} km</div>
          <div class="meta-item">⛰️ +${route.elevationGainM}m</div>
          <div class="meta-item">🪨 ${route.surfaceRatio.gravel}% gravel</div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.selectPreset(route);
      });

      this.dom.presetContainer.appendChild(card);
    });
  }

  selectPreset(route) {
    if (this.isCustomMode) {
      this.setMode('presets');
    }
    this.currentRoute = route;
    this.loadRoute(route);
    this.renderPresetList();
    this.showToast(`Rute dimuat: ${route.name}`, 'info');
  }

  loadRoute(route) {
    if (!route || !Array.isArray(route.points) || route.points.length === 0) return;

    this.currentRoute = route;
    const metrics = computeRouteMetrics(route.points);

    // Update Telemetry Display
    this.dom.statDistance.textContent = metrics.totalDistanceKm.toFixed(1);
    this.dom.statGain.textContent = `+${metrics.elevationGainM}`;
    this.dom.statEleRange.textContent = `${metrics.minEleM} - ${metrics.maxEleM}`;

    const hrs = Math.floor(metrics.estimatedTimeMinutes / 60);
    const mins = metrics.estimatedTimeMinutes % 60;
    this.dom.statTime.textContent = `${hrs}j ${mins}m`;

    this.dom.statTire.textContent = route.recommendedTire || '38c - 45c';
    this.dom.difficultyBadge.textContent = route.difficulty || 'Sedang';

    // Update Surface Bars
    const surf = route.surfaceRatio || { gravel: 40, brokenPaved: 35, paved: 25 };
    this.dom.barGravel.style.width = `${surf.gravel}%`;
    this.dom.barBroken.style.width = `${surf.brokenPaved}%`;
    this.dom.barPaved.style.width = `${surf.paved}%`;
    this.dom.ratioGravel.textContent = `${surf.gravel}%`;
    this.dom.ratioBroken.textContent = `${surf.brokenPaved}%`;
    this.dom.ratioPaved.textContent = `${surf.paved}%`;

    // Update Descriptions & Highlights
    this.dom.routeDescText.textContent = route.description || 'Rute gravel mixed-road Tasikmalaya.';
    this.dom.routeHighlightsList.innerHTML = '';
    const highlights = route.highlights || [
      'Jalur pedesaan Tasikmalaya yang asri',
      'Kombinasi makadam batu dan jalan perkebunan'
    ];
    highlights.forEach((h) => {
      const li = document.createElement('li');
      li.textContent = h;
      this.dom.routeHighlightsList.appendChild(li);
    });

    // Render Map Polyline
    this.mapManager.renderRoute(route.points);

    // Render Elevation Profile
    this.renderElevationChart(route.points);
  }

  renderElevationChart(points) {
    if (!this.dom.elevationChart) return;
    const width = this.dom.elevationChart.clientWidth || 650;
    const height = 110;
    this.dom.elevationChart.innerHTML = generateElevationSvg(points, width, height);
  }

  setMode(mode) {
    this.isCustomMode = mode === 'custom';

    if (this.isCustomMode) {
      this.dom.tabPresets.classList.remove('active');
      this.dom.tabCustom.classList.add('active');
      this.dom.panelPresets.style.display = 'none';
      this.dom.panelCustom.style.display = 'block';

      this.routeBuilder.clear();
      this.mapManager.clearRoute();
      this.dom.btnUndo.disabled = true;
      this.dom.btnReverse.disabled = true;
      this.dom.btnClear.disabled = true;

      this.currentRoute = this.routeBuilder.toRouteObject();
      this.loadRoute(this.currentRoute);
      this.showToast('Mode Gambar Aktif: Klik peta untuk membuat titik jalur rute kustom Anda!', 'info');
    } else {
      this.dom.tabPresets.classList.add('active');
      this.dom.tabCustom.classList.remove('active');
      this.dom.panelPresets.style.display = 'block';
      this.dom.panelCustom.style.display = 'none';

      this.selectPreset(TASIK_GRAVEL_ROUTES[0]);
    }
  }

  async handleMapClick(e) {
    if (!this.isCustomMode) return;

    const { lat, lng } = e.latlng;
    this.routeBuilder.addPoint(lat, lng);

    const count = this.routeBuilder.getWaypointsCount();
    if (count >= 2) {
      this.showToast(`Menghubungkan ke jalan OpenStreetMap Tasikmalaya...`, 'info');
    }

    await this.routeBuilder.resolveRoadGeometry();

    const customRoute = this.routeBuilder.toRouteObject('Rute Kustom Tasikmalaya', 'Rute buatan pengguna melalui mode Route Builder.');
    this.currentRoute = customRoute;
    this.loadRoute(customRoute);

    this.dom.btnUndo.disabled = count === 0;
    this.dom.btnReverse.disabled = count < 2;
    this.dom.btnClear.disabled = count === 0;

    this.showToast(`Titik ke-${count} terhubung ke jalan riil!`, 'info');
  }

  attachEventListeners() {
    // Mode Switching
    this.dom.tabPresets.addEventListener('click', () => this.setMode('presets'));
    this.dom.tabCustom.addEventListener('click', () => this.setMode('custom'));

    // Route Builder Controls
    this.dom.btnUndo.addEventListener('click', async () => {
      if (this.routeBuilder.undo()) {
        await this.routeBuilder.resolveRoadGeometry();
        const customRoute = this.routeBuilder.toRouteObject();
        this.currentRoute = customRoute;
        this.loadRoute(customRoute);
        const count = this.routeBuilder.getWaypointsCount();
        this.dom.btnUndo.disabled = count === 0;
        this.dom.btnReverse.disabled = count < 2;
        this.dom.btnClear.disabled = count === 0;
        this.showToast('Titik dibatalkan', 'info');
      }
    });

    this.dom.btnReverse.addEventListener('click', async () => {
      if (this.routeBuilder.reverse()) {
        await this.routeBuilder.resolveRoadGeometry();
        const customRoute = this.routeBuilder.toRouteObject();
        this.currentRoute = customRoute;
        this.loadRoute(customRoute);
        this.showToast('Arah rute dibalik', 'info');
      }
    });

    this.dom.btnClear.addEventListener('click', () => {
      this.routeBuilder.clear();
      this.mapManager.clearRoute();
      const customRoute = this.routeBuilder.toRouteObject();
      this.currentRoute = customRoute;
      this.loadRoute(customRoute);
      this.dom.btnUndo.disabled = true;
      this.dom.btnReverse.disabled = true;
      this.dom.btnClear.disabled = true;
      this.showToast('Rute kustom dibersihkan', 'info');
    });

    // Map Click Listener
    if (this.map) {
      this.map.on('click', (e) => this.handleMapClick(e));
    }

    // Basemap Layer Switcher
    this.dom.layerSelect.addEventListener('change', (e) => {
      this.mapManager.switchBaseLayer(e.target.value);
      this.showToast(`Lapisan peta: ${e.target.selectedOptions[0].text}`, 'info');
    });

    // Quick Center Tasikmalaya
    this.dom.btnQuickCenter.addEventListener('click', () => {
      this.mapManager.centerOnTasikmalaya();
      this.showToast('Pusat peta diarahkan ke Alun-alun Kota Tasikmalaya', 'info');
    });

    // Elevation Drawer Toggle
    const toggleDrawer = () => {
      this.dom.elevationDrawer.classList.toggle('collapsed');
    };
    this.dom.btnToggleElevation.addEventListener('click', toggleDrawer);
    this.dom.btnCloseElevation.addEventListener('click', toggleDrawer);

    // Elevation Chart Scrubbing Synchronization
    const chartEl = this.dom.elevationChart;
    const handleScrub = (clientX) => {
      if (!this.currentRoute || !this.currentRoute.points || this.currentRoute.points.length < 2) return;
      const rect = chartEl.getBoundingClientRect();
      const fraction = (clientX - rect.left) / rect.width;
      const scrubData = getScrubTelemetry(this.currentRoute.points, fraction);

      if (scrubData && scrubData.point) {
        const { lat, lon, ele } = scrubData.point;
        this.mapManager.setCrosshairPosition(lat, lon);

        const metrics = computeRouteMetrics(this.currentRoute.points.slice(0, scrubData.index + 1));
        this.dom.scrubPill.style.display = 'inline-block';
        this.dom.scrubPill.textContent = `Jarak: ${metrics.totalDistanceKm.toFixed(1)} km | Alt: ${Math.round(ele)} mdpl`;
      }
    };

    chartEl.addEventListener('mousemove', (e) => handleScrub(e.clientX));
    chartEl.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        handleScrub(e.touches[0].clientX);
      }
    });

    chartEl.addEventListener('mouseleave', () => {
      this.mapManager.clearCrosshair();
      this.dom.scrubPill.style.display = 'none';
    });

    // Download GPX Button
    this.dom.btnDownloadGpx.addEventListener('click', () => {
      if (!this.currentRoute || !this.currentRoute.points || this.currentRoute.points.length === 0) {
        this.showToast('Belum ada rute untuk diunduh. Buat atau pilih rute terlebih dahulu.', 'error');
        return;
      }

      const res = downloadGpxFile(this.currentRoute);
      this.showToast(`Berhasil mengunduh ${res.filename}! Siap dipakai di Garmin, Wahoo, atau Strava.`, 'success');
    });

    // Window Resize -> Re-render elevation SVG responsive
    window.addEventListener('resize', () => {
      if (this.currentRoute?.points) {
        this.renderElevationChart(this.currentRoute.points);
      }
    });
  }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new GravelApp();
  app.init();
});
