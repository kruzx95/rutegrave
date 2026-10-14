/**
 * Tasikmalaya Gravel Navigator - Main Application Controller
 */

import { MapManager } from './modules/mapManager.js';
import { RouteBuilderState } from './modules/routeBuilder.js';
import { TASIK_GRAVEL_ROUTES } from './data/routes.js';
import { downloadGpxFile } from './modules/gpxExporter.js';
import { computeRouteMetrics, generateElevationSvg, getScrubTelemetry } from './modules/elevationEngine.js';
import { parseGpxXml, gpxToRouteObject } from './modules/gpxImporter.js';

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
      panelImport: document.getElementById('panel-import'),
      tabPresets: document.getElementById('tab-presets'),
      tabCustom: document.getElementById('tab-custom'),
      tabImport: document.getElementById('tab-import'),
      
      gpxDropzone: document.getElementById('gpx-dropzone'),
      gpxFileInput: document.getElementById('gpx-file-input'),
      btnBrowseGpx: document.getElementById('btn-browse-gpx'),
      importStatusBox: document.getElementById('import-status-box'),
      importStatusTitle: document.getElementById('import-status-title'),
      importStatusDesc: document.getElementById('import-status-desc'),
      
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
      routeFlowBox: document.getElementById('route-flow-box'),
      routeSectorsBox: document.getElementById('route-sectors-box'),
      btnDownloadGpx: document.getElementById('btn-download-gpx'),
      
      layerSelect: document.getElementById('select-layer'),
      btnQuickCenter: document.getElementById('btn-quick-center'),
      btnAnimateRoute: document.getElementById('btn-animate-route'),
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
    if (this.mapManager.isAnimating()) {
      this.mapManager.stopAnimation();
      if (this.dom.btnAnimateRoute) {
        this.dom.btnAnimateRoute.textContent = '▶ Putar Arah Gowes';
        this.dom.btnAnimateRoute.classList.remove('active');
      }
    }
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

    // Render Elevation Profile with Key Sectors
    this.renderElevationChart(route.points, { keySectors: route.keySectors || [] });

    // Render Directional Flow Timeline (Pergi & Pulang/Finish)
    this.renderRouteFlow(route);

    // Render Key ClimbPro Gravel Sectors
    this.renderRouteSectors(route);
  }

  renderRouteFlow(route) {
    if (!this.dom.routeFlowBox) return;
    this.dom.routeFlowBox.innerHTML = '';

    if (!route || !Array.isArray(route.points) || route.points.length === 0) {
      this.dom.routeFlowBox.innerHTML = '<div class="flow-step-item">Belum ada titik rute.</div>';
      return;
    }

    const totalDist = route.distanceKm || computeRouteMetrics(route.points).totalDistanceKm;
    const halfDist = totalDist / 2;

    let itinerary = route.itinerary;
    if (!Array.isArray(itinerary) || itinerary.length === 0) {
      itinerary = [
        { km: '0 km', label: 'Start: Titik Awal Gowes' },
        { km: `${halfDist.toFixed(1)} km`, label: 'Titik Balik Jalur (Midpoint)' },
        { km: `${totalDist.toFixed(1)} km`, label: 'Finish: Titik Akhir Gowes' }
      ];
    }

    const outboundSteps = [];
    const inboundSteps = [];

    itinerary.forEach((step) => {
      const kmNum = parseFloat(step.km) || 0;
      if (kmNum <= halfDist) {
        outboundSteps.push({ ...step, kmNum, isOutbound: true });
      } else {
        inboundSteps.push({ ...step, kmNum, isOutbound: false });
      }
    });

    const createStepElement = (step) => {
      const row = document.createElement('div');
      row.className = 'flow-step-item';
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', `${step.label} pada kilometer ${step.km}`);

      const badgeClass = step.isOutbound ? 'outbound' : 'inbound';
      row.innerHTML = `
        <span class="flow-step-badge ${badgeClass}">${step.km}</span>
        <span class="flow-step-name">${step.label}</span>
      `;

      const activatePoint = () => {
        const ptObj = this.mapManager.findPointAtKm(route.points, step.kmNum);
        if (ptObj && ptObj.point) {
          this.mapManager.setCrosshairPosition(ptObj.point.lat, ptObj.point.lon);
          if (this.map) {
            this.map.panTo([ptObj.point.lat, ptObj.point.lon]);
          }
          this.dom.scrubPill.style.display = 'inline-block';
          this.dom.scrubPill.textContent = `${step.label} (${step.km}) | Alt: ${Math.round(ptObj.point.ele || 0)} mdpl`;
          this.showToast(`Titik: ${step.label}`, 'info');
        }
      };

      row.addEventListener('click', activatePoint);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activatePoint();
        }
      });

      return row;
    };

    if (outboundSteps.length > 0) {
      const outCard = document.createElement('div');
      outCard.className = 'flow-phase-card';
      outCard.innerHTML = `<div class="flow-phase-title outbound"><span>🟢 Jalur Berangkat (Pergi)</span><span>0 - ${Math.round(halfDist)} km</span></div>`;
      outboundSteps.forEach((s) => outCard.appendChild(createStepElement(s)));
      this.dom.routeFlowBox.appendChild(outCard);
    }

    if (inboundSteps.length > 0) {
      const inCard = document.createElement('div');
      inCard.className = 'flow-phase-card';
      inCard.innerHTML = `<div class="flow-phase-title inbound"><span>🏁 Jalur Menuju Finish</span><span>${Math.round(halfDist)} - ${Math.round(totalDist)} km</span></div>`;
      inboundSteps.forEach((s) => inCard.appendChild(createStepElement(s)));
      this.dom.routeFlowBox.appendChild(inCard);
    }
  }

  renderRouteSectors(route) {
    if (!this.dom.routeSectorsBox) return;
    this.dom.routeSectorsBox.innerHTML = '';

    const sectors = route.keySectors || [];
    if (!Array.isArray(sectors) || sectors.length === 0) {
      this.dom.routeSectorsBox.innerHTML = '<div class="flow-step-item">Rute kustom atau belum ada data sektor kunci.</div>';
      return;
    }

    sectors.forEach((sec) => {
      const card = document.createElement('div');
      card.className = 'sector-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', `Sektor ${sec.name}`);

      card.innerHTML = `
        <div class="sector-header">
          <span class="sector-title">${sec.name}</span>
          <span class="sector-cat-badge">${sec.category}</span>
        </div>
        <div class="sector-stats">
          <span class="sector-stat-item">📏 <strong>${sec.lengthKm} km</strong></span>
          <span class="sector-stat-item">📈 Rerata: <strong>${sec.avgGrade > 0 ? '+' : ''}${sec.avgGrade}%</strong></span>
          <span class="sector-stat-item">🔺 Max: <strong>${sec.maxGrade > 0 ? '+' : ''}${sec.maxGrade}%</strong></span>
          <span class="sector-stat-item">⛰️ <strong>${sec.elevationGainM > 0 ? '+' : ''}${sec.elevationGainM}m</strong></span>
        </div>
        <div class="sector-surface-tag">🪨 ${sec.surface}</div>
        <div class="sector-desc">${sec.description}</div>
      `;

      const activateSector = () => {
        this.mapManager.highlightSector(route.points, sec.startKm, sec.endKm);
        this.dom.routeSectorsBox.querySelectorAll('.sector-card').forEach((c) => c.classList.remove('active'));
        card.classList.add('active');
        this.dom.elevationDrawer.classList.remove('collapsed');
        this.showToast(`Sektor disorot: ${sec.name} (${sec.startKm} - ${sec.endKm} km)`, 'info');
      };

      card.addEventListener('click', activateSector);
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateSector();
        }
      });

      this.dom.routeSectorsBox.appendChild(card);
    });
  }

  renderElevationChart(points, options = {}) {
    if (!this.dom.elevationChart) return;
    const width = this.dom.elevationChart.clientWidth || 650;
    const height = 110;
    const chartOpts = options.keySectors ? options : { keySectors: this.currentRoute?.keySectors || [] };
    this.dom.elevationChart.innerHTML = generateElevationSvg(points, width, height, chartOpts);
  }

  setMode(mode) {
    this.isCustomMode = mode === 'custom';

    if (mode === 'custom') {
      this.dom.tabPresets.classList.remove('active');
      this.dom.tabCustom.classList.add('active');
      this.dom.tabImport.classList.remove('active');
      this.dom.panelPresets.style.display = 'none';
      this.dom.panelCustom.style.display = 'block';
      this.dom.panelImport.style.display = 'none';

      this.routeBuilder.clear();
      this.mapManager.clearRoute();
      this.dom.btnUndo.disabled = true;
      this.dom.btnReverse.disabled = true;
      this.dom.btnClear.disabled = true;

      this.currentRoute = this.routeBuilder.toRouteObject();
      this.loadRoute(this.currentRoute);
      this.showToast('Mode Gambar Aktif: Klik peta untuk membuat titik jalur rute kustom Anda!', 'info');
    } else if (mode === 'import') {
      this.dom.tabPresets.classList.remove('active');
      this.dom.tabCustom.classList.remove('active');
      this.dom.tabImport.classList.add('active');
      this.dom.panelPresets.style.display = 'none';
      this.dom.panelCustom.style.display = 'none';
      this.dom.panelImport.style.display = 'block';

      this.showToast('Mode Impor GPX: Tarik & lepas file .gpx atau klik tombol pilih berkas.', 'info');
    } else {
      this.dom.tabPresets.classList.add('active');
      this.dom.tabCustom.classList.remove('active');
      this.dom.tabImport.classList.remove('active');
      this.dom.panelPresets.style.display = 'block';
      this.dom.panelCustom.style.display = 'none';
      this.dom.panelImport.style.display = 'none';

      this.selectPreset(TASIK_GRAVEL_ROUTES[0]);
    }
  }

  handleGpxFile(file) {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.gpx') && file.type !== 'application/gpx+xml') {
      this.showToast('Harap pilih berkas dengan format .gpx', 'error');
      return;
    }

    this.showToast(`Membaca berkas ${file.name}...`, 'info');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const xmlStr = e.target.result;
        const parsedData = parseGpxXml(xmlStr);
        const importedRoute = gpxToRouteObject(parsedData, (lat, lon) => this.routeBuilder.estimateElevation(lat, lon));

        this.currentRoute = importedRoute;
        this.loadRoute(importedRoute);

        if (this.dom.importStatusBox) {
          this.dom.importStatusBox.style.display = 'flex';
          this.dom.importStatusTitle.textContent = importedRoute.name;
          this.dom.importStatusDesc.textContent = `${importedRoute.points.length} titik koordinat | ${importedRoute.distanceKm} km | +${importedRoute.elevationGainM}m gain`;
        }

        this.showToast(`Berhasil mengimpor rute: ${importedRoute.name}!`, 'success');
      } catch (err) {
        console.error(err);
        this.showToast(`Gagal membaca file GPX: ${err.message}`, 'error');
      }
    };

    reader.onerror = () => {
      this.showToast('Gagal membuka berkas dari perangkat.', 'error');
    };

    reader.readAsText(file);
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
    if (this.dom.tabImport) {
      this.dom.tabImport.addEventListener('click', () => this.setMode('import'));
    }

    // GPX Dropzone and File Picker
    if (this.dom.btnBrowseGpx && this.dom.gpxFileInput) {
      this.dom.btnBrowseGpx.addEventListener('click', (e) => {
        e.stopPropagation();
        this.dom.gpxFileInput.click();
      });
    }

    if (this.dom.gpxDropzone && this.dom.gpxFileInput) {
      this.dom.gpxDropzone.addEventListener('click', () => {
        this.dom.gpxFileInput.click();
      });

      this.dom.gpxFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.handleGpxFile(e.target.files[0]);
        }
      });

      const dropzone = this.dom.gpxDropzone;
      ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.add('dragover');
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.classList.remove('dragover');
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt && dt.files && dt.files[0]) {
          this.handleGpxFile(dt.files[0]);
        }
      });
    }

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

    // Simulasi Arah Gowes Animation
    if (this.dom.btnAnimateRoute) {
      this.dom.btnAnimateRoute.addEventListener('click', () => {
        if (!this.currentRoute || !this.currentRoute.points || this.currentRoute.points.length < 2) {
          this.showToast('Belum ada jalur rute untuk disimulasikan.', 'error');
          return;
        }

        if (this.mapManager.isAnimating()) {
          this.mapManager.stopAnimation();
          this.dom.btnAnimateRoute.textContent = '▶ Putar Arah Gowes';
          this.dom.btnAnimateRoute.classList.remove('active');
          this.showToast('Simulasi arah gowes dihentikan', 'info');
          return;
        }

        this.dom.btnAnimateRoute.textContent = '⏹ Hentikan';
        this.dom.btnAnimateRoute.classList.add('active');
        this.dom.elevationDrawer.classList.remove('collapsed');

        const totalDist = this.currentRoute.distanceKm || computeRouteMetrics(this.currentRoute.points).totalDistanceKm;

        this.mapManager.animateRouteFlow(
          this.currentRoute.points,
          (idx, pt, isDone) => {
            const fraction = idx / Math.max(1, this.currentRoute.points.length - 1);
            const scrubData = getScrubTelemetry(this.currentRoute.points, fraction, this.currentRoute.keySectors);
            const totalDist = this.currentRoute.distanceKm || computeRouteMetrics(this.currentRoute.points).totalDistanceKm;
            const curKm = scrubData ? scrubData.currentKm : 0;
            const isOutbound = curKm <= totalDist / 2;
            const phase = isOutbound ? '🟢 Pergi' : '🏁 Finish';
            const cat = scrubData?.gradientCategory || { color: '#2ecc71', textColor: '#ffffff' };
            const sectorText = scrubData?.activeSector ? ` | ⛰️ <span style="color:#ffb703;">${scrubData.activeSector.name}</span>` : '';

            this.dom.scrubPill.style.display = 'inline-flex';
            this.dom.scrubPill.innerHTML = `
              <span>🚴 ${curKm} / ${totalDist.toFixed(1)} km</span>
              <span>⛰️ ${Math.round(pt.ele || 0)}m</span>
              <span class="scrub-grade-pill" style="background-color: ${cat.color}; color: ${cat.textColor};">${scrubData?.gradientPct > 0 ? '+' : ''}${scrubData?.gradientPct}%</span>
              <span>[${phase}]</span>
              ${sectorText}
            `;
          },
          () => {
            this.dom.btnAnimateRoute.textContent = '▶ Putar Arah Gowes';
            this.dom.btnAnimateRoute.classList.remove('active');
            this.showToast('Simulasi selesai mencapai garis Finish!', 'info');
          }
        );
      });
    }

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
      const scrubData = getScrubTelemetry(this.currentRoute.points, fraction, this.currentRoute.keySectors);

      if (scrubData && scrubData.point) {
        const { lat, lon, ele } = scrubData.point;
        this.mapManager.setCrosshairPosition(lat, lon);

        const cat = scrubData.gradientCategory || { color: '#2ecc71', textColor: '#ffffff' };
        const sectorText = scrubData.activeSector ? ` | ⛰️ <span style="color:#ffb703;">${scrubData.activeSector.name}</span>` : '';

        this.dom.scrubPill.style.display = 'inline-flex';
        this.dom.scrubPill.innerHTML = `
          <span>📏 ${scrubData.currentKm} km</span>
          <span>⛰️ ${Math.round(ele)}m</span>
          <span class="scrub-grade-pill" style="background-color: ${cat.color}; color: ${cat.textColor};">${scrubData.gradientPct > 0 ? '+' : ''}${scrubData.gradientPct}%</span>
          ${sectorText}
        `;
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
