/**
 * GPX 1.1 Exporter Module
 * Generates TopoGrafix GPX 1.1 standard XML for GPS devices (Garmin, Wahoo, Strava, etc.)
 */

function escapeXml(unsafeStr) {
  if (!unsafeStr) return '';
  return String(unsafeStr)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generates a valid GPX 1.1 XML string from route data
 * @param {Object} route
 * @param {string} route.name
 * @param {string} [route.description]
 * @param {Array<{lat: number, lon: number, ele?: number, time?: string}>} route.points
 * @returns {string} XML string
 */
export function generateGpxXml(route) {
  const name = escapeXml(route?.name || 'Tasikmalaya Gravel Route');
  const desc = escapeXml(route?.description || 'Curated mixed-road gravel route');
  const now = new Date().toISOString();
  const points = Array.isArray(route?.points) ? route.points : [];

  let trkptsXml = '';
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const lat = Number(pt.lat).toFixed(6);
    const lon = Number(pt.lon).toFixed(6);
    const ele = pt.ele !== undefined ? `<ele>${Number(pt.ele).toFixed(1)}</ele>` : '';
    const time = pt.time ? `<time>${escapeXml(pt.time)}</time>` : '';
    trkptsXml += `      <trkpt lat="${lat}" lon="${lon}">${ele}${time}</trkpt>\n`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Tasikmalaya Gravel Navigator"
     xmlns="http://www.topografix.com/GPX/1/1"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${name}</name>
    <desc>${desc}</desc>
    <time>${now}</time>
    <keywords>gravel, cycling, tasikmalaya, mixed-road</keywords>
  </metadata>
  <trk>
    <name>${name}</name>
    <trkseg>${trkptsXml ? '\n' + trkptsXml + '    ' : ''}</trkseg>
  </trk>
</gpx>`;
}

/**
 * Triggers a browser download of the route as a .gpx file
 * @param {Object} route 
 * @param {string} [customFilename] 
 */
export function downloadGpxFile(route, customFilename) {
  const xml = generateGpxXml(route);
  const safeName = (route?.name || 'tasik-gravel-route')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const filename = customFilename || `${safeName}.gpx`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([xml], { type: 'application/gpx+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return { filename, xml };
}
