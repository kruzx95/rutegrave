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

  state.undo(); // Undoes reverse
  assert.equal(state.getPoints()[0].lat, -7.320);
  assert.equal(state.getPoints()[2].lat, -7.300);

  state.undo(); // Undoes last point addition
  assert.equal(state.getPoints().length, 2);
  assert.equal(state.getPoints()[1].lat, -7.310);
});

test('RouteBuilderState estimateSurfaceRatio returns realistic percentages', () => {
  const state = new RouteBuilderState();
  state.addPoint(-7.320, 108.220, 350);
  state.addPoint(-7.240, 108.140, 680); // Moving towards Galunggung foothills (gravel terrain)

  const ratio = state.estimateSurfaceRatio();
  assert.ok(ratio.gravel > 0);
  assert.ok(ratio.brokenPaved >= 0);
  assert.ok(ratio.paved >= 0);
  assert.equal(ratio.gravel + ratio.brokenPaved + ratio.paved, 100);
});

test('RouteBuilderState toRouteObject formats standard route', () => {
  const state = new RouteBuilderState();
  state.addPoint(-7.320, 108.220, 350);
  state.addPoint(-7.310, 108.230, 390);

  const routeObj = state.toRouteObject('Custom Loop', 'My Tasikmalaya custom loop');
  assert.equal(routeObj.id, 'custom-route');
  assert.equal(routeObj.name, 'Custom Loop');
  assert.equal(routeObj.points.length, 2);
});
