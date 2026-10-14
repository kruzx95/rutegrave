// scratch/build-authentic-routes.js
import fs from 'fs';
import { RouteBuilderState } from '../js/modules/routeBuilder.js';
import { computeRouteMetrics } from '../js/modules/elevationEngine.js';

const state = new RouteBuilderState();

const routeDefinitions = [
  {
    id: 'galunggung-foothills',
    name: 'Galunggung Foothills & Sukaratu Mixed-Road Loop',
    description: 'Rute mixed-road lereng kaki Gunung Galunggung via jalan baru Cisinga, pedesaan Cisayong, tanjakan makadam Sukaratu, dan kawasan pasir vulkanik Galunggung.',
    recommendedTire: '38c - 45c (Tubeless recommended)',
    surfaceRatio: {
      gravel: 45,
      brokenPaved: 35,
      paved: 20
    },
    difficulty: 'Sedang (Moderate)',
    highlights: [
      'Pemandangan kaldera purba dan dinding lava Gunung Galunggung',
      'Jalur makadam batu lepas dan pasir vulkanik di Sukaratu & Sinagar',
      'Koridor jalan pedesaan Cisinga diapit terasering sawah Cisayong',
      'Spot istirahat di warung kopi Cipanas & Leuwisari'
    ],
    itinerary: [
      { km: '0 km', label: 'Start: Alun-alun Kota Tasikmalaya' },
      { km: '14 km', label: 'Indihiang ➔ Koridor Baru Cisinga' },
      { km: '26 km', label: 'Cisayong ➔ Sukaratu (Kaki Galunggung, Makadam & Pasir)' },
      { km: '40 km', label: 'Leuwisari ➔ Singaparna Utara (Turunan)' },
      { km: '52 km', label: 'Finish: Mangkubumi ➔ Alun-alun Tasikmalaya' }
    ],
    waypoints: [
      [108.2215, -7.3272], // Alun-alun Kota (Jalan Mayor Utarya)
      [108.2040, -7.3020], // Indihiang
      [108.1880, -7.2650], // Cisinga
      [108.1630, -7.2480], // Cisayong
      [108.1380, -7.2410], // Sukaratu / lereng Galunggung
      [108.1250, -7.2580], // Cipanas ring
      [108.1400, -7.2840], // Leuwisari
      [108.1550, -7.3320], // Singaparna utara
      [108.1900, -7.3350], // Mangkubumi
      [108.2215, -7.3272]  // Alun-alun Kota (Jalan Mayor Utarya)
    ]
  },
  {
    id: 'cirahong-ciwulan',
    name: 'Cirahong Railway Heritage & Ciwulan River Loop',
    description: 'Eksplorasi jembatan bersejarah Cirahong dengan dek kayu peninggalan 1893 di atas Sungai Ciwulan dilanjutkan jalur gravel persawahan Manonjaya dan Cimaragas.',
    recommendedTire: '35c - 42c',
    surfaceRatio: {
      gravel: 45,
      brokenPaved: 30,
      paved: 25
    },
    difficulty: 'Ringan - Sedang (Rolling)',
    highlights: [
      'Sensasi melintasi Jembatan Cirahong (1893) dengan derit lantai papan kayu',
      'Jalur tanah padat & gravel tepian Sungai Ciwulan',
      'Lanskap persawahan Manonjaya yang asri dan tenang',
      'Jalur perkampungan ramah pesepeda tanpa kebisingan kota'
    ],
    itinerary: [
      { km: '0 km', label: 'Start: Kompleks Dadaha Tasikmalaya' },
      { km: '12 km', label: 'Cibeureum ➔ Persawahan Manonjaya' },
      { km: '20 km', label: 'Jembatan Cirahong (1893) Dek Kayu' },
      { km: '28 km', label: 'Tepian Sungai Ciwulan ➔ Cimaragas (Gravel)' },
      { km: '39 km', label: 'Finish: UNSIL Cilolohan ➔ Dadaha' }
    ],
    waypoints: [
      [108.2250, -7.3350], // Dadaha Start
      [108.2450, -7.3450], // Cibeureum
      [108.2800, -7.3400], // Manonjaya
      [108.3155, -7.3503], // Jembatan Cirahong
      [108.3120, -7.3620], // Ciwulan riverbed
      [108.2750, -7.3780], // Manonjaya selatan
      [108.2400, -7.3750], // Gunung Tandala
      [108.2250, -7.3350]  // Dadaha Finish
    ]
  },
  {
    id: 'situ-gede-kawalu',
    name: 'Situ Gede & Bukit Perkebunan Kawalu Trail',
    description: 'Loop petualangan gravel santai mengitari danau Situ Gede dilanjutkan perbukitan perkebunan rakyat Kawalu dan Urug.',
    recommendedTire: '35c - 40c',
    surfaceRatio: {
      gravel: 35,
      brokenPaved: 40,
      paved: 25
    },
    difficulty: 'Ringan (Scenic & Friendly)',
    highlights: [
      'Gowes sejuk di jalur tanah lingkar tepi danau Situ Gede',
      'Rindang hutan bambu dan perkebunan rakyat Mangkubumi',
      'Panorama perbukitan Kawalu dari ketinggian',
      'Banyak warung lokal untuk sarapan bubur/kupat tahu khas Tasik'
    ],
    itinerary: [
      { km: '0 km', label: 'Start: Alun-alun Kota Tasikmalaya' },
      { km: '6 km', label: 'Sambong ➔ Jalur Lingkar Danau Situ Gede' },
      { km: '14 km', label: 'Mangkubumi ➔ Puncak Bukit Kawalu/Urug (Makadam)' },
      { km: '20 km', label: 'Turunan Perkebunan ➔ Cisalak' },
      { km: '25 km', label: 'Finish: Kembali ke Alun-alun Kota' }
    ],
    waypoints: [
      [108.2215, -7.3272], // Alun-alun (Jalan Mayor Utarya)
      [108.2000, -7.3350], // Sambong
      [108.1730, -7.3480], // Lingkar Situ Gede
      [108.1800, -7.3600], // Mangkubumi selatan
      [108.1950, -7.3780], // Perkebunan Kawalu
      [108.2150, -7.3750], // Kawalu timur
      [108.2150, -7.3550], // Cisalak
      [108.2215, -7.3272]  // Alun-alun (Jalan Mayor Utarya)
    ]
  },
  {
    id: 'taraju-climber',
    name: 'Taraju Tea Estate Climber (Highland Gravel)',
    description: 'Petualangan gravel sejuk menembus hamparan hijau perkebunan teh Taraju dengan jalur makadam khas pegunungan Priangan Timur.',
    recommendedTire: '40c - 45c (Knobby tread)',
    surfaceRatio: {
      gravel: 55,
      brokenPaved: 25,
      paved: 20
    },
    difficulty: 'Menantang (Challenging Climb)',
    highlights: [
      'Hamparan karpet hijau kebun teh Taraju berkabut tebal',
      'Makadam bebatuan khas jalan kebun teh pegunungan',
      'Ketinggian di atas 1.000 mdpl dengan udara sangat segar',
      'Turunan panjang berliku dengan panorama lembah Cilawu'
    ],
    itinerary: [
      { km: '0 km', label: 'Start: Alun-alun Singaparna' },
      { km: '15 km', label: 'Salawu ➔ Tenjowangi (Awal Tanjakan)' },
      { km: '28 km', label: 'Puncak Kebun Teh Taraju (1.020 mdpl, Makadam)' },
      { km: '42 km', label: 'Punggung Bukit Bojonggambir ➔ Turunan Puspahiang' },
      { km: '56 km', label: 'Finish: Mangunreja ➔ Kembali ke Singaparna' }
    ],
    waypoints: [
      [108.1300, -7.3500], // Singaparna
      [108.0850, -7.3550], // Salawu
      [108.0550, -7.3700], // Tenjowangi
      [108.0300, -7.4000], // Kebun Teh Taraju
      [108.0150, -7.4150], // Puncak Taraju
      [108.0700, -7.3950], // Puspahiang
      [108.1050, -7.3650], // Mangunreja
      [108.1300, -7.3500]  // Singaparna
    ]
  }
];

