# Tasikmalaya Gravel Navigator - Design Specification

**Date**: 2026-10-13  
**Status**: Approved  
**Topic**: Tasikmalaya Gravel & Mixed-Road Route Navigator & GPX Exporter

---

## 1. Executive Summary

Tasikmalaya Gravel Navigator (`rutegravel`) is a modern, responsive client-side web application designed for cyclists exploring gravel and mixed-road routes across Kota and Kabupaten Tasikmalaya, West Java, Indonesia.

The application solves the challenge of finding verified, rideable gravel routes by providing:
1. **Curated Ready-to-Ride Presets**: Tested mixed-road loops around prominent Tasikmalaya terrains (Gunung Galunggung slopes, Jembatan Cirahong & Ciwulan riverbed, Situ Gede & Kawalu plantations, Taraju tea estates).
2. **Interactive Custom Route Builder**: Interactive map tool allowing cyclists to click and customize their own routes across rural roads, macadam trails, and unpaved pathways.
3. **Elevation Profile & Surface Analysis**: Real-time altitude chart with synchronized map tracking, elevation gain, and surface type estimation.
4. **Standard GPX 1.1 Exporter**: Direct one-click download of TopoGrafix GPX 1.1 files fully compatible with Garmin, Wahoo, Hammerhead, Bryton, Coros, Komoot, and Strava.

---

## 2. Architecture & Technology Stack

- **Platform**: Client-side Web Application (zero server requirements, fully functional locally or hosted on static hosting).
- **Core Technologies**:
  - **HTML5**: Semantic layout with accessible structures.
  - **CSS3 (Vanilla)**: Adventure Gravel Dark Theme, earthy amber accents (`#e67e22`, `#d35400`, `#27ae60`), modern topography (`Outfit` & `Inter`), flexible CSS Grid & Flexbox, micro-transitions.
  - **JavaScript (ES6+)**: Modular application architecture without external build tool overhead.
- **Mapping Engine**:
  - **Leaflet.js (v1.9.4)**: Lightweight, mobile-friendly map library.
  - **Tile Layers**:
    1. *CyclOSM*: Specialized bicycle tile layer highlighting path surfaces, gravel, trails, and elevation contours.
    2. *OpenStreetMap Standard*: Complete rural and urban road network.
    3. *OpenTopoMap*: Topographical contour visualization.
    4. *Esri World Imagery*: High-resolution satellite imagery to visually inspect actual ground conditions (asphalt vs. dirt vs. loose stone).
- **Routing Engine**:
  - Client-side route stitching with OSRM (Open Source Routing Machine) bicycle profile with fallback to realistic waypoint snapping.
- **Elevation Engine**:
  - Topographical elevation sampling per coordinate with smooth interpolation.

---

## 3. Curated Tasikmalaya Gravel Routes (Presets)

The app comes bundled with 4 rich, pre-configured Tasikmalaya routes:

### 3.1. Galunggung Foothills & Sukaratu Mixed-Road Loop
- **Distance**: ~42.5 km
- **Elevation Gain**: +580 m (Min: 345 mdpl, Max: 785 mdpl)
- **Tire Recommendation**: 38c - 45c
- **Terrain Breakdown**: 40% macadam/gravel, 35% broken rural asphalt, 25% smooth asphalt
- **Route Itinerary**: Alun-Alun Tasikmalaya ➔ Indihiang ➔ Cisinga corridor ➔ Cisayong village backroads ➔ Sukaratu volcanic slope (loose stones & volcanic sand trails) ➔ Cipanas hot springs outer ring ➔ Leuwisari plantation ➔ return via Singaparna.

### 3.2. Cirahong Railway Heritage & Ciwulan River Loop
- **Distance**: ~35.2 km
- **Elevation Gain**: +340 m (Min: 280 mdpl, Max: 410 mdpl)
- **Tire Recommendation**: 35c - 42c
- **Terrain Breakdown**: 45% packed dirt & gravel trails, 30% rural asphalt, 25% urban connecting road
- **Route Itinerary**: Kompleks Olahraga Dadaha ➔ Cibeureum ➔ Manonjaya agricultural backroads ➔ Cross the historic 1893 Cirahong wooden railway/car deck bridge ➔ Ciwulan river gravel bank trails ➔ Cimaragas rural path ➔ Cilolohan / UNSIL ➔ Finish.

### 3.3. Situ Gede & Bukit Perkebunan Kawalu Trail
- **Distance**: ~28.4 km
- **Elevation Gain**: +310 m (Min: 350 mdpl, Max: 495 mdpl)
- **Tire Recommendation**: 35c - 40c
- **Terrain Breakdown**: 35% hardpack singletrack/gravel, 40% village roads, 25% paved road
- **Route Itinerary**: Alun-Alun Kota ➔ Mangkubumi ➔ Situ Gede lake perimeter trail ➔ Perkebunan rakyat Urug/Kawalu (rolling gravel hills and bamboo groves) ➔ Sambong ➔ Finish.

