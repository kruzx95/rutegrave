/**
 * Curated Tasikmalaya Gravel & Mixed-Road Routes Dataset
 * High-fidelity GPS route coordinates with elevations and surface breakdowns.
 */

export const TASIK_GRAVEL_ROUTES = [
  {
    id: 'galunggung-foothills',
    name: 'Galunggung Foothills & Sukaratu Mixed-Road Loop',
    description: 'Rute mixed-road lereng kaki Gunung Galunggung via jalan baru Cisinga, makadam pedesaan Cisayong, dan jalur pasir vulkanik Sukaratu.',
    distanceKm: 42.5,
    elevationGainM: 580,
    elevationLossM: 580,
    minElevationM: 345,
    maxElevationM: 785,
    recommendedTire: '38c - 45c (Tubeless recommended)',
    surfaceRatio: {
      gravel: 40,
      brokenPaved: 35,
      paved: 25
    },
    difficulty: 'Sedang (Moderate)',
    highlights: [
      'Pemandangan kaldera purba dinding Gunung Galunggung',
      'Jalur pasir vulkanik dan batu makadam Sukaratu',
      'Jalan pedesaan Cisinga diapit terasering sawah',
      'Spot istirahat di warung kopi Cipanas & Leuwisari'
    ],
    points: [
      { lat: -7.3274, lon: 108.2207, ele: 350 }, // Alun-alun Kota
      { lat: -7.3210, lon: 108.2180, ele: 355 },
      { lat: -7.3110, lon: 108.2120, ele: 368 },
      { lat: -7.3000, lon: 108.2050, ele: 382 }, // Indihiang
      { lat: -7.2880, lon: 108.1980, ele: 400 },
      { lat: -7.2750, lon: 108.1930, ele: 420 },
      { lat: -7.2650, lon: 108.1900, ele: 435 }, // Masuk Cisinga
      { lat: -7.2580, lon: 108.1820, ele: 460 },
      { lat: -7.2520, lon: 108.1730, ele: 490 }, // Cisayong
      { lat: -7.2480, lon: 108.1630, ele: 530 },
      { lat: -7.2440, lon: 108.1510, ele: 590 }, // Sukaratu
      { lat: -7.2410, lon: 108.1400, ele: 660 }, // Makadam batu lepas
      { lat: -7.2390, lon: 108.1280, ele: 720 },
      { lat: -7.2430, lon: 108.1150, ele: 775 }, // Kaki Galunggung
      { lat: -7.2450, lon: 108.1100, ele: 785 }, // Titik elevasi tertinggi
      { lat: -7.2510, lon: 108.1160, ele: 740 },
      { lat: -7.2580, lon: 108.1230, ele: 670 }, // Cipanas outer ring
      { lat: -7.2660, lon: 108.1300, ele: 610 },
      { lat: -7.2750, lon: 108.1350, ele: 560 }, // Leuwisari perkebunan
      { lat: -7.2840, lon: 108.1400, ele: 520 },
      { lat: -7.2940, lon: 108.1440, ele: 490 },
      { lat: -7.3050, lon: 108.1470, ele: 465 },
      { lat: -7.3180, lon: 108.1500, ele: 445 }, // Singaparna utara
      { lat: -7.3280, lon: 108.1550, ele: 430 },
      { lat: -7.3360, lon: 108.1650, ele: 410 },
      { lat: -7.3380, lon: 108.1780, ele: 395 }, // Mangkubumi barat
      { lat: -7.3350, lon: 108.1900, ele: 375 },
      { lat: -7.3320, lon: 108.2040, ele: 362 },
      { lat: -7.3290, lon: 108.2140, ele: 355 },
      { lat: -7.3274, lon: 108.2207, ele: 350 }  // Finish Alun-alun
    ]
  },
  {
    id: 'cirahong-ciwulan',
    name: 'Cirahong Railway Heritage & Ciwulan River Loop',
    description: 'Eksplorasi jembatan bersejarah Cirahong dengan dek kayu di atas Sungai Ciwulan dilanjutkan jalur gravel persawahan Manonjaya dan Cimaragas.',
    distanceKm: 35.2,
    elevationGainM: 340,
    elevationLossM: 340,
    minElevationM: 280,
    maxElevationM: 410,
    recommendedTire: '35c - 42c',
    surfaceRatio: {
      gravel: 45,
      brokenPaved: 30,
      paved: 25
    },
    difficulty: 'Ringan - Sedang (Rolling)',
    highlights: [
      'Menyeberangi Jembatan Cirahong (1893) dengan sensasi derit papan kayu',
      'Jalur tanah padat & gravel pinggir Sungai Ciwulan',
      'Lanskap persawahan Manonjaya yang asri dan tenang',
      'Jalur perkampungan ramah pesepeda tanpa kendaraan bising'
    ],
    points: [
      { lat: -7.3350, lon: 108.2250, ele: 350 }, // Dadaha Start
      { lat: -7.3370, lon: 108.2290, ele: 349 },
      { lat: -7.3390, lon: 108.2340, ele: 348 },
      { lat: -7.3420, lon: 108.2400, ele: 345 },
      { lat: -7.3450, lon: 108.2450, ele: 342 }, // Cibeureum
      { lat: -7.3470, lon: 108.2520, ele: 338 },
      { lat: -7.3490, lon: 108.2580, ele: 335 },
      { lat: -7.3470, lon: 108.2640, ele: 328 },
      { lat: -7.3450, lon: 108.2700, ele: 320 },
      { lat: -7.3420, lon: 108.2750, ele: 316 },
      { lat: -7.3400, lon: 108.2800, ele: 312 }, // Manonjaya
      { lat: -7.3380, lon: 108.2870, ele: 308 },
      { lat: -7.3380, lon: 108.2930, ele: 305 },
      { lat: -7.3400, lon: 108.2990, ele: 300 },
      { lat: -7.3420, lon: 108.3050, ele: 295 },
      { lat: -7.3460, lon: 108.3100, ele: 290 },
      { lat: -7.3500, lon: 108.3150, ele: 285 }, // Jembatan Cirahong
      { lat: -7.3560, lon: 108.3180, ele: 280 }, // Ciwulan riverbed
      { lat: -7.3610, lon: 108.3140, ele: 280 },
      { lat: -7.3650, lon: 108.3100, ele: 282 }, // Gravel pinggir sungai
      { lat: -7.3680, lon: 108.3050, ele: 286 },
      { lat: -7.3710, lon: 108.2990, ele: 292 },
      { lat: -7.3740, lon: 108.2930, ele: 299 },
      { lat: -7.3760, lon: 108.2880, ele: 305 },
      { lat: -7.3780, lon: 108.2820, ele: 312 },
      { lat: -7.3800, lon: 108.2750, ele: 320 }, // Perkebunan Manonjaya
      { lat: -7.3820, lon: 108.2610, ele: 355 },
      { lat: -7.3800, lon: 108.2500, ele: 380 },
      { lat: -7.3750, lon: 108.2400, ele: 410 }, // Gunung Tandala
      { lat: -7.3650, lon: 108.2350, ele: 390 },
      { lat: -7.3550, lon: 108.2310, ele: 375 },
      { lat: -7.3450, lon: 108.2250, ele: 355 }, // UNSIL Cilolohan
      { lat: -7.3390, lon: 108.2250, ele: 352 },
      { lat: -7.3350, lon: 108.2250, ele: 350 }  // Finish Dadaha
    ]
  },
  {
    id: 'situ-gede-kawalu',
    name: 'Situ Gede & Bukit Perkebunan Kawalu Trail',
    description: 'Loop petualangan gravel santai mengitari danau Situ Gede dilanjutkan perbukitan perkebunan rakyat Kawalu dan Urug.',
    distanceKm: 28.4,
    elevationGainM: 310,
    elevationLossM: 310,
    minElevationM: 350,
    maxElevationM: 495,
    recommendedTire: '35c - 40c',
    surfaceRatio: {
      gravel: 35,
      brokenPaved: 40,
      paved: 25
    },
    difficulty: 'Ringan (Scenic & Friendly)',
    highlights: [
      'Gowes sejuk di tepi perairan Situ Gede',
      'Hutan bambu dan perkebunan rakyat Mangkubumi',
      'Pemandangan perbukitan Kawalu dari ketinggian 490 mdpl',
      'Banyak warung lokal untuk sarapan bubur/kupat tahu Tasik'
    ],
    points: [
      { lat: -7.3274, lon: 108.2207, ele: 350 }, // Alun-alun Start
      { lat: -7.3290, lon: 108.2160, ele: 352 },
      { lat: -7.3310, lon: 108.2120, ele: 355 },
      { lat: -7.3330, lon: 108.2060, ele: 358 },
      { lat: -7.3350, lon: 108.2000, ele: 362 }, // Sambong
      { lat: -7.3370, lon: 108.1940, ele: 366 },
      { lat: -7.3390, lon: 108.1880, ele: 370 },
      { lat: -7.3420, lon: 108.1810, ele: 373 },
      { lat: -7.3450, lon: 108.1750, ele: 375 }, // Situ Gede utara
      { lat: -7.3480, lon: 108.1730, ele: 374 },
      { lat: -7.3500, lon: 108.1720, ele: 374 }, // Jalur lingkar danau
      { lat: -7.3530, lon: 108.1740, ele: 378 },
      { lat: -7.3560, lon: 108.1760, ele: 382 },
      { lat: -7.3580, lon: 108.1780, ele: 395 },
      { lat: -7.3600, lon: 108.1800, ele: 410 }, // Naik bukit Mangkubumi
      { lat: -7.3640, lon: 108.1830, ele: 425 },
      { lat: -7.3680, lon: 108.1860, ele: 440 },
      { lat: -7.3710, lon: 108.1890, ele: 458 },
      { lat: -7.3750, lon: 108.1920, ele: 475 },
      { lat: -7.3780, lon: 108.1940, ele: 488 },
      { lat: -7.3800, lon: 108.1950, ele: 495 }, // Puncak Kawalu trail
      { lat: -7.3810, lon: 108.2000, ele: 480 },
      { lat: -7.3820, lon: 108.2040, ele: 460 },
      { lat: -7.3790, lon: 108.2100, ele: 440 },
      { lat: -7.3750, lon: 108.2150, ele: 420 }, // Turunan makadam Urug
      { lat: -7.3700, lon: 108.2160, ele: 405 },
      { lat: -7.3660, lon: 108.2160, ele: 390 },
      { lat: -7.3600, lon: 108.2160, ele: 378 },
      { lat: -7.3550, lon: 108.2150, ele: 365 }, // Cisalak
      { lat: -7.3500, lon: 108.2150, ele: 360 },
      { lat: -7.3450, lon: 108.2160, ele: 358 },
      { lat: -7.3360, lon: 108.2180, ele: 352 },
      { lat: -7.3274, lon: 108.2207, ele: 350 }  // Finish Alun-alun
    ]
  },
  {
    id: 'taraju-climber',
    name: 'Taraju Tea Estate Climber (Highland Gravel)',
    description: 'Petualangan gravel sejuk menembus hamparan hijau perkebunan teh Taraju dengan jalur makadam khas pegunungan Priangan Timur.',
    distanceKm: 46.8,
    elevationGainM: 750,
    elevationLossM: 750,
    minElevationM: 420,
    maxElevationM: 1020,
    recommendedTire: '40c - 45c (Knobby tread)',
    surfaceRatio: {
      gravel: 55,
      brokenPaved: 25,
      paved: 20
    },
    difficulty: 'Menantang (Challenging Climb)',
    highlights: [
      'Hamparan karpet hijau kebun teh Taraju berkabut',
      'Makadam bebatuan khas perkebunan teh',
      'Ketinggian di atas 1.000 mdpl dengan udara sangat segar',
      'Turunan panjang berliku dengan panorama lembah Cilawu'
    ],
    points: [
      { lat: -7.3500, lon: 108.1300, ele: 420 }, // Singaparna Start
      { lat: -7.3510, lon: 108.1220, ele: 432 },
      { lat: -7.3520, lon: 108.1150, ele: 445 },
      { lat: -7.3530, lon: 108.1000, ele: 510 },
      { lat: -7.3550, lon: 108.0850, ele: 580 }, // Salawu
      { lat: -7.3580, lon: 108.0770, ele: 610 },
      { lat: -7.3610, lon: 108.0700, ele: 640 },
      { lat: -7.3650, lon: 108.0620, ele: 680 },
      { lat: -7.3700, lon: 108.0550, ele: 720 }, // Tenjowangi
      { lat: -7.3760, lon: 108.0500, ele: 765 },
      { lat: -7.3820, lon: 108.0450, ele: 810 },
      { lat: -7.3880, lon: 108.0410, ele: 850 },
      { lat: -7.3950, lon: 108.0380, ele: 890 }, // Masuk Kebun Teh Taraju
      { lat: -7.3970, lon: 108.0340, ele: 915 },
      { lat: -7.4000, lon: 108.0300, ele: 940 }, // Makadam batu kebun teh
      { lat: -7.4050, lon: 108.0250, ele: 965 },
      { lat: -7.4100, lon: 108.0200, ele: 990 },
      { lat: -7.4150, lon: 108.0150, ele: 1020 }, // Puncak Taraju Highland
      { lat: -7.4190, lon: 108.0180, ele: 995 },
      { lat: -7.4230, lon: 108.0220, ele: 960 },
      { lat: -7.4270, lon: 108.0280, ele: 925 },
      { lat: -7.4300, lon: 108.0350, ele: 890 }, // Jalur punggung bukit
      { lat: -7.4260, lon: 108.0420, ele: 850 },
      { lat: -7.4210, lon: 108.0500, ele: 810 },
      { lat: -7.4150, lon: 108.0560, ele: 775 },
      { lat: -7.4090, lon: 108.0620, ele: 740 },
      { lat: -7.4020, lon: 108.0660, ele: 705 },
      { lat: -7.3950, lon: 108.0700, ele: 670 }, // Turunan Puspahiang
      { lat: -7.3880, lon: 108.0770, ele: 630 },
      { lat: -7.3820, lon: 108.0850, ele: 590 },
      { lat: -7.3760, lon: 108.0920, ele: 555 },
      { lat: -7.3720, lon: 108.0980, ele: 520 },
      { lat: -7.3680, lon: 108.1010, ele: 500 },
      { lat: -7.3650, lon: 108.1050, ele: 480 }, // Mangunreja
      { lat: -7.3600, lon: 108.1120, ele: 460 },
      { lat: -7.3570, lon: 108.1180, ele: 445 },
      { lat: -7.3530, lon: 108.1240, ele: 432 },
      { lat: -7.3500, lon: 108.1300, ele: 420 }  // Finish Singaparna
    ]
  }
];
