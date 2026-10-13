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
  assert.match(xml, /<metadata>\s*<name>Galunggung Gravel Test<\/name>/);
  assert.match(xml, /<desc>Mixed-road test loop in Tasikmalaya<\/desc>/);
  assert.match(xml, /<trkpt lat="-7.284500" lon="108.182000"><ele>582.4<\/ele>/);
  assert.match(xml, /<trkpt lat="-7.285000" lon="108.183000"><ele>585.1<\/ele>/);
  assert.match(xml, /<\/gpx>$/);
});

test('generateGpxXml handles empty route gracefully', () => {
  const xml = generateGpxXml({ name: 'Empty Route', points: [] });
  assert.match(xml, /<trk>\s*<name>Empty Route<\/name>\s*<trkseg><\/trkseg>\s*<\/trk>/);
});

test('generateGpxXml escapes special XML characters in name and description', () => {
  const mockRoute = {
    name: 'Cirahong & Ciwulan <Fast & Flowing>',
    description: 'Test & "quoted" characters',
    points: [{ lat: -7.3200, lon: 108.2200, ele: 350 }]
  };
  const xml = generateGpxXml(mockRoute);
  assert.match(xml, /Cirahong &amp; Ciwulan &lt;Fast &amp; Flowing&gt;/);
  assert.match(xml, /Test &amp; &quot;quoted&quot; characters/);
});
