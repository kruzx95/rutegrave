// tests/test-mapManager.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { MapManager, BASE_LAYERS_CONFIG, TASIKMALAYA_CENTER } from '../js/modules/mapManager.js';

test('MapManager exports center and basemap configurations', () => {
  assert.equal(TASIKMALAYA_CENTER.lat, -7.3274);
  assert.equal(TASIKMALAYA_CENTER.lon, 108.2207);

  assert.ok(BASE_LAYERS_CONFIG.cyclosm);
  assert.ok(BASE_LAYERS_CONFIG.satellite);
  assert.ok(BASE_LAYERS_CONFIG.topo);
  assert.ok(BASE_LAYERS_CONFIG.osm);
});

test('MapManager handles mock Leaflet instance', () => {
  let centerCalled = null;
  let zoomCalled = null;
  const mockMap = {
    setView: (center, zoom) => {
      centerCalled = center;
      zoomCalled = zoom;
      return mockMap;
    },
    addLayer: () => mockMap,
    removeLayer: () => mockMap,
    fitBounds: () => mockMap,
    on: () => mockMap
  };

  const mockL = {
    map: (id, opts) => {
      centerCalled = opts.center;
      zoomCalled = opts.zoom;
      return mockMap;
    },
    tileLayer: (url, opts) => ({
      url,
      opts,
      addTo: () => mockMap,
      remove: () => mockMap
    }),
    polyline: (coords, opts) => ({
      addTo: () => ({ remove: () => {} }),
      getBounds: () => ({ isValid: () => true })
    }),
    marker: (coords, opts) => ({
      addTo: () => ({ setLatLng: () => {}, remove: () => {} })
    }),
    divIcon: (opts) => opts,
    latLngBounds: () => ({ isValid: () => true })
  };

  const manager = new MapManager(mockL);
  manager.init('mock-container');
  assert.deepEqual(centerCalled, [-7.3274, 108.2207]);
  assert.equal(zoomCalled, 12);
});
