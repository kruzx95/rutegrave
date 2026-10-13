# Tasikmalaya Gravel Navigator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, interactive client-side web application for discovering, customizing, and exporting mixed-road gravel cycling routes in Tasikmalaya with GPX 1.1 export and synchronized elevation profile.

**Architecture:** A modular client-side application structured into decoupled JavaScript modules (GPX exporter, elevation engine, map manager, route builder) with Leaflet.js multi-layer mapping (CyclOSM, Satellite, Topo, OSM) and a semantic, accessible dark-theme UI.

**Tech Stack:** HTML5, Modern Vanilla CSS, Vanilla JavaScript (ES6+), Leaflet.js v1.9.4, Node.js built-in `node:test` runner.

**Spec:** `docs/superpowers/specs/2026-10-13-tasikmalaya-gravel-navigator-design.md`

## Global Constraints

- Standalone client-side execution; no external build/compile tools required to run in browser.
- GPX export must strictly conform to TopoGrafix GPX 1.1 XML specification (`http://www.topografix.com/GPX/1/1`).
- All interactive controls must have minimum 44px tap targets for mobile usability.
- WCAG AA color contrast ratio minimum 4.5:1 for normal text, 3:1 for large text.
- No em-dash (`—`) in user-facing UI text per anti-slop guidelines.
- Presets must represent authentic Tasikmalaya geography (Galunggung, Cirahong, Situ Gede, Taraju).

## Review Focus

1. Coordinate bounds outside Tasikmalaya or empty track: GPX exporter must handle empty track gracefully without producing malformed XML.
2. Single-point or zero-elevation route: Elevation engine must handle 0 or 1 point without division by zero or NaN gain.
3. Rapid clicking / waypoint dragging: Route builder must handle updates cleanly without creating disconnected polyline segments.
4. Mobile viewport resize: Layout must maintain map visibility and bottom elevation drawer without horizontal overflow.
5. Tile layer loading failure: Basemap switcher must smoothly fallback without crashing the map canvas.

---

### Task 1: Project Scaffolding & Test Harness Setup

**Files:**
- Create: `package.json`
- Create: `tests/test-scaffold.js`

**Interfaces:**
- Produces: `npm test` script executing Node.js test runner.

- [ ] **Step 1: Write initial test to verify runner**

```javascript
// tests/test-scaffold.js
import test from 'node:test';
import assert from 'node:assert/strict';

test('scaffold environment sanity check', () => {
  assert.equal(1 + 1, 2);
});
```

- [ ] **Step 2: Run test to verify runner works**

Run: `node --test tests/test-scaffold.js`
Expected: PASS

- [ ] **Step 3: Create `package.json` with scripts**

Create `package.json` with:
- `"name": "rutegravel"`
- `"type": "module"`
- `"scripts": { "test": "node --test tests/*.js", "dev": "npx -y serve -l 3000 ." }`

- [ ] **Step 4: Run `npm test` to verify configuration**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tests/test-scaffold.js
git commit -m "chore: scaffold project and test runner"
```

---

### Task 2: GPX 1.1 Exporter Engine & Unit Tests

**Files:**
- Create: `js/modules/gpxExporter.js`
- Create: `tests/test-gpxExporter.js`

**Interfaces:**
- Consumes: Route object with `{ id, name, description, points: [{ lat, lon, ele, time }] }`
- Produces:
  - `generateGpxXml(route: Object) -> string`
  - `downloadGpxFile(route: Object) -> void`

- [ ] **Step 1: Write the failing tests for GPX 1.1 XML generation**

```javascript
// tests/test-gpxExporter.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateGpxXml } from '../js/modules/gpxExporter.js';

test('generateGpxXml produces valid TopoGrafix GPX 1.1 XML', () => {
  const mockRoute = {
    name: 'Galunggung Gravel Test',
    description: 'Mixed-road test loop in Tasikmalaya',
    points: [
      { lat: -7.2845, lon: 108.1820, ele: 582.4, time: '2026-10-13T07:00:00Z' },
      { lat: -7.2850, lon: 108.1830, ele: 585.1, time: '2026-10-13T07:00:15Z' }
    ]
  };

  const xml = generateGpxXml(mockRoute);
  assert.match(xml, /<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<gpx version="1.1" creator="Tasikmalaya Gravel Navigator"/);
  assert.match(xml, /<metadata><name>Galunggung Gravel Test<\/name>/);
  assert.match(xml, /<trkpt lat="-7.284500" lon="108.182000"><ele>582.4<\/ele>/);
  assert.match(xml, /<\/gpx>$/);
});

