# 🐾 PAWSTRO — Tactical Mars EVA Mission Planner & Helmet Visor HUD

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA_Space_Apps-2026-fc3d21?style=for-the-badge)](https://www.spaceappschallenge.org/)
[![Challenge](https://img.shields.io/badge/Challenge-Interplanetary_Survival_Guide:_Martian_Map-0b3d91?style=for-the-badge)](https://www.spaceappschallenge.org/)
[![Team](https://img.shields.io/badge/Team-Hibernation_Wale_Bhalu-ffb347?style=for-the-badge)](#)
[![Build](https://img.shields.io/badge/E2E_Tests-137_Passed_|_0_Failed-3ddc84?style=for-the-badge)](#10--automated-end-to-end-qa-test-suite)

> **A zero-dependency tablet and helmet-HUD web application that gives a suited Mars astronaut a safe, slope-aware walking route to science targets in Jezero Crater, layering NASA imagery, terrain elevation, spectral minerals, radiation, and weather into one tactical view.**

---

## 📋 Mission Overview

* **Challenge:** NASA Space Apps Challenge 2026 — *Interplanetary Survival Guide: Martian Map*
* **Target Site:** Jezero Crater Western Delta, Mars (`18.4447°N, 77.4508°E` · **Sol 142**)
* **Team:** **Hibernation Wale Bhalu** (`Abhinav · Aditi · Harsha · Nikhil`)
* **Architecture:** Zero-dependency, single-bundle offline-capable web application (`index.html`, `< 352 KB`) engineered with vanilla HTML5, CSS3, SVG Cartography, and ES6+ JavaScript.

Astronauts performing Extravehicular Activity (EVA) on Mars cannot rely on global planetary maps or cloud-dependent tools. **Pawstro** provides a hyper-local ($10 \times 10\text{ km}$) tactical console that computes slope-safe walking trajectories using an **8-directional A* (A-Star) pathfinding algorithm** over a 2D Digital Elevation Model (DEM) cost grid, dynamically adapting to spacesuit slope, distance, and oxygen constraints before transitioning into a first-person **Helmet Visor HUD** featuring real NASA Perseverance Rover imagery.

---

## ✨ Complete Working Features

### 1. 🌌 Cinematic Opening & Landing Screen (`#landing`)
* **Fullscreen Deep-Space Entrance:** Obsidian-black (`#030308`) opening overlay introducing the mission telemetry prior to console launch.
* **Animated Meteor Shower:** Lightweight CSS `@keyframes starDrop` rendering 20 continuous diagonal star-streaks with soft starlight tails.
* **Live Mission Telemetry Pill:** Status badge with pulsing emerald LED (`MARS 2026 · JEZERO CRATER · 18.4447°N 77.4508°E`).
* **Floating Mascot Orbit:** Astronaut Polar Bear companion (`CAPCOM // PAW`) inside a glowing orbital ring with an interactive speech pill (*"One small paw for bear-kind! 🚀"*).
* **Crew Manifest Plaque:** Positioned in the bottom-right corner displaying `TEAM // HIBERNATION WALE BHALU · CREW // ABHINAV · ADITI · HARSHA · NIKHIL` with amber edge illumination.
* **Dual Launch CTAs:**
  * **`LAUNCH MISSION CONSOLE →` (`#enterApp`):** Smooth fade-and-scale transition revealing the main mission planner.
  * **`RUN 30s JUDGE DEMO` (`#enterDemo`):** 1-click instant setup that dismisses the landing screen, loads optimal suit parameters, computes the full multi-waypoint A* route, and opens Target A for inspection.
* **Instant Re-Entry Trigger:** Clicking the top-left circular mission patch (`.patch`) in the top navigation bar re-opens `#landing` at any time during live presentations.

### 2. 🪐 Classy Black Galaxy Console & Central Martian Orange Map
* **Obsidian-Black Color Discipline:** Panels, header, ticker, and safety bar use smoked-onyx glassmorphism (`rgba(14, 15, 22, 0.82)`), starlight-silver borders, and crisp monospace typography (`IBM Plex Mono`, `Barlow Condensed`, `Audiowide`).
* **Mars as the Visual Centerpiece:** Vibrant Martian Orange/Amber (`#ff6a3d`, `#fc3d21`) is reserved exclusively for the central `#map` with a multi-layered atmospheric rim glow.
* **Uncluttered Top Navigation Bar:** Contains zero text app-name clutter—preserving only the circular mission patch (`.patch`), minimal paw emblem (`.logo svg`), live `MET` clock, comms status, Sol clock, science goal chips, and mode toggles.
* **Authentic Jezero Geomorphology (`#L-photo`):**
  * **Neretva Vallis Inflow Channel:** Ancient riverbed carved through the western crater rim feeding into the Western Delta fan.
  * **3D Shaded Impact Craters:** *Belva Crater*, *Kodiak Butte*, *Santa Cruz Crater*, and rim scarps with NW sunlit rims and SE terminator shadows.
  * **Aeolian Regolith Ripples:** Wind-sculpted dune ripples across the volcanic crater floor (*Máaz Formation*).
* **Habitat Base (`#H` at `165, 270`):** Octavia E. Butler Landing Site marker with animated pulsing radar beacons.

### 3. 🗺️ Viewport Engine, Layer Comparison & Opacity Controls
* **Interactive Pan & Zoom Controls:**
  * **`+` / `−`:** Smooth $1.3\times$ zoom in/out centered on the active viewport.
  * **`H` (Center Habitat):** Instantly centers the viewport on Habitat Base `(165, 270)`.
  * **`N` (Reset / North):** Restores the calibrated $700 \times 460$ orbital viewBox.
  * **Mouse Drag & Keyboard Shortcuts:** Click-and-drag panning with bounds clamping and instant coordinate tracking (`#mcoords` displays live Martian coordinates).
* **Layer Toggles:** Independent visibility checkboxes for Optical Photo (`#L-photo`), Topography/DEM (`#L-dem`), Spectral Minerals (`#L-mineral`), and Steep Hazards (`#L-hazard`).
* **Interactive Layer Comparison Slider (`#cmp`):** Vertical split-slider revealing the underlying optical mosaic on the left and the false-color mineral/hazard layer on the right with SVG `<clipPath>` synchronization.

### 4. 🧭 Slope-Aware A* Pathfinding Engine & Elevation Profiler
* **Topological Cost-Grid Mesh:** Discrete elevation mesh mapping Jezero Crater floor (`-2540m`) up to the delta scarp (`-2420m`).
* **8-Directional Diagonal A* Pathfinding:** Dynamically routes around steep impassable scarps (>20°), craters, and boulder fields with Euclidean diagonal movement smoothing.
* **3 Optimization Modes:**
  * **`Safest`:** Strictly penalizes slopes >8° and skirts hazardous scarp ridges.
  * **`Fastest`:** Minimizes traverse distance and Mission Elapsed Time (MET) along optimal terrain contours.
  * **`Most science`:** Prioritizes routes that intersect verified carbonate and phyllosilicate mineral outcrops.
* **Real-Time HTML5 Canvas Elevation Profile (`#elev`):** Dynamic cross-section plotting elevation in meters, cumulative traverse distance, and highlighted steep climb segments.

### 5. 🛡️ Suit Telemetry Limits, GO/NO-GO Matrix & RTB Engine
* **Interactive Suit Limit Sliders:**
  * **Max Slope Limit (`#r1`):** Adjustable from 8° to 35°.
  * **Max Distance Limit (`#r2`):** Adjustable from 1.0 km to 8.0 km.
  * **Oxygen Supply (`#r3`):** Adjustable from 2.0 h to 8.0 h.
* **Dynamic Route Safety Score (0–100):** Weighted multi-variable safety evaluation calculating distance margin, slope margin, oxygen consumption, and RTB reserve.
* **`GO` / `NO-GO` Status Badge:** Instant visual status indicating whether the planned traverse satisfies all planetary survival constraints.
* **Turn-Around Time Estimator ("Head back by"):** Calculates exact Sol time (e.g. `16:30`) based on walking speed, stay time, and sunset margin (`17:28`).
* **Emergency Return to Base (`RTB`):** One-tap button that immediately overrides active waypoints, calculates the fastest safe return path to Habitat `H`, and illuminates the route in pulsing emergency coral (`#ff6b8b`).

### 6. 🥽 Real First-Person Visor HUD Mode (`#hud`)
* **Real NASA Perseverance Jezero Crater POV Imagery (`ROVER_POV`):**
  * **Waypoint `H`:** Hazcam Sol 3 High-Res Landing Panorama (*Octavia E. Butler Landing*).
  * **Waypoint `A`:** Mastcam-Z Sol 466 Lakebed Outcrop (*Wildcat Ridge Sulfate Beds*).
  * **Waypoint `B`:** Mastcam-Z Sol 63 Delta Remnant Strata (*Kodiak Butte*).
  * **Waypoint `C`:** Mastcam-Z Sol 420 Western Delta Scarp (*Enchanted Lake / Cape Nukshak*).
* **Guaranteed Offline Procedural Panorama Fallback:** Built-in `generateProceduralMartianPanorama()` synthesizes a $1280 \times 720$ HTML5 Canvas Martian landscape if offline, ensuring zero broken images during live demos.
* **Interactive Visor Controls:**
  * **`Next waypoint` (`#hudNextWp`):** Cross-fades the visor background to the next real rover photograph and updates compass bearing (`#hdg`), distance ahead (`#hd`), and `Slope ahead` (`#hs`).
  * **`Mark sample` (`#hudMarkSample`):** Logs sample collection directly from the visor and syncs with the tablet console.
  * **`Mute alerts` (`#hudMuteAlerts`):** Toggles hazard banner visibility.
  * **`Return to base` (`#hudRtb`):** Locks visor onto Habitat Base with emergency homing telemetry.
  * **Live Mini-Map Synchronization:** Tracks real-time astronaut position, target pin, and route vector.

### 7. 📸 Science Target Card Photo Carousel (`#modal`)
* **3 Analytical Views per Target (`<` and `>` Carousel Arrows):**
  1. *Wide Mastcam-Z Outcrop View* (Full rover panorama).
  2. *Close-Up Geological Strata Zoom* ($2.2\times$ optical zoom on sedimentary bedding laminae).
  3. *Spectrometer / Mineral False-Color* (High-contrast spectral highlight of Mg-Carbonate and Smectite Clay).
* **Direct Visor Jump (`View in Helmet HUD 🥽`):** Launches fullscreen HUD mode locked onto the inspected target.
* **Astronaut Field Notes & Sampling:** Persistent multi-line text notes and sample collection checkboxes saved automatically to `localStorage`.

### 8. 🐻 Interactive CAPCOM Polar Bear Mascot (`CAPCOM // PAW`)
* Compact $96\text{px}$ astronaut bear companion in the lower-right corner of `.mapwrap` with contextual speech bubble updates (`#bub`) and clickable catchphrases (*"One small paw for bear-kind! 🚀"*, *"Rocks? I love rocks! 🪨"*, *"Bagged & tagged! Another rock for my collection! 🪨🎒"*).

### 9. 📄 Mission Briefing PDF, Route JSON Export & Help Manual
* **`Export route`:** Downloads a structured `pawstro-route-sol142.json` file containing mission metadata, suit limits, safety telemetry, field notes, and A* waypoint coordinates.
* **`Briefing PDF`:** Opens a print-ready NASA EVA Mission Briefing dossier via `window.print()`.
* **Mission Control Manual (`?`):** Glassmorphic modal documenting all 6 operational steps and NASA data attributions.

### 10. 🧪 Automated End-to-End QA Test Suite (`test_e2e_full.js`)
* Verified by **14 automated test suites (137 assertions — 137 PASSED, 0 FAILED)** covering JS syntax compilation, HTTP 200 live serving, goal chip sorting, layer comparison clipping, viewport zoom/pan math, carousel rotation, `localStorage` persistence, A* pathfinding across all 3 modes, suit limit `GO`/`NO-GO` transitions, emergency RTB routing, HUD waypoint stepping, and real NASA rover POV integration.

---

## 🛰️ NASA Data Sources & Attribution (`SOURCES.txt`)

| Layer / Telemetry | Dataset / Instrument | Source & Usage in Pawstro |
| :--- | :--- | :--- |
| **Base Optical Imagery** | Mars 2020 HiRISE / CTX Orthomosaics | USGS Astrogeology / NASA Mars Trek — Jezero Crater landing site & Western Delta base relief |
| **Elevation & Slope (DEM)** | MOLA / HRSC & HiRISE DTM | USGS Astrogeology — $70 \times 46$ elevation cost grid (`-2540m` to `-2380m`) & slope hazard mask |
| **Minerals (Spectral)** | MRO CRISM Spectral Products | NASA Mars Trek — Mg-Carbonate margin unit & Fe/Mg-Smectite clay target mapping |
| **Rover POV Imagery** | Perseverance Mastcam-Z & Hazcam | NASA/JPL-Caltech/ASU — Real Sol 3, Sol 63, Sol 420, and Sol 466 outcrop photographs |
| **Weather Telemetry** | Perseverance MEDA | NASA PDS Atmospheres Node — Sample/historical Jezero surface temperature (`-12°C`) & wind (`6 m/s`) |
| **Radiation Telemetry** | Curiosity RAD | NASA MSL RAD — Sample surface dose rate figures (`0.6 uSv/h` nominal baseline) |

*(Note: Environmental weather and radiation values are pre-fetched historical/sample telemetry shipped locally for guaranteed offline reliability, as recommended by the challenge brief.)*

---

## 🚀 Quick Start & Local Execution

Pawstro requires **zero external npm packages or build steps** to run in any modern browser.

```bash
# 1. Clone the repository
git clone https://github.com/AbhinavKrDas/PAWSTRO.git
cd PAWSTRO

# 2. Launch a local HTTP server (Python or Node)
python -m http.server 8080

# 3. Open in browser
# Navigate to: http://localhost:8080/

# 4. (Optional) Run the 137-assertion End-to-End QA Test Suite
node test_e2e_full.js
```

---

## 👥 Flight Crew & Development Team

**Team Name:** **Hibernation Wale Bhalu**  
**NASA Space Apps Challenge 2026**

* **Abhinav Kumar Das**
* **Aditi**
* **Harshavardhan (Harsha)**
* **Nikhil**

---

*Pawstro – Mission Planner // NASA Space Apps Challenge 2026 // Team Hibernation Wale Bhalu*
