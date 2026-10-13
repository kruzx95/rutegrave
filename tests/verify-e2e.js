// tests/verify-e2e.js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { TASIK_GRAVEL_ROUTES } from '../js/data/routes.js';
import { generateGpxXml } from '../js/modules/gpxExporter.js';
import { computeRouteMetrics, generateElevationSvg } from '../js/modules/elevationEngine.js';

test('index.html contains all critical semantic elements, attributes, and scripts', () => {
  const html = fs.readFileSync('index.html', 'utf8');

  // Semantic layout
  assert.match(html, /<header class="app-header">/);
  assert.match(html, /<main class="app-workspace">/);
  assert.match(html, /<aside class="app-sidebar"/);
  assert.match(html, /<div id="map"/);
  assert.match(html, /id="elevation-drawer"/);
  assert.match(html, /id="btn-download-gpx"/);
  assert.match(html, /id="preset-routes-container"/);
  assert.match(html, /id="select-layer"/);

  // Linkages
  assert.match(html, /styles\/main\.css/);
  assert.match(html, /js\/app\.js/);
  assert.match(html, /leaflet\.css/);
  assert.match(html, /leaflet\.js/);

  // Anti-slop check: No em-dash
  assert.ok(!html.includes('—'), 'No em-dash (—) allowed per anti-slop rules');
});

test('main.css contains dark theme tokens and responsive rules', () => {
  const css = fs.readFileSync('styles/main.css', 'utf8');
  assert.match(css, /--bg-base:\s*#0f1315/);
  assert.match(css, /--accent-amber:\s*#e67e22/);
  assert.match(css, /@media\s*\(max-width:\s*900px\)/);
  assert.match(css, /min-height:\s*44px/);
});

test('all curated Tasikmalaya routes produce valid GPX 1.1 XML and valid SVG elevations', () => {
  assert.equal(TASIK_GRAVEL_ROUTES.length, 4);

  TASIK_GRAVEL_ROUTES.forEach((route) => {
    // 1. GPX check
    const gpx = generateGpxXml(route);
    const escapedName = route.name.replace(/&/g, '&amp;');
    assert.match(gpx, /<\?xml version="1.0" encoding="UTF-8"\?>/);
    assert.match(gpx, /<gpx version="1.1"/);
    assert.ok(gpx.includes(`<name>${escapedName}</name>`), `GPX contains <name>${escapedName}</name>`);
    assert.match(gpx, /<trkpt lat="-7\.\d+"/);
    assert.match(gpx, /<ele>\d+\.\d<\/ele>/);
    assert.match(gpx, /<\/gpx>$/);

    // 2. Metrics check
    const metrics = computeRouteMetrics(route.points);
    assert.ok(metrics.totalDistanceKm > 15, `Route ${route.id} distance should exceed 15km`);
    assert.ok(metrics.elevationGainM > 100, `Route ${route.id} elevation gain should exceed 100m`);

    // 3. SVG check
    const svg = generateElevationSvg(route.points, 650, 110);
    assert.match(svg, /<svg/);
    assert.match(svg, /<polygon/);
    assert.match(svg, /<polyline/);
    assert.match(svg, /<\/svg>/);
  });
});