async function fetchWithRetry(url, retries = 5, delay = 1500) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'rutegravel-builder/1.0' } });
      if (res.ok) return await res.json();
    } catch (e) {
      console.log(`  Retry ${i + 1}/${retries}... (${e.message})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}

async function generate() {
  const finalRoutes = [];

  for (const def of routeDefinitions) {
    console.log(`Fetching real road coordinates for: ${def.name}...`);
    const coordStr = def.waypoints.map((c) => c.join(',')).join(';');
    const url = `https://router.project-osrm.org/route/v1/bicycle/${coordStr}?overview=full&geometries=geojson`;
    const res = await fetchWithRetry(url);

    if (res.code !== 'Ok' || !res.routes || !res.routes[0]) {
      throw new Error(`Failed to route: ${def.id}`);
    }

    const routeData = res.routes[0];
    const coords = routeData.geometry.coordinates; // [ [lon, lat], ... ]

    // Keep 100% of raw road coordinates without subsampling to prevent cutting across buildings or corners
    const fullPoints = coords.map(([lon, lat]) => {
      const ele = state.estimateElevation(lat, lon);
      return {
        lat: Number(lat.toFixed(6)),
        lon: Number(lon.toFixed(6)),
        ele: Number(ele.toFixed(1))
      };
    });

    const metrics = computeRouteMetrics(fullPoints);

    finalRoutes.push({
      id: def.id,
      name: def.name,
      description: def.description,
      distanceKm: metrics.totalDistanceKm,
      elevationGainM: metrics.elevationGainM,
      elevationLossM: metrics.elevationLossM,
      minElevationM: metrics.minEleM,
      maxElevationM: metrics.maxEleM,
      recommendedTire: def.recommendedTire,
      surfaceRatio: def.surfaceRatio,
      difficulty: def.difficulty,
      highlights: def.highlights,
      itinerary: def.itinerary,
      points: fullPoints
    });

    console.log(`  -> Generated ${fullPoints.length} 100% real road-snapped points, ${metrics.totalDistanceKm} km, +${metrics.elevationGainM}m gain`);
    // Throttle between requests to respect OSRM public server
    await new Promise((r) => setTimeout(r, 1200));
  }

  const fileContent = `/**
 * Curated Tasikmalaya Gravel & Mixed-Road Routes Dataset
 * 100% Real Road-Snapped GPS Geometries from OpenStreetMap Road Networks.
 */

export const TASIK_GRAVEL_ROUTES = ${JSON.stringify(finalRoutes, null, 2)};
`;

  fs.writeFileSync('js/data/routes.js', fileContent, 'utf8');
  console.log('Successfully written authentic road routes to js/data/routes.js!');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
