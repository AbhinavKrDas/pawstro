# 🐾 PAWSTRO — Tactical Mars EVA Mission Planner & Helmet Visor HUD

[![NASA Space Apps 2026](https://img.shields.io/badge/NASA_Space_Apps-2026-fc3d21?style=for-the-badge)](https://www.spaceappschallenge.org/)
[![Challenge](https://img.shields.io/badge/Challenge-Interplanetary_Survival_Guide:_Martian_Map-0b3d91?style=for-the-badge)](https://www.spaceappschallenge.org/)
[![Team](https://img.shields.io/badge/Team-Hibernation_Wale_Bhalu-ffb347?style=for-the-badge)](#)
[![Build](https://img.shields.io/badge/E2E_Tests-132_Passed_|_0_Failed-3ddc84?style=for-the-badge)](#10--automated-end-to-end-qa-test-suite)

> **A zero-dependency tablet and helmet-HUD web application that gives a suited Mars astronaut a safe, slope-aware walking route to science targets in Jezero Crater, layering NASA imagery, terrain elevation, spectral minerals, radiation, and weather into one tactical view.**

---

## 📋 Mission Overview

* **Challenge:** NASA Space Apps Challenge 2026 — *Interplanetary Survival Guide: Martian Map*
* **Target Site:** Jezero Crater Western Delta, Mars (`18.4447°N, 77.4508°E` · **Sol 142**)
* **Team:** **Hibernation Wale Bhalu** (`Abhinav · Aditi · Harsha · Nikhil`)
* **Architecture:** Zero-dependency, single-bundle offline-capable web application (`index.html`, `< 350 KB`) engineered with vanilla HTML5, CSS3, SVG Cartography, and ES6+ JavaScript.

Astronauts performing Extravehicular Activity (EVA) on Mars cannot rely on global planetary maps or cloud-dependent tools. **Pawstro** provides a hyper-local ($10 \times 10\text{ km}$) tactical console that computes slope-safe walking trajectories using an **8-directional A* (A-Star) pathfinding algorithm** over a 2D Digital Elevation Model (DEM) cost grid, dynamically adapting to spacesuit slope, distance, and oxygen constraints before transitioning into a first-person **Helmet Visor HUD** featuring real NASA Perseverance Rover imagery.

---

## ✨ Complete Working Features

### 1. 🌌 Cinematic Opening & Landing Screen (`#landing`)
* **Fullscreen Deep-Space Entrance:** Obsidian-black (`#030308`) opening overlay introducing the mission telemetry prior to console launch.
* **Animated Meteor Shower:** Lightweight CSS `@keyframes starDrop` rendering 20 continuous diagonal star-streaks with soft starlight tails.
* **Live Mission Telemetry Pill:** Status badge with pulsing emerald LED (`MARS 2026 · JEZERO CRATER · 18.4447°N 77.4508°E`).
* **Floating Mascot Orbit:** Astronaut Polar Bear companion (`CAPCOM // PAW`) inside a glowing orbital ring with an interactive speech pill (*"One small paw for bear-kind! 🚀"*).
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
  * **Mouse Drag & Keyboard Shortcuts:** Click-and-drag panning with bounds clamping, plus hotkeys `+`/`=`, `-`/`_`, `H`, `N`, and `Esc`.
* **Live Coordinate Tracker (`#co`):** Real-time cursor tracking converting viewport coordinates into Martian Latitude and Longitude.
* **5 Toggleable NASA Scientific Data Layers (`SYS-01`):**
  1. **Photo (optical) (`#L-photo`):** Base satellite relief and geological context.
  2. **Terrain height (`#L-terrain`):** 5 topographic contour rings with inline elevation labels (`-2380m` to `-2540m`).
  3. **Minerals (`#L-mineral`):** CRISM spectral overlays highlighting Mg-Carbonate delta strata (`#ffe1c2`) and Fe/Mg-Smectite Clay & Olivine deposits (`#5de6c4`).
  4. **Steep / no-go zones (`#L-steep`):** Hatched hazard polygons (`⚠ STEEP SCARP (>18°)`, `⚠ BOULDER FIELD`).
  5. **Heat (thermal) (`#L-heat`):** THEMIS thermal inertia anomaly overlay.
* **Continuous Opacity Slider (`#op`):** Dynamically adjusts overlay transparency from $20\%$ to $100\%$.
* **Interactive Split-Screen Layer Comparison (`Compare layers`):** Enables a mouse-following vertical SVG curtain (`#cmpClip` & `#cmpSplitter`) to swipe between raw optical imagery (left) and scientific/hazard overlays (right).

### 4. 🧮 Slope-Aware A* (A-Star) Pathfinding Engine (`NAV-03`)
* **2D DEM & Slope Cost-Grid:** Evaluates a $70 \times 46$ elevation and slope grid ($10\text{m}$ cell resolution).
* **Dynamic Suit Slope Enforcement:** Any cell where terrain slope exceeds the astronaut's **Max slope** slider (`#r1`) becomes a high-cost/impassable no-go obstacle, dynamically expanding or contracting the `#L-steep` hazard overlay and forcing the A* pathfinder to detour around steep scarps.
* **3 Tactical Routing Optimization Modes:**
  * 🛡️ **`Safest`:** Heavily penalizes incline (`slope × 18`), routing through flat basin corridors.
  * ⚡ **`Fastest`:** Minimizes Euclidean distance and EVA walking duration while respecting `Max slope`.
  * 🔬 **`Most science`:** Biases the trajectory through high-priority CRISM carbonate and phyllosilicate clay deposits.
* **Single-Target & Multi-Target Tour Routing:** Route from Habitat `H` to `Target A`, `Target B`, `Target C`, or chain `All targets (best order)` (`H → A → B → C`) with smooth cubic SVG path geometry and a real-time **Elevation Profile Chart (`#elev`)**.

### 5. 🦺 Real-Time Safety Evaluation & Astronaut Field Notes (`SAF-04`)
* **0–100 Route Safety Score Ring (`#score` & `#ring`):** Evaluates route peak slope against suit `Max slope` (`#r1`), total distance against `Max distance` (`#r2`), and walk duration against `Oxygen` reserve (`#r3`).
* **Automatic `GO` / `NO-GO` Badge (`#badge`):** Displays glowing emerald **`GO`** when safe, or switches to crimson **`NO-GO`** with specific diagnostic warnings if any suit threshold is breached.
* **Return-to-Base Countdown (`#hb`):** Dynamically computes the latest safe turn-back time from `MET`, `Oxygen` budget, route duration, and Martian `Sunset` (`17:12`).
* **Emergency Return to Base (`#rtb`):** 1-click abort button that plots an immediate direct A* escape vector back to Habitat `#H` highlighted in warning coral (`#ff6b8b`).
* **Persistent Astronaut Field Notes & Sample Tracking (`#modal`):** Per-target `<textarea>` field notes and `Sample collected` checkboxes saved automatically to `localStorage`.

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

### 8. 🐻 Interactive CAPCOM Polar Bear Mascot (`CAPCOM // PAW`)
* Compact $96\text{px}$ astronaut bear companion in the lower-right corner of `.mapwrap` with contextual speech bubble updates (`#bub`) and clickable catchphrases (*"One small paw for bear-kind! 🚀"*, *"Rocks? I love rocks! 🪨"*, *"Bagged & tagged! Another rock for my collection! 🪨🎒"*).

### 9. 📄 Mission Briefing PDF, Route JSON Export & Help Manual
* **`Export route`:** Downloads a structured `pawstro-route-sol142.json` file containing mission metadata, suit limits, safety telemetry, field notes, and A* waypoint coordinates.
* **`Briefing PDF`:** Opens a print-ready NASA EVA Mission Briefing dossier via `window.print()`.
* **Mission Control Manual (`?`):** Glassmorphic modal documenting all 6 operational steps and NASA data attributions.

### 10. 🧪 Automated End-to-End QA Test Suite (`test_e2e_full.js`)
* Verified by **14 automated test suites (132 assertions — 132 PASSED, 0 FAILED)** covering JS syntax compilation, HTTP 200 live serving, goal chip sorting, layer comparison clipping, viewport zoom/pan math, carousel rotation, `localStorage` persistence, A* pathfinding across all 3 modes, suit limit `GO`/`NO-GO` transitions, emergency RTB routing, HUD waypoint stepping, and real NASA rover POV integration.

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

#created by Abhinav Kumar Das , Aditi ,  Hrashvardhan  , Nikhil
# 1. Clone the repository
git clone <your-repo-url>
cd pawstro

# 2. Launch a local HTTP server (Python or Node)
python3 -m http.server 8080

# 3. Open in browser
open http://localhost:8080/

# 4. (Optional) Run the 132-assertion End-to-End QA Test Suite
node test_e2e_full.js