### 3.4. Taraju Tea Estate Climber (Advanced Gravel)
- **Distance**: ~46.8 km
- **Elevation Gain**: +750 m (Min: 420 mdpl, Max: 1,020 mdpl)
- **Tire Recommendation**: 40c - 45c
- **Terrain Breakdown**: 55% tea plantation rocky macadam, 25% narrow concrete tracks, 20% asphalt
- **Route Itinerary**: Singaparna ➔ Salawu ➔ Taraju green tea plantations ➔ Panoramic highland ridge gravel tracks ➔ Downhill winding descent via Cilawu border back to Singaparna.

---

## 4. Feature Specifications

### 4.1. Interactive Map Viewport
- Fullscreen Leaflet canvas centered on Tasikmalaya (`lat: -7.3274, lon: 108.2207`, zoom level 12).
- Multi-layer basemap control (CyclOSM, Satellite, OpenTopoMap, OSM Standard).
- Color-coded route polyline:
  - Orange/Amber for mixed-road segments.
  - Dashed or dual-tone for gravel/unpaved sections.
- Start (Green), Waypoint (Blue), and Finish (Checkered flag) custom markers.

### 4.2. Sidebar / Control Deck
- **Route Selector**: Dropdown / Card selector to quickly load any of the 4 curated Tasikmalaya routes.
- **Route Metrics Panel**:
  - Total Distance (km)
  - Elevation Gain (+m)
  - Estimated Riding Time (based on gravel pace ~18 km/h)
  - Terrain ratio badges (% Gravel / % Rural Road / % Paved)
  - Recommended Tire Width
- **Custom Route Builder Mode**:
  - "Draw Custom Route" toggle.
  - Click to add points, drag to adjust.
  - "Undo Point", "Reverse Direction", "Clear Route" buttons.
- **Export Action**:
  - Prominent "Download GPX (.gpx)" button that triggers browser download with timestamp and route name.

### 4.3. Interactive Elevation Chart
- Smooth SVG profile rendered at the bottom drawer.
- Y-axis: Elevation in meters (mdpl).
- X-axis: Distance in kilometers.
- Interactive scrub/hover: moving cursor along the elevation chart moves a synchronized target crosshair marker on the map route in real time.
- Display tooltip showing: Current Km, Current Elevation, and Gradient (%).

### 4.4. GPX 1.1 Specification Compliance
- Generates standard XML conforming to `http://www.topografix.com/GPX/1/1`.
- Metadata includes route title, description, keywords (`gravel`, `tasikmalaya`, `cycling`), timestamp, and bounds.
- Full `<trk>` structure containing `<trkseg>` and `<trkpt lat="..." lon="...">` with child `<ele>` (elevation in meters) and `<time>` tags.
- Compatible with all GPS bike computers and mobile apps without import errors.

---

## 5. UI/UX Design System

- **Palette**:
  - Background: Deep Earth Dark (`#121516`, `#1a1e20`)
  - Surface/Cards: Semi-transparent Slate (`#22272a` with subtle border `#333b40`)
  - Accent Adventure: Sunset Amber (`#e67e22`) & Forest Ochre (`#27ae60`)
  - Text Primary: `#f1f3f5`
  - Text Secondary: `#9aa0a6`
- **Typography**: `Outfit` for strong modern headings, `Inter` for clean legibility on data metrics and map tooltips.
- **Responsiveness**:
  - Desktop: Sidebar on left (360px), map occupying right viewport, collapsible bottom elevation profile.
  - Mobile: Collapsible bottom sheet for metrics & controls, floating quick-actions bar (Switch Layer, Export GPX, Center Map), minimum 44px tap targets.

---

## 6. Verification and Acceptance Criteria

1. **Preset Routes**: All 4 Tasikmalaya presets load instantly with accurate polyline coordinates and correct elevation profiles.
2. **GPX Validity**: Downloaded `.gpx` files open cleanly in GPS viewers (e.g., GPX Viewer, Garmin Connect, Strava Route import) with no XML schema errors.
3. **Custom Builder**: User can click multiple points to create a custom gravel path, reverse the path, and download the custom GPX.
4. **Elevation Sync**: Scrubbing the elevation graph smoothly updates the crosshair marker on the map.
5. **Mobile Responsiveness**: UI adapts properly to viewports from 375px (mobile) to 1920px (desktop) with zero horizontal overflow.
6. **Anti-Slop Compliance**: Meets anti-slop standards with genuine functional controls, no fake statistics, and purposeful design.
