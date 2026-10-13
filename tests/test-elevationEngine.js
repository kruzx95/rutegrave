// tests/test-elevationEngine.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDistanceKm, computeRouteMetrics, generateElevationSvg } from '../js/modules/elevationEngine.js';

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

test('generateElevationSvg produces SVG polygon and polyline markup', () => {
  const points = [
    { lat: -7.3200, lon: 108.2200, ele: 350 },
    { lat: -7.3100, lon: 108.2200, ele: 400 }
  ];
  const svg = generateElevationSvg(points, 600, 150);
  assert.match(svg, /<svg/);
  assert.match(svg, /<polygon/);
  assert.match(svg, /<\/svg>/);
});
