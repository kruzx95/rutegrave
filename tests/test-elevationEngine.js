import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDistanceKm,
  computeRouteMetrics,
  generateElevationSvg,
  computeSmoothedGradient,
  getGradientCategory,
  getScrubTelemetry
} from '../js/modules/elevationEngine.js';

test('calculateDistanceKm computes haversine distance correctly', () => {
  // Tasikmalaya Alun-alun (-7.3274, 108.2207) to Situ Gede (-7.3400, 108.1800) (~4.7 km)
  const d = calculateDistanceKm(
    { lat: -7.3274, lon: 108.2207 },
    { lat: -7.3400, lon: 108.1800 }
  );
  assert.ok(d > 4.5 && d < 5.2, `Distance was ${d}`);
});

test('calculateDistanceKm handles same point', () => {
  const d = calculateDistanceKm({ lat: -7.3274, lon: 108.2207 }, { lat: -7.3274, lon: 108.2207 });
  assert.equal(d, 0);
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

test('computeRouteMetrics handles empty or single point array', () => {
  const empty = computeRouteMetrics([]);
  assert.equal(empty.totalDistanceKm, 0);
  assert.equal(empty.elevationGainM, 0);
  assert.equal(empty.minEleM, 0);

  const single = computeRouteMetrics([{ lat: -7.32, lon: 108.22, ele: 400 }]);
  assert.equal(single.totalDistanceKm, 0);
  assert.equal(single.elevationGainM, 0);
  assert.equal(single.minEleM, 400);
  assert.equal(single.maxEleM, 400);
});

test('computeSmoothedGradient and getGradientCategory classify slope accurately', () => {
  const climbPoints = [
    { lat: -7.3200, lon: 108.2200, ele: 300 },
    { lat: -7.3210, lon: 108.2200, ele: 310 },
    { lat: -7.3220, lon: 108.2200, ele: 325 }, // rising
    { lat: -7.3230, lon: 108.2200, ele: 345 }
  ];

  const grade = computeSmoothedGradient(climbPoints, 2);
  assert.ok(grade > 0, `Grade was ${grade}`);

  const catModerate = getGradientCategory(5.5);
  assert.equal(catModerate.label, 'Sedang');
  assert.equal(catModerate.color, '#f1c40f');

  const catSteep = getGradientCategory(9.5);
  assert.equal(catSteep.label, 'Curam');
  assert.equal(catSteep.color, '#e67e22');

  const catWall = getGradientCategory(13.0);
  assert.equal(catWall.label, 'Ekstrem');
  assert.equal(catWall.color, '#e74c3c');

  const catDown = getGradientCategory(-4.0);
  assert.equal(catDown.label, 'Turunan');
  assert.equal(catDown.color, '#3498db');
});

test('generateElevationSvg produces SVG polygon, gradient bars, and sector highlights', () => {
  const points = [
    { lat: -7.3200, lon: 108.2200, ele: 350 },
    { lat: -7.3100, lon: 108.2200, ele: 400 },
    { lat: -7.3000, lon: 108.2200, ele: 450 }
  ];
  const keySectors = [
    {
      name: 'Tanjakan Sukaratu',
      startKm: 0.5,
      endKm: 1.8
    }
  ];

  const svg = generateElevationSvg(points, 600, 150, { keySectors });
  assert.match(svg, /<svg/);
  assert.match(svg, /<polygon/);
  assert.match(svg, /class="gradient-bars"/);
  assert.match(svg, /class="sector-highlights"/);
  assert.match(svg, /⛰️ Sukaratu/);
  assert.match(svg, /<\/svg>/);
});

test('getScrubTelemetry returns distance, altitude, gradient, and active sector', () => {
  const points = [
    { lat: -7.3200, lon: 108.2200, ele: 350 },
    { lat: -7.3100, lon: 108.2200, ele: 380 },
    { lat: -7.3000, lon: 108.2200, ele: 420 }
  ];
  const keySectors = [
    {
      name: 'Sektor Makadam',
      startKm: 0.5,
      endKm: 2.5
    }
  ];

  const scrub = getScrubTelemetry(points, 0.5, keySectors);
  assert.ok(scrub);
  assert.ok(scrub.currentKm > 0);
  assert.ok(typeof scrub.gradientPct === 'number');
  assert.ok(scrub.gradientCategory);
  assert.equal(scrub.activeSector.name, 'Sektor Makadam');
});
