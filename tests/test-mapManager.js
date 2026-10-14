// tests/test-mapManager.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { MapManager, BASE_LAYERS_CONFIG, TASIKMALAYA_CENTER, calculateBearing, findPointAtKm } from '../js/modules/mapManager.js';

test('calculateBearing calculates directional compass heading correctly', () => {
  // Heading North
  const north = calculateBearing(0, 0, 1, 0);
  assert.equal(Math.round(north), 0);

  // Heading East
  const east = calculateBearing(0, 0, 0, 1);
  assert.equal(Math.round(east), 90);

  // Heading South
  const south = calculateBearing(1, 0, 0, 0);
  assert.equal(Math.round(south), 180);
});

test('findPointAtKm finds appropriate coordinates along route points', () => {
  const points = [
    { lat: -7.3274, lon: 108.2207, ele: 350 },
    { lat: -7.3374, lon: 108.2207, ele: 360 }, // ~1.11 km south
    { lat: -7.3474, lon: 108.2207, ele: 370 }, // ~2.22 km south
    { lat: -7.3574, lon: 108.2207, ele: 380 }  // ~3.33 km south
  ];

  const startPt = findPointAtKm(points, 0);
  assert.equal(startPt.index, 0);
  assert.equal(startPt.point.lat, -7.3274);

  const midPt = findPointAtKm(points, 1.5);
  assert.ok(midPt.index >= 1);
  assert.ok(midPt.distanceKm > 1.0);

  const endPt = findPointAtKm(points, 10.0);
  assert.equal(endPt.index, points.length - 1);
});

test('MapManager exports center and basemap configurations', () => {
  assert.equal(TASIKMALAYA_CENTER.lat, -7.3274);
  assert.equal(TASIKMALAYA_CENTER.lon, 108.2207);

  assert.ok(BASE_LAYERS_CONFIG.cyclosm);
  assert.ok(BASE_LAYERS_CONFIG.satellite);
  assert.ok(BASE_LAYERS_CONFIG.topo);
  assert.ok(BASE_LAYERS_CONFIG.osm);
});

test('MapManager handles mock Leaflet instance and loop route rendering', () => {
  let centerCalled = null;
  let zoomCalled = null;
  const addedMarkers = [];

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
    marker: (coords, opts) => {
      const m = {
        coords,
        opts,
        addTo: () => {
          addedMarkers.push({ coords, opts });
          return m;
        },
        setLatLng: () => {},
        remove: () => {}
      };
      return m;
    },
    divIcon: (opts) => opts,
    latLngBounds: () => ({ isValid: () => true })
  };

  const manager = new MapManager(mockL);
  manager.init('mock-container');
  assert.deepEqual(centerCalled, [-7.3274, 108.2207]);
  assert.equal(zoomCalled, 12);

  // Test rendering a loop route
  const loopPoints = [
    { lat: -7.3274, lon: 108.2207, ele: 350 },
    { lat: -7.3374, lon: 108.2207, ele: 360 },
    { lat: -7.3474, lon: 108.2307, ele: 370 },
    { lat: -7.3374, lon: 108.2407, ele: 380 },
    { lat: -7.3274, lon: 108.2307, ele: 360 },
    { lat: -7.3274, lon: 108.2207, ele: 350 } // exact loop back
  ];

  manager.renderRoute(loopPoints, { autoFit: false });
  assert.ok(manager.startMarker);
  assert.ok(addedMarkers.length >= 1);
});
