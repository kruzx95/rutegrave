// tests/test-routes.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { TASIK_GRAVEL_ROUTES } from '../js/data/routes.js';

test('TASIK_GRAVEL_ROUTES contains 4 verified Tasikmalaya routes', () => {
  assert.equal(TASIK_GRAVEL_ROUTES.length, 4);

  const ids = TASIK_GRAVEL_ROUTES.map(r => r.id);
  assert.deepEqual(ids, ['galunggung-foothills', 'cirahong-ciwulan', 'situ-gede-kawalu', 'taraju-climber']);

  TASIK_GRAVEL_ROUTES.forEach(route => {
    assert.ok(route.name.length > 5, `Route ${route.id} should have descriptive name`);
    assert.ok(route.description.length > 20, `Route ${route.id} should have description`);
    assert.ok(route.points.length >= 25, `Route ${route.id} should have realistic points count`);
    assert.ok(route.surfaceRatio.gravel > 0, `Route ${route.id} should specify gravel ratio`);
    assert.ok(route.recommendedTire, `Route ${route.id} should specify recommended tire`);

    // Ensure all points are within the Tasikmalaya & surrounding mountain area bounds (-7.6 to -7.0 lat, 108.0 to 108.4 lon)
    route.points.forEach((p, idx) => {
      assert.ok(p.lat < -7.0 && p.lat > -7.6, `Lat ${p.lat} at point ${idx} out of Tasikmalaya bounds`);
      assert.ok(p.lon > 108.0 && p.lon < 108.5, `Lon ${p.lon} at point ${idx} out of Tasikmalaya bounds`);
      assert.ok(p.ele > 100 && p.ele < 1500, `Elevation ${p.ele} at point ${idx} invalid`);
    });
  });
});