test('generateGpxXml handles empty route gracefully', () => {
  const xml = generateGpxXml({ name: 'Empty', points: [] });
  assert.match(xml, /<trk><name>Empty<\/name><trkseg><\/trkseg><\/trk>/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-gpxExporter.js`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `generateGpxXml` and `downloadGpxFile` in `js/modules/gpxExporter.js`**

Implement XML string templating conforming to TopoGrafix GPX 1.1 with proper coordinate rounding (6 decimals), elevation formatting, and ISO timestamps.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-gpxExporter.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/modules/gpxExporter.js tests/test-gpxExporter.js
git commit -m "feat: implement GPX 1.1 exporter and tests"
```

---

### Task 3: Elevation & Statistics Engine & Unit Tests

**Files:**
- Create: `js/modules/elevationEngine.js`
- Create: `tests/test-elevationEngine.js`

**Interfaces:**
- Consumes: Array of points `[{ lat, lon, ele }]`
- Produces:
  - `calculateDistanceKm(p1, p2) -> number`
  - `computeRouteMetrics(points) -> { totalDistanceKm, elevationGainM, elevationLossM, minEleM, maxEleM, avgGradientPct }`
  - `generateElevationSvg(points, width, height) -> string`

- [ ] **Step 1: Write the failing tests for metrics calculation**

```javascript
// tests/test-elevationEngine.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistanceKm, computeRouteMetrics, generateElevationSvg } from '../js/modules/elevationEngine.js';

test('calculateDistanceKm computes haversine distance correctly', () => {
  // Tasikmalaya Alun-alun to Situ Gede (~4.8 km)
  const d = calculateDistanceKm(
    { lat: -7.3274, lon: 108.2207 },
    { lat: -7.3400, lon: 108.1800 }
  );
  assert.ok(d > 4.5 && d < 5.2, `Distance was ${d}`);
});

test('computeRouteMetrics calculates gain, loss, and elevations', () => {
  const points = [
    { lat: -7.3200, lon: 108.2200, ele: 350 },
    { lat: -7.3100, lon: 108.2200, ele: 400 }, // +50
    { lat: -7.3000, lon: 108.2200, ele: 380 }, // -20
    { lat: -7.2900, lon: 108.2200, ele: 450 }  // +70
  ];
  const metrics = computeRouteMetrics(points);
  assert.equal(metrics.elevationGainM, 120);
  assert.equal(metrics.elevationLossM, 20);
  assert.equal(metrics.minEleM, 350);
  assert.equal(metrics.maxEleM, 450);
  assert.ok(metrics.totalDistanceKm > 3);
});

test('generateElevationSvg produces SVG polyline markup', () => {
  const points = [
    { lat: -7.3200, lon: 108.2200, ele: 350 },
    { lat: -7.3100, lon: 108.2200, ele: 400 }
  ];
  const svg = generateElevationSvg(points, 600, 150);
  assert.match(svg, /<svg/);
  assert.match(svg, /<polygon/);
  assert.match(svg, /<\/svg>/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-elevationEngine.js`
Expected: FAIL

- [ ] **Step 3: Implement `elevationEngine.js`**

Implement Haversine formula, cumulative distance and elevation gain/loss accumulation with smoothing threshold (ignore micro-jitter < 2m), and SVG path generation.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-elevationEngine.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/modules/elevationEngine.js tests/test-elevationEngine.js
git commit -m "feat: implement elevation metrics and SVG profile engine"
```

---

### Task 4: Curated Tasikmalaya Gravel Routes Dataset

**Files:**
- Create: `js/data/routes.js`
- Create: `tests/test-routes.js`

**Interfaces:**
- Produces: `TASIK_GRAVEL_ROUTES: Array<Route>` with 4 comprehensive route objects.

- [ ] **Step 1: Write tests to validate route data structure and geography**

```javascript
// tests/test-routes.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { TASIK_GRAVEL_ROUTES } from '../js/data/routes.js';

test('TASIK_GRAVEL_ROUTES contains 4 verified Tasikmalaya routes', () => {
  assert.equal(TASIK_GRAVEL_ROUTES.length, 4);

  const ids = TASIK_GRAVEL_ROUTES.map(r => r.id);
  assert.deepEqual(ids, ['galunggung-foothills', 'cirahong-ciwulan', 'situ-gede-kawalu', 'taraju-climber']);

  TASIK_GRAVEL_ROUTES.forEach(route => {
    assert.ok(route.name.length > 5);
    assert.ok(route.points.length >= 25, `Route ${route.id} should have realistic points`);
    assert.ok(route.surfaceRatio.gravel > 0);
    // Ensure coordinates are within Tasikmalaya region (-7.5 to -7.1 lat, 108.0 to 108.4 lon)
    route.points.forEach(p => {
      assert.ok(p.lat < -7.0 && p.lat > -7.6, `Lat ${p.lat} out of Tasikmalaya bounds`);
      assert.ok(p.lon > 108.0 && p.lon < 108.5, `Lon ${p.lon} out of Tasikmalaya bounds`);
      assert.ok(p.ele > 100 && p.ele < 1500, `Ele ${p.ele} invalid`);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-routes.js`
Expected: FAIL

- [ ] **Step 3: Implement `js/data/routes.js`**

Populate high-fidelity GPS track points (lat, lon, ele, segment surface type) for:
1. `galunggung-foothills` (~42.5 km, Sukaratu volcanic sand/macadam)
2. `cirahong-ciwulan` (~35.2 km, Ciwulan riverbed gravel & wooden railway bridge)
3. `situ-gede-kawalu` (~28.4 km, Situ Gede perimeter singletrack & Kawalu plantation)
4. `taraju-climber` (~46.8 km, Taraju green tea estate highland macadam)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-routes.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/data/routes.js tests/test-routes.js
git commit -m "feat: add curated Tasikmalaya gravel routes dataset"
```

---

### Task 5: Map Manager & Multi-Layer Tiles

**Files:**
- Create: `js/modules/mapManager.js`

**Interfaces:**
- Consumes: Leaflet `L` global instance and container DOM element.
- Produces:
  - `initMap(containerId) -> MapManager`
  - `renderRoute(points, options)`
  - `setCrosshairPosition(lat, lon)`
  - `clearRoute()`
  - `switchBaseLayer(layerName)`

- [ ] **Step 1: Implement `js/modules/mapManager.js`**

Implement MapManager class configuring:
- Leaflet map view centered at `[-7.3274, 108.2207]` with zoom 12.
- 4 Tile layers: CyclOSM, OpenStreetMap, OpenTopoMap, and Esri World Imagery (Satellite).
- Polyline rendering with gravel color theme (`#e67e22`) and casing shadow.
- Start marker (Green), Finish marker (Checkered), and Scrubbing Crosshair marker.
- Fit bounds method with smooth animation.

- [ ] **Step 2: Verify in browser context**

Verify syntax and exports via node check:
Run: `node -e "import('./js/modules/mapManager.js')"`
Expected: No syntax errors.

- [ ] **Step 3: Commit**

```bash
git add js/modules/mapManager.js
git commit -m "feat: implement Leaflet map manager with multi-tile basemaps"
```

---

### Task 6: Custom Route Builder Logic

**Files:**
- Create: `js/modules/routeBuilder.js`
- Create: `tests/test-routeBuilder.js`

**Interfaces:**
- Produces:
  - `RouteBuilder` class with methods `addWaypoint(lat, lon)`, `removeWaypoint(index)`, `reverseRoute()`, `clear()`, `getRouteData()`

- [ ] **Step 1: Write test for route builder state logic**

```javascript
// tests/test-routeBuilder.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { RouteBuilderState } from '../js/modules/routeBuilder.js';

test('RouteBuilderState manages waypoints and route reversal', () => {
  const state = new RouteBuilderState();
  state.addPoint(-7.320, 108.220, 350);
  state.addPoint(-7.310, 108.230, 390);
  state.addPoint(-7.300, 108.240, 420);

  assert.equal(state.getPoints().length, 3);
  assert.equal(state.getPoints()[0].lat, -7.320);

  state.reverse();
  assert.equal(state.getPoints()[0].lat, -7.300);
  assert.equal(state.getPoints()[2].lat, -7.320);

  state.undo();
  assert.equal(state.getPoints().length, 2);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/test-routeBuilder.js`
Expected: FAIL

- [ ] **Step 3: Implement `js/modules/routeBuilder.js`**

Implement waypoint management, route reversal, undo/clear actions, and automatic elevation estimation using topographical interpolation.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/test-routeBuilder.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/modules/routeBuilder.js tests/test-routeBuilder.js
git commit -m "feat: implement custom route builder module and tests"
```

---

### Task 7: UI Assembly, Adventure Dark Styling & Application Integration

**Files:**
- Create: `index.html`
- Create: `styles/main.css`
- Create: `js/app.js`

**Interfaces:**
- Produces: Complete working web application running on local server.

- [ ] **Step 1: Create semantic `index.html`**

Markup includes:
- Accessible sidebar with route selection pills, route statistics cards (Distance, Elevation, Surface breakdown, Estimated time, Recommended tire).
- Custom Route Builder mode toggle and action buttons (Undo, Reverse, Clear).
- Primary "Download GPX" button.
- Map viewport with floating quick controls (Layer switcher, Tasikmalaya center reset, Elevation drawer toggle).
- Interactive Bottom Elevation drawer with synchronized canvas/SVG elevation graph and cursor telemetry.
- Leaflet CSS and JS via verified CDN (`unpkg.com/leaflet@1.9.4/dist/leaflet.js`).

- [ ] **Step 2: Create comprehensive `styles/main.css`**

Implement:
- Adventure Gravel Dark Theme CSS custom properties (`--bg-primary: #121516; --accent-amber: #e67e22; --accent-green: #27ae60;`).
- Modern typography (`Outfit` for headings, `Inter` for metrics and clean legibility).
- Responsive layout (desktop sidebar 380px, mobile bottom sheet drawer).
- WCAG AA contrast compliance (4.5:1 minimum).
- Minimum 44px tap targets for mobile usability.
- Subtle glassmorphic control overlays without over-decoration.

- [ ] **Step 3: Implement `js/app.js` entry point**

Wire up:
- Route selection events (loads Galunggung, Cirahong, Situ Gede, Taraju).
- Map clicking for custom route creation.
- Live metric cards update.
- Interactive elevation chart hovering synchronized with map crosshair marker.
- GPX download trigger with toast notification feedback.

- [ ] **Step 4: Commit**

```bash
git add index.html styles/main.css js/app.js
git commit -m "feat: assemble application UI, styles, and controller"
```

---

### Task 8: End-to-End Verification & Browser Click-Through

**Files:**
- Create: `tests/verify-e2e.js`

**Interfaces:**
- Produces: E2E automated checks and browser manual validation evidence.

- [ ] **Step 1: Write E2E verification test script**

```javascript
// tests/verify-e2e.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('index.html contains all critical semantic elements and scripts', () => {
  const html = fs.readFileSync('index.html', 'utf8');
  assert.match(html, /<div id="map"/);
  assert.match(html, /id="elevation-chart"/);
  assert.match(html, /id="btn-download-gpx"/);
  assert.match(html, /id="route-selector"/);
  assert.match(html, /styles\/main\.css/);
  assert.match(html, /js\/app\.js/);
  // Ensure no em-dash is in index.html
  assert.ok(!html.includes('—'), 'No em-dash allowed per anti-slop rules');
});
```

- [ ] **Step 2: Run all test suites**

Run: `npm test`
Expected: ALL PASS

- [ ] **Step 3: Start local development server**

Run: `npx serve -l 3000 .` (or python http.server) and test page load.

- [ ] **Step 4: Perform click-through verification of all interactive features**

- [ ] **Step 5: Final Commit**

```bash
git add .
git commit -m "feat: complete Tasikmalaya Gravel Navigator web app"
```
