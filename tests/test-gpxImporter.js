import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGpxXml, detectKeySectorsFromPoints, gpxToRouteObject } from '../js/modules/gpxImporter.js';

test('parseGpxXml parses track name, description, and coordinates', () => {
  const gpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="StravaGPX">
  <metadata>
    <name>Morning Tasik Gravel Ride</name>
    <desc>Uji coba jalur pedesaan</desc>
  </metadata>
  <trk>
    <name>Morning Tasik Gravel Ride</name>
    <trkseg>
      <trkpt lat="-7.3274" lon="108.2207">
        <ele>350.5</ele>
      </trkpt>
      <trkpt lat="-7.3374" lon="108.2207">
        <ele>362.0</ele>
      </trkpt>
      <trkpt lat="-7.3474" lon="108.2207">
        <ele>375.2</ele>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

  const result = parseGpxXml(gpxXml);
  assert.equal(result.name, 'Morning Tasik Gravel Ride');
  assert.equal(result.points.length, 3);
  assert.equal(result.points[0].lat, -7.3274);
  assert.equal(result.points[0].lon, 108.2207);
  assert.equal(result.points[0].ele, 350.5);
  assert.equal(result.points[2].ele, 375.2);
});

test('parseGpxXml handles empty or invalid xml gracefully', () => {
  assert.throws(() => parseGpxXml(''), /Konten file GPX kosong/);
  assert.throws(() => parseGpxXml('<gpx><trk><name>Empty</name></trk></gpx>'), /tidak memiliki titik koordinat/);
});

test('gpxToRouteObject converts parsed data into full GravelApp route', () => {
  const parsedData = {
    name: 'Gravel Manonjaya',
    description: 'Rute sungai Ciwulan',
    points: [
      { lat: -7.3274, lon: 108.2207, ele: 350 },
      { lat: -7.3374, lon: 108.2207, ele: 370 },
      { lat: -7.3474, lon: 108.2207, ele: 395 },
      { lat: -7.3574, lon: 108.2207, ele: 420 }
    ]
  };

  const route = gpxToRouteObject(parsedData);
  assert.ok(route.id.startsWith('imported-'));
  assert.equal(route.name, 'Gravel Manonjaya');
  assert.ok(route.distanceKm > 3);
  assert.equal(route.elevationGainM, 70);
  assert.ok(Array.isArray(route.itinerary));
  assert.equal(route.itinerary.length, 3);
});
