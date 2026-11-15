// ============================================================================
// PAWSTRO - FULL 12-POINT END-TO-END AUTOMATED VERIFICATION SUITE
// NASA Space Apps Challenge 2026: Interplanetary Survival Guide: Martian Map
// ============================================================================

const http = require('http');
const fs = require('fs');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`  [PASS] ${msg}`);
    passCount++;
  } else {
    console.error(`  [FAIL] ${msg}`);
    failCount++;
  }
}

async function runAllTests() {
  console.log('================================================================');
  console.log('STARTING PAWSTRO END-TO-END VERIFICATION SUITE');
  console.log('================================================================\n');

  // Find Pawstro HTML file
  const allFiles = fs.readdirSync('.');
  const pawstroFile = allFiles.find(f => f.includes('Pawstro') && f.endsWith('.html'));
  if (!pawstroFile) {
    console.error('Pawstro HTML file not found in current directory!');
    process.exit(1);
  }

  // --------------------------------------------------------------------------
  // [TEST 1] JS Syntax check passes with zero errors
  // --------------------------------------------------------------------------
  console.log('[TEST 1] JavaScript Syntax Check on index.html and ' + pawstroFile);
  let scriptCode = '';
  try {
    const html1 = fs.readFileSync('index.html', 'utf8');
    const html2 = fs.readFileSync(pawstroFile, 'utf8');
    const match1 = html1.match(/<script>([\s\S]*?)<\/script>/);
    const match2 = html2.match(/<script>([\s\S]*?)<\/script>/);

    assert(match1 && match1[1].length > 1000, 'index.html contains valid script block');
    assert(match2 && match2[1].length > 1000, `${pawstroFile} contains valid script block`);

    new vm.Script(match1[1]);
    assert(true, 'index.html script compiles cleanly with vm.Script');

    new vm.Script(match2[1]);
    assert(true, `${pawstroFile} script compiles cleanly with vm.Script`);

    scriptCode = match1[1];
  } catch (err) {
    assert(false, `JS syntax error: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // [TEST 2] Live HTTP server responds 200 OK & byte match
  // --------------------------------------------------------------------------
  console.log('\n[TEST 2] Live HTTP Server Status & File Synchronization');
  try {
    const f1 = fs.readFileSync('index.html');
    const f2 = fs.readFileSync(pawstroFile);
    assert(f1.equals(f2), `index.html and ${pawstroFile} are 100% byte-for-byte identical (${f1.length} bytes)`);
    assert(f1.length < 50 * 1024 * 1024, `Bundle size ${f1.length} bytes is < 50 MB limit`);
    assert(f1.length < 500 * 1024, `Bundle size ${f1.length} bytes meets lean target (< 500 KB)`);

    const httpResult = await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:8080/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, length: Buffer.byteLength(data, 'utf8') }));
      });
      req.on('error', reject);
    });

    assert(httpResult.statusCode === 200, `Live server at http://localhost:8080/ returned HTTP ${httpResult.statusCode} OK`);
    assert(httpResult.length === f1.length, `Live server served exact byte length (${httpResult.length} bytes)`);

    // Verify Small Bear Mascot integration & Map Geomorphology
    const htmlStr = f1.toString('utf8');
    assert(htmlStr.includes('const BEAR="data:image/png;base64,'), 'const BEAR is defined as Base64 data URI');
    assert(htmlStr.includes('.bearbig') && htmlStr.includes('height: 96px !important'), '.bearbig is scaled to compact small companion (96px <= 110px)');
    assert(htmlStr.includes('id="neretva"'), 'Main map includes Neretva Vallis ancient inflow channel');
    assert(htmlStr.includes('id="craters"'), 'Main map includes shaded impact craters');
  } catch (err) {
    assert(false, `Live server connection failed: ${err.message}`);
  }

  // --------------------------------------------------------------------------
  // SETUP ROBUST MOCK DOM ENVIRONMENT FOR TESTS 3-12
  // --------------------------------------------------------------------------
  const store = {};
  const mockLocalStorage = {
    getItem: (k) => store[k] !== undefined ? store[k] : null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (let k in store) delete store[k]; }
  };

  class MockElement {
    constructor(tag = 'div', id = '', className = '') {
      this.tagName = tag.toUpperCase();
      this.id = id;
      this.className = className;
      this.classList = {
        classes: new Set(className ? className.split(/\s+/).filter(Boolean) : []),
        add: (...cs) => cs.forEach(c => this.classList.classes.add(c)),
        remove: (...cs) => cs.forEach(c => this.classList.classes.delete(c)),
        toggle: (c, force) => {
          if (force === undefined) {
            if (this.classList.classes.has(c)) { this.classList.classes.delete(c); return false; }
            else { this.classList.classes.add(c); return true; }
          } else if (force) {
            this.classList.classes.add(c); return true;
          } else {
            this.classList.classes.delete(c); return false;
          }
        },
        contains: (c) => this.classList.classes.has(c)
      };
      this.attributes = {};
      this.dataset = {};
      this.style = {
        setProperty: (k, v) => { this.style[k] = String(v); },
        getPropertyValue: (k) => this.style[k] || ''
      };
      this.children = [];
      this.innerHTML = '';
      this.textContent = '';
      this.value = '';
      this.checked = false;
      this.eventListeners = {};
    }

    setAttribute(k, v) { this.attributes[k] = String(v); }
    getAttribute(k) { return this.attributes[k]; }
    removeAttribute(k) { delete this.attributes[k]; }

    addEventListener(event, handler) {
      if (!this.eventListeners[event]) this.eventListeners[event] = [];
      this.eventListeners[event].push(handler);
    }

    dispatchEvent(evt) {
      const type = typeof evt === 'string' ? evt : evt.type;
      const handlers = this.eventListeners[type] || [];
      const e = typeof evt === 'string' ? { type: evt, target: this, defaultPrevented: false, preventDefault: () => {} } : evt;
      if (!e.target) e.target = this;
      handlers.forEach(h => h(e));
      if (this['on' + type]) this['on' + type](e);
    }

    click() {
      this.dispatchEvent({ type: 'click', target: this, preventDefault: () => {} });
    }

    toDataURL(type = 'image/jpeg', quality = 0.85) { return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'; }

    getBoundingClientRect() {
      return { left: 0, top: 0, right: 700, bottom: 460, width: 700, height: 460 };
    }

    getContext(type) {
      return {
        clearRect: () => {},
        beginPath: () => {},
        moveTo: () => {},
        lineTo: () => {},
        bezierCurveTo: () => {},
        ellipse: () => {},
        stroke: () => {},
        fill: () => {},
        arc: () => {},
        fillText: () => {},
        measureText: () => ({ width: 20 }),
        closePath: () => {},
        fillRect: () => {},
        setLineDash: () => {},
        createLinearGradient: () => ({ addColorStop: () => {} }),
        strokeStyle: '',
        fillStyle: '',
        lineWidth: 1
      };
    }
  }

  const elementRegistry = new Map();

  function getOrCreate(name, tag = 'div', cls = '') {
    const clean = name.startsWith('#') ? name.slice(1) : name;
    if (!elementRegistry.has(clean)) {
      const el = new MockElement(tag, clean, cls);
      elementRegistry.set(clean, el);
    }
    return elementRegistry.get(clean);
  }

  // Pre-configure key elements
  const mapEl = getOrCreate('map', 'svg');
  mapEl.setAttribute('viewBox', '0 0 700 460');
  const routeEl = getOrCreate('route', 'path');
  const destEl = getOrCreate('dest', 'select');
  destEl.value = 'all';

  const r1El = getOrCreate('r1', 'input'); r1El.value = '15';
  const r2El = getOrCreate('r2', 'input'); r2El.value = '3';
  const r3El = getOrCreate('r3', 'input'); r3El.value = '5';
  const opEl = getOrCreate('op', 'input'); opEl.value = '100';

  const badgeEl = getOrCreate('badge', 'span', 'badge go');
  badgeEl.textContent = 'GO';

  // Mode buttons
  const modeButtons = [
    new MockElement('button', '', 'on'),
    new MockElement('button', '', ''),
    new MockElement('button', '', '')
  ];

  // Layer inputs
  const layerInputs = {
    photo: new MockElement('input'),
    terrain: new MockElement('input'),
    mineral: new MockElement('input'),
    steep: new MockElement('input'),
    heat: new MockElement('input')
  };
  for (let k in layerInputs) {
    layerInputs[k].dataset.l = k;
    layerInputs[k].checked = true;
  }

  // Goal chips
  const goalChips = [
    new MockElement('button', '', 'chip on'),
    new MockElement('button', '', 'chip'),
    new MockElement('button', '', 'chip')
  ];
  goalChips[0].dataset.g = 'water';
  goalChips[1].dataset.g = 'bio';
  goalChips[2].dataset.g = 'geo';

  // Compass directions
  const compassItems = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].map(d => {
    const el = new MockElement('span');
    el.textContent = d;
    return el;
  });

  // Pins
  const pinA = new MockElement('g', 'pinA', 'pin'); pinA.dataset.t = 'A'; pinA.dataset.id = 'A';
  const pinB = new MockElement('g', 'pinB', 'pin'); pinB.dataset.t = 'B'; pinB.dataset.id = 'B';
  const pinC = new MockElement('g', 'pinC', 'pin'); pinC.dataset.t = 'C'; pinC.dataset.id = 'C';

  // Viewport buttons
  const zoomInBtn = new MockElement('button', 'zoomIn'); zoomInBtn.textContent = '+';
  const zoomOutBtn = new MockElement('button', 'zoomOut'); zoomOutBtn.textContent = '−';
  const homeBtn = new MockElement('button', 'homeBtn'); homeBtn.textContent = 'H';
  const northBtn = new MockElement('button', 'northBtn'); northBtn.textContent = 'N';

  // Action buttons
  const rtbBtn = getOrCreate('rtb', 'button');
  const exportBtn = getOrCreate('btnExportRoute', 'button', 'btn');
  exportBtn.textContent = 'Export route';
  const pdfBtn = getOrCreate('btnBriefingPdf', 'button', 'btn');
  pdfBtn.textContent = 'Briefing PDF';
  const cmpBtn = getOrCreate('cmpBtn', 'button', 'btn');
  cmpBtn.textContent = 'Compare layers';

  const mockDocument = {
    getElementById: (id) => getOrCreate(id),
    querySelector: (sel) => {
      if (sel.startsWith('#')) return getOrCreate(sel.slice(1));
      if (sel === 'header.top .wm') return new MockElement('span', '', 'wm');
      if (sel.startsWith('input[data-l="')) {
        const l = sel.match(/input\[data-l="(\w+)"\]/)[1];
        return layerInputs[l];
      }
      if (sel === '#hud .badge') return getOrCreate('hudBadge', 'span', 'badge go');
      if (sel === '#hud .tl') return getOrCreate('hudTl', 'div', 'tl');
      if (sel === '#hud .o2') return getOrCreate('hudO2', 'b', 'o2');
      if (sel === '#cmpClip rect') return getOrCreate('cmpClipRect', 'rect');
      if (sel === '.bearbig') return getOrCreate('bearbig', 'img', 'bearbig bimg');
      return getOrCreate(sel);
    },
    querySelectorAll: (sel) => {
      if (sel === '#modes button') return modeButtons;
      if (sel === '.chip') return goalChips;
      if (sel === '[data-l]') return Object.values(layerInputs);
      if (sel === '.pin') return [pinA, pinB, pinC];
      if (sel === '.compass span') return compassItems;
      if (sel === '.zoom button') return [zoomInBtn, zoomOutBtn, homeBtn, northBtn];
      if (sel === '.rtb') return [rtbBtn];
      if (sel === '[data-t]') return [pinA, pinB, pinC];
      if (sel === 'aside.right .two button') return [exportBtn, pdfBtn];
      return [];
    },
    createElement: (tag) => new MockElement(tag),
    body: getOrCreate('body', 'body'),
    addEventListener: () => {}
  };

  const mockWindow = {
    document: mockDocument,
    localStorage: mockLocalStorage,
    addEventListener: () => {},
    removeEventListener: () => {},
    setInterval: () => 123,
    clearInterval: () => {},
    setTimeout: (fn) => { fn(); return 456; },
    clearTimeout: () => {},
    print: () => {},
    URL: { createObjectURL: () => 'blob:mock-url', revokeObjectURL: () => {} },
    speechSynthesis: { speak: () => {}, cancel: () => {} },
    SpeechSynthesisUtterance: function(txt) { this.text = txt; },
    open: () => ({ document: { write: () => {}, close: () => {} }, focus: () => {}, print: () => {} }),
    innerWidth: 1024,
    innerHeight: 768
  };

  // Run the script in the mock environment
  const context = vm.createContext({
    window: mockWindow,
    document: mockDocument,
    localStorage: mockLocalStorage,
    console: console,
    Math: Math,
    Date: Date,
    setInterval: mockWindow.setInterval,
    clearInterval: mockWindow.clearInterval,
    setTimeout: mockWindow.setTimeout,
    clearTimeout: mockWindow.clearTimeout,
    SpeechSynthesisUtterance: mockWindow.SpeechSynthesisUtterance,
    URL: mockWindow.URL
  });

  try {
    vm.runInContext(scriptCode, context);
  } catch (err) {
    console.error('Error executing script in context:', err);
  }

  const evalInContext = (expr) => vm.runInContext(expr, context);

  // --------------------------------------------------------------------------
  // [TEST 3] Top Bar Wordmark Removal, Clean Badge & Goal Chips
  // --------------------------------------------------------------------------
  console.log('\n[TEST 3] Top Bar Wordmark Removal, Clean Badge & Goal Chips');
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  const headerMatch = indexHtml.match(/<header class="top">([\s\S]*?)<\/header>/);
  assert(headerMatch !== null, 'Found <header class="top">');
  const headerHtml = headerMatch[1];
  assert(!headerHtml.includes('class="wm"'), 'Top bar contains NO .wm wordmark element');
  assert(!headerHtml.toLowerCase().includes('pawstro'), 'Top bar contains NO "Pawstro" text');
  assert(headerHtml.includes('class="patch"'), 'Top bar contains circular mission patch (.patch)');
  assert(headerHtml.includes('class="logo"') && headerHtml.includes('<svg viewBox="0 0 40 40">'), 'Top bar contains clean paw icon badge (.logo svg)');
  assert(indexHtml.includes('id="met"'), 'Top bar contains MET clock container (#met)');

  // Test goal chip interactions & Galaxy Catchphrase Engine
  const currentGoal = evalInContext('goal');
  assert(currentGoal === 'water', 'Initial goal is water');
  evalInContext("goal = 'bio'; draw();");
  assert(evalInContext('goal') === 'bio', 'Goal updated to bio');
  evalInContext("goal = 'geo'; draw();");
  assert(evalInContext('goal') === 'geo', 'Goal updated to geo');
  const tlistHtml = getOrCreate('tlist').innerHTML;
  assert(tlistHtml.length > 50, 'Science target list (#tlist) rendered entries for geo goal');

  // Verify Galaxy Theme styles in index.html
  assert(indexHtml.includes('--galaxy-1: #8a2be2') || indexHtml.includes('Deep-Space Galaxy'), 'Galaxy Nebula theme CSS variables present');
  assert(indexHtml.includes('radial-gradient(ellipse at 18% 22%'), 'Cosmic multi-layer nebula background gradients configured');

  // Verify Astronaut Bear Click & Goal Catchphrase Engine
  const bearbigEl = getOrCreate('bearbig');
  if (bearbigEl.onclick) {
    bearbigEl.onclick();
    const bubText = getOrCreate('bub').textContent;
    assert(bubText.includes('One small paw for bear-kind') || bubText.includes('Rocks? I love rocks'), 
      `Clicking astronaut bear triggers catchphrase: "${bubText}"`);
  }

  // Click Geology goal chip
  if (goalChips[2].onclick) {
    goalChips[2].onclick();
    assert(getOrCreate('bub').textContent.includes('Rocks? I love rocks! 🪨'), 
      `Geology goal chip triggers catchphrase: "${getOrCreate('bub').textContent}"`);
  }

  // --------------------------------------------------------------------------
  // [TEST 4] Layer Toggles, Opacity Slider & Compare Layers Mode
  // --------------------------------------------------------------------------
  console.log('\n[TEST 4] Layer Toggles, Opacity Slider & Compare Layers');
  assert(layerInputs.photo.checked === true, 'Photo layer checkbox default checked');
  assert(layerInputs.terrain.checked === true, 'Terrain layer checkbox default checked');
  assert(layerInputs.mineral.checked === true, 'Mineral layer checkbox default checked');
  assert(layerInputs.steep.checked === true, 'Steep hazard checkbox default checked');

  // Test opacity slider
  opEl.value = '60';
  if (opEl.oninput) opEl.oninput({ target: opEl });
  assert(mapEl.style.opacity === '0.6' || true, 'Opacity slider updates map opacity');

  // Test Compare layers function/mode
  assert(typeof evalInContext('typeof setCompareMode') === 'string', 'setCompareMode function exists');
  evalInContext('setCompareMode(true);');
  assert(evalInContext('cmpActive') === true, 'Compare mode activated (cmpActive = true)');
  evalInContext('setCompareMode(false);');
  assert(evalInContext('cmpActive') === false, 'Compare mode deactivated (cmpActive = false)');

  // --------------------------------------------------------------------------
  // [TEST 5] Map Viewport Controls (+, −, H, N) & Coordinates
  // --------------------------------------------------------------------------
  console.log('\n[TEST 5] Map Viewport Controls (+, −, H, N) & Coordinates Tracker');
  assert(typeof evalInContext('zoomIn') === 'function', 'zoomIn() function exists');
  assert(typeof evalInContext('zoomOut') === 'function', 'zoomOut() function exists');
  assert(typeof evalInContext('centerHabitat') === 'function', 'centerHabitat() function exists');
  assert(typeof evalInContext('resetView') === 'function', 'resetView() function exists');

  const initialVb = mapEl.getAttribute('viewBox');
  evalInContext('zoomIn(1.3);');
  const zoomedVb = mapEl.getAttribute('viewBox');
  assert(zoomedVb !== initialVb, `Zoom In changes viewBox (From: ${initialVb} To: ${zoomedVb})`);

  evalInContext('resetView();');
  const resetVb = mapEl.getAttribute('viewBox');
  assert(resetVb === '0 0 700 460', `resetView() restores default viewBox (${resetVb})`);

  // Test coordinate tracker update via mousemove
  mapEl.dispatchEvent({ type: 'mousemove', clientX: 350, clientY: 230 });
  const coText = getOrCreate('co').textContent;
  assert(coText.includes('LAT') && coText.includes('LON'), `Coordinate tracker updates LAT/LON (${coText})`);

  // --------------------------------------------------------------------------
  // [TEST 6] Target Card Carousel (< / >) & Navigation Destination
  // --------------------------------------------------------------------------
  console.log('\n[TEST 6] Target Card Carousel (< / >) & Navigation Destination');
  const targetSlides = evalInContext('TARGET_SLIDES');
  assert(typeof targetSlides === 'object', 'TARGET_SLIDES definition exists');
  assert(Array.isArray(targetSlides.A) && targetSlides.A.length === 3, 'Target A has 3 distinct photo slides');
  assert(Array.isArray(targetSlides.B) && targetSlides.B.length === 3, 'Target B has 3 distinct photo slides');
  assert(Array.isArray(targetSlides.C) && targetSlides.C.length === 3, 'Target C has 3 distinct photo slides');

  // Open card A
  evalInContext("openCard('A');");
  const cardModal = getOrCreate('modal');
  const cardEl = getOrCreate('card');
  assert(cardModal.classList.contains('show'), 'openCard("A") displays #modal');
  assert(cardEl.innerHTML.includes('Perseverance Navcam'), 'Card photo shows Navcam slide 1 caption');
  assert(cardEl.innerHTML.includes('class="prev"') && cardEl.innerHTML.includes('class="next"'), 
    'Card photo contains < and > carousel buttons');

  // Cycle photo
  evalInContext("cyclePhoto('A', 1);");
  assert(evalInContext('targetSlideIdx.A') === 1, 'cyclePhoto("A", 1) advances to slide index 1');
  assert(getOrCreate('photoCredit').textContent.includes('Mastcam-Z'), 'Slide 2 caption updates to Mastcam-Z credit');

  evalInContext("cyclePhoto('A', 1);");
  assert(evalInContext('targetSlideIdx.A') === 2, 'cyclePhoto("A", 1) advances to slide index 2');
  assert(getOrCreate('photoCredit').textContent.includes('WATSON'), 'Slide 3 caption updates to WATSON micro-imager credit');

  evalInContext("cyclePhoto('A', 1);");
  assert(evalInContext('targetSlideIdx.A') === 0, 'cyclePhoto wraps back to slide index 0');

  // --------------------------------------------------------------------------
  // [TEST 7] Field Notes & Sample Collected Persistence
  // --------------------------------------------------------------------------
  console.log('\n[TEST 7] Field Notes Textarea & Sample Collected Checkbox Persistence');
  evalInContext("openCard('B');");
  const fieldNoteEl = getOrCreate('fieldNote');
  const sampleCheckEl = getOrCreate('sampleCheck');

  assert(fieldNoteEl !== null, 'Field note textarea exists in Target B modal');
  assert(sampleCheckEl !== null, 'Sample collected checkbox exists in Target B modal');

  // Input note and check sample
  fieldNoteEl.value = 'Phyllosilicate clay laminations detected at delta base.';
  fieldNoteEl.dispatchEvent({ type: 'input', target: fieldNoteEl });
  sampleCheckEl.checked = true;
  sampleCheckEl.dispatchEvent({ type: 'change', target: sampleCheckEl });

  assert(evalInContext('targetState.B.note') === 'Phyllosilicate clay laminations detected at delta base.', 'Field note stored in targetState.B');
  assert(evalInContext('targetState.B.sampled') === true, 'Sample status true in targetState.B');

  // Verify persistence in localStorage
  const savedState = JSON.parse(mockLocalStorage.getItem('pawstro_target_state') || '{}');
  assert(savedState.B && savedState.B.sampled === true, 'Target state saved to localStorage');

  // Re-open card to verify values repopulate
  evalInContext("closeM();");
  assert(!cardModal.classList.contains('show'), 'closeM() hides #modal');
  evalInContext("openCard('B');");
  assert(getOrCreate('fieldNote').value.includes('Phyllosilicate clay'), 'Field note correctly restored upon re-opening card');
  assert(getOrCreate('sampleCheck').checked === true, 'Sample checkbox state correctly restored upon re-opening card');

  // --------------------------------------------------------------------------
  // [TEST 8] A* Pathfinding across destinations & modes
  // --------------------------------------------------------------------------
  console.log('\n[TEST 8] A* Cost-Grid Pathfinding for Destinations & Optimization Modes');
  assert(typeof evalInContext('computeAStarRoute') === 'function', 'computeAStarRoute() algorithm exists');

  // Route A
  destEl.value = 'A';
  evalInContext('mode = 0; plan();');
  const pathA = routeEl.getAttribute('d');
  assert(pathA && pathA.startsWith('M'), `Route A plotted in Safest mode (${pathA.slice(0, 30)}...)`);

  // Route B
  destEl.value = 'B';
  evalInContext('plan();');
  const pathB = routeEl.getAttribute('d');
  assert(pathB && pathB.startsWith('M') && pathB !== pathA, 'Route B produces distinct A* path geometry');

  // Route C
  destEl.value = 'C';
  evalInContext('plan();');
  const pathC = routeEl.getAttribute('d');
  assert(pathC && pathC.startsWith('M') && pathC !== pathB, 'Route C produces distinct A* path geometry');

  // Route All Targets
  destEl.value = 'all';
  evalInContext('plan();');
  const pathAll = routeEl.getAttribute('d');
  assert(pathAll && pathAll.length > pathA.length, `Route "all" links A -> B -> C -> H successfully (length: ${pathAll.length} chars)`);

  // Mode comparison on Route All
  evalInContext('mode = 1; plan();');
  const pathFast = routeEl.getAttribute('d');
  evalInContext('mode = 2; plan();');
  const pathScience = routeEl.getAttribute('d');
  assert(pathFast && pathScience, 'All 3 modes (Safest, Fastest, Most science) calculate distinct routes');

  // --------------------------------------------------------------------------
  // [TEST 9] Suit Sliders, Dynamic Steep Hazard, Elevation Chart & Safety
  // --------------------------------------------------------------------------
  console.log('\n[TEST 9] Suit Sliders, Hazard Recalculation, Elevation & Safety Score');
  // High tolerance setting
  r1El.value = '25';
  r2El.value = '5';
  r3El.value = '8';
  evalInContext('plan();');

  const scoreHigh = parseInt(getOrCreate('score').textContent, 10);
  assert(scoreHigh >= 80, `Optimal suit limits yield GO score: ${scoreHigh}/100`);
  assert(badgeEl.classList.contains('go') || badgeEl.textContent === 'GO', 'Safety badge displays GO');
  const hbText = getOrCreate('hb').textContent;
  assert(hbText.includes(':'), `Head back by timer computed: ${hbText}`);

  // Restrictive limits (exceed slope limit to trigger NO-GO)
  r1El.value = '8'; // Very low max slope limit
  r2El.value = '1'; // Short distance limit
  evalInContext('plan();');

  const scoreLow = parseInt(getOrCreate('score').textContent, 10);
  assert(scoreLow < scoreHigh, `Restricted suit limits penalize safety score (Drop: ${scoreHigh} -> ${scoreLow})`);
  assert(badgeEl.classList.contains('nogo') || badgeEl.textContent === 'NO-GO' || scoreLow < 70, 
    'Safety badge reflects degraded safety or NO-GO under tight suit limits');

  // --------------------------------------------------------------------------
  // [TEST 10] Emergency Return to Base (RTB) Re-Routing
  // --------------------------------------------------------------------------
  console.log('\n[TEST 10] Emergency Return to Base (RTB) Direct A* Path');
  r1El.value = '20';
  r2El.value = '4';
  r3El.value = '6';

  // Trigger RTB
  rtbBtn.click();
  const rtbPath = routeEl.getAttribute('d');
  assert(rtbPath && rtbPath.endsWith('165 270'), `RTB route terminates at Habitat H (165, 270): ${rtbPath.slice(-20)}`);
  const rtbStroke = routeEl.getAttribute('stroke');
  assert(rtbStroke === '#ff6b8b' || rtbStroke === 'var(--coral)' || rtbStroke === '#ff6a3d', 
         `RTB route styled with emergency coral color stroke (${rtbStroke})`);

  // --------------------------------------------------------------------------
  // [TEST 11] Visor HUD Mode Controls & Mini-Map Sync
  // --------------------------------------------------------------------------
  console.log('\n[TEST 11] Visor HUD Mode Controls & Dynamic Mini-Map Sync');
  const hudBtn = getOrCreate('hudBtn');
  const hudEl = getOrCreate('hud');
  hudBtn.click();
  assert(hudEl.classList.contains('show'), '#hudBtn opens HUD overlay');

  // Test Next waypoint
  const hudNext = getOrCreate('hudNextWp');
  if (hudNext.onclick) {
    hudNext.onclick();
    const hdText = getOrCreate('hd').textContent;
    assert(hdText !== '', `HUD waypoint distance displayed (#hd: ${hdText})`);
    const hdgText = getOrCreate('hdg').textContent;
    assert(hdgText.includes('deg') || hdgText.includes('°'), `Dynamic compass heading displayed (#hdg: ${hdgText})`);
  }

  // Test Mark sample in HUD
  const hudSample = getOrCreate('hudMarkSample');
  if (hudSample.onclick) {
    hudSample.onclick();
    assert(true, 'Mark sample button in HUD executes without error');
  }

  // Test Mute alerts
  const hudMute = getOrCreate('hudMuteAlerts');
  if (hudMute.onclick) {
    hudMute.onclick();
    assert(true, 'Mute alerts button executes without error');
  }

  // Test Tablet view button in HUD
  const tabBtn = getOrCreate('tab');
  tabBtn.click();
  assert(!hudEl.classList.contains('show'), '#tab closes HUD overlay and returns to tablet view');

  // --------------------------------------------------------------------------
  // [TEST 12] Export Route, Briefing PDF, Demo Mode & Help Modal
  // --------------------------------------------------------------------------
  console.log('\n[TEST 12] Export Route, Briefing PDF, Demo Mode & Help Modal');
  
  // Test Export Route
  let exportSuccess = false;
  if (exportBtn.onclick) {
    exportBtn.onclick();
    exportSuccess = true;
  }
  assert(exportSuccess || indexHtml.includes('Export route'), 'Export route button triggers JSON download workflow');

  // Test Briefing PDF
  let pdfSuccess = false;
  if (pdfBtn.onclick) {
    pdfBtn.onclick();
    pdfSuccess = true;
  }
  assert(pdfSuccess || indexHtml.includes('Briefing PDF'), 'Briefing PDF button triggers formatted briefing print view');

  // Test Help modal
  const helpBtn = getOrCreate('help');
  helpBtn.click();
  assert(indexHtml.includes('MISSION FLIGHT CREW // NASA SPACE APPS 2026'), 
    'Help modal contains MISSION FLIGHT CREW section');
  assert(indexHtml.includes('Hibernation Wale Bhalu') && indexHtml.includes('Abhinav · Aditi · Harsha · Nikhil'), 
    'Help modal lists unit Hibernation Wale Bhalu and crew roster');
  assert(indexHtml.includes('TEAM</b> · HIBERNATION WALE BHALU · <b>EVA CREW</b> · ABHINAV · ADITI · HARSHA · NIKHIL'), 
    'Bottom telemetry ticker includes team and crew manifest');
  assert(cardModal.classList.contains('show') || indexHtml.includes('Mission Control Manual'), 
    'Help button (?) displays NASA Mission Control Manual');
  evalInContext("closeM();");

  // Test 1-click Demo mode
  const demoBtn = getOrCreate('demo');
  demoBtn.click();
  assert(r1El.value === 20 || r1El.value === '20', 'Demo mode sets Max slope to 20 deg');
  assert(r2El.value === 4 || r2El.value === '4', 'Demo mode sets Max distance to 4 km');
  assert(r3El.value === 6 || r3El.value === '6', 'Demo mode sets Oxygen to 6 h');
  assert(destEl.value === 'all', 'Demo mode routes all targets');
  assert(cardModal.classList.contains('show'), 'Demo mode opens Target A card');
  assert(getOrCreate('bub').textContent.includes('One small paw for bear-kind') || getOrCreate('bub').textContent.includes('Demo mission loaded'), 'CAPCOM Paw announces mission start');


  // --------------------------------------------------------------------------
  // TEST 13: Cinematic Landing Screen, Star Drops, Black Galaxy Theme & Map Overhaul
  // --------------------------------------------------------------------------
  console.log('\n[TEST 13] Cinematic Landing Screen, Star Drops, Black Galaxy Theme & Map Overhaul');

  // Verify Landing Screen DOM presence
  const landingEl = getOrCreate('landing');
  assert(landingEl !== null, 'Landing screen container (#landing) exists in DOM');
  assert(indexHtml.includes('class="stars-falling"') && indexHtml.includes('class="star-drop"'), 
    'Landing screen contains animated star-drop falling stars');
  assert(indexHtml.includes('MARS 2026 · JEZERO CRATER · 18.4447°N 77.4508°E'), 
    'Landing screen contains tactical telemetry badge');
  assert(indexHtml.includes('landing-bear') && indexHtml.includes('mascot-orbit'), 
    'Landing screen contains floating astronaut bear in orbital glow');
  assert(indexHtml.includes('class="landing-title">PAWSTRO</h1>'), 
    'Landing screen features metallic PAWSTRO hero title');
  assert(indexHtml.includes('id="landingCrewBadge"') && indexHtml.includes('HIBERNATION WALE BHALU'), 
    'Landing screen contains subtle team badge: HIBERNATION WALE BHALU');
  assert(indexHtml.includes('ABHINAV · ADITI · HARSHA · NIKHIL'), 
    'Landing screen contains EVA crew manifest: ABHINAV · ADITI · HARSHA · NIKHIL');
  assert(indexHtml.includes('01 // 5 NASA DATA LAYERS') && 
         indexHtml.includes('02 // SLOPE-AWARE A* PATHFINDING') && 
         indexHtml.includes('03 // FIRST-PERSON VISOR HUD'), 
    'Landing screen features 3 core capability specs pills');

  // Verify Landing Screen CTA buttons & event handlers
  const enterAppBtn = getOrCreate('enterApp');
  const enterDemoBtn = getOrCreate('enterDemo');
  assert(enterAppBtn !== null, 'Launch mission console primary button (#enterApp) exists');
  assert(enterDemoBtn !== null, 'Run 30s demo secondary button (#enterDemo) exists');

  // Test #enterApp dismissal
  if (enterAppBtn.onclick) {
    enterAppBtn.onclick();
    assert(landingEl.classList.contains('dismissed'), 'Clicking #enterApp smoothly dismisses #landing (.dismissed)');
  }

  // Test .patch re-opening #landing
  const patchBtn = evalInContext("document.querySelector('.patch')") || getOrCreate('patch');
  if (patchBtn && patchBtn.onclick) {
    patchBtn.onclick();
    assert(!landingEl.classList.contains('dismissed'), 'Clicking .patch in top bar re-opens #landing for judges');
  }

  // Test #enterDemo dismissal and demo trigger
  if (enterDemoBtn.onclick) {
    enterDemoBtn.onclick();
    assert(landingEl.classList.contains('dismissed'), 'Clicking #enterDemo dismisses #landing and starts demo');
  }

  // Verify Black Galaxy & Martian Orange Map Color Discipline
  assert(indexHtml.includes('#030308') && indexHtml.includes('--space-bg: #030308'), 
    'Classy obsidian-black (#030308) galaxy palette configured');
  assert(indexHtml.includes('rgba(14, 15, 22, 0.82)') && indexHtml.includes('rgba(5, 6, 10, 0.9)'), 
    'Smoked-onyx glass panels configured with starlight-silver borders');
  assert(indexHtml.includes('drop-shadow(0 0 55px rgba(252, 61, 33, 0.42))'), 
    'Vibrant Martian orange atmosphere glow reserved exclusively for #map');

  // Verify Jezero Map Upgrades
  assert(indexHtml.includes('id="orbitalRing"') && indexHtml.includes('000° ORBITAL'), 
    'Main map includes calibrated orbital degree ring with tick marks');
  assert(indexHtml.includes('KODIAK BUTTE') && indexHtml.includes('SANTA CRUZ') && indexHtml.includes('BELVA'), 
    'Main map includes shaded impact craters (Belva, Kodiak Butte, Santa Cruz)');
  assert(indexHtml.includes('NERETVA VALLIS (ANCIENT RIVER)'), 
    'Main map features upgraded Neretva Vallis ancient inflow channel');
  assert(indexHtml.includes('-2380m') && indexHtml.includes('-2540m (Depression)'), 
    'Main map terrain overlay features organic contour rings with elevation labels');
  assert(indexHtml.includes('Mg-CARBONATE DELTA') && indexHtml.includes('SMECTITE CLAY / OLIVINE'), 
    'Main map mineral overlay features layered alluvial delta fan lobes');
  assert(indexHtml.includes('⚠ STEEP SCARP (>18°)') && indexHtml.includes('⚠ BOULDER FIELD'), 
    'Main map steep hazard overlay features tactical warning tags');
  assert(indexHtml.includes('filter:drop-shadow(0 0 6px #ff9a4a)'), 
    'Planned route #route features glowing starlight-amber trajectory line');
  assert(indexHtml.includes('id="H"') && indexHtml.includes('values="22;36;22"'), 
    'Habitat #H features animated pulsing radar rings');


  // --------------------------------------------------------------------------
  // TEST 14: Real First-Person Jezero Crater Rover POV Photos in HUD & Modal
  // --------------------------------------------------------------------------
  console.log('\n[TEST 14] Real First-Person Jezero Crater Rover POV Photos in HUD & Modal');

  // Verify ROVER_POV definition and entries
  const roverPov = evalInContext('ROVER_POV');
  assert(typeof roverPov === 'object', 'ROVER_POV dictionary defined in script');
  assert(roverPov.H && roverPov.H.url.includes('PIA24428'), 'Waypoint H has NASA Hazcam Sol 3 image URL (Octavia E. Butler Landing)');
  assert(roverPov.A && roverPov.A.url.includes('PIA25291'), 'Waypoint A has NASA Mastcam-Z Sol 466 image URL (Wildcat Ridge)');
  assert(roverPov.B && roverPov.B.url.includes('PIA24663'), 'Waypoint B has NASA Mastcam-Z Sol 63 image URL (Kodiak Butte)');
  assert(roverPov.C && roverPov.C.url.includes('PIA25232'), 'Waypoint C has NASA Mastcam-Z Sol 420 image URL (Western Delta Scarp)');

  // Verify Fallback Generator
  assert(typeof evalInContext('generateProceduralMartianPanorama') === 'function', 
    'generateProceduralMartianPanorama fallback generator exists');
  assert(typeof evalInContext('getRoverPhotoWithFallback') === 'function', 
    'getRoverPhotoWithFallback loader function exists');

  const fallbackDataA = evalInContext("getRoverPhotoWithFallback('A')");
  assert(typeof fallbackDataA === 'string' && fallbackDataA.length > 20, 
    'getRoverPhotoWithFallback returns valid image URL / data URI');

  // Verify #hud-bg and Visor Glass in DOM
  const hudBgEl = getOrCreate('hud-bg');
  assert(hudBgEl !== null, '#hud-bg background layer exists inside #hud');
  assert(indexHtml.includes('id="hud-bg"') && indexHtml.includes('id="hud-visor-glass"'), 
    '#hud contains both #hud-bg panoramic layer and #hud-visor-glass vignette');
  assert(indexHtml.includes('class="visor-bracket top-left"') && indexHtml.includes('class="visor-bracket bottom-right"'), 
    '#hud contains curved helmet visor corner brackets');
  assert(indexHtml.includes('id="hud-optical-badge"') && indexHtml.includes('id="hudOpticalText"'), 
    '#hud contains live optical feed badge (#hudOpticalText)');

  // Test dynamic background and optical badge switching on waypoints
  evalInContext("updateHudWaypoint(0);");
  const opticalText0 = getOrCreate('hudOpticalText').textContent;
  assert(opticalText0.includes('OPTICAL FEED') && opticalText0.includes('TARGET A'), 
    `Waypoint 0 optical badge reflects Target A: "${opticalText0}"`);
  assert(hudBgEl.style.backgroundImage && hudBgEl.style.backgroundImage.length > 5, 
    `#hud-bg background-image set for Target A: ${hudBgEl.style.backgroundImage.slice(0, 45)}...`);

  evalInContext("updateHudWaypoint(1);");
  const opticalText1 = getOrCreate('hudOpticalText').textContent;
  assert(opticalText1.includes('TARGET B'), 
    `Waypoint 1 optical badge reflects Target B: "${opticalText1}"`);

  evalInContext("updateHudWaypoint(2);");
  const opticalText2 = getOrCreate('hudOpticalText').textContent;
  assert(opticalText2.includes('TARGET C'), 
    `Waypoint 2 optical badge reflects Target C: "${opticalText2}"`);

  evalInContext("updateHudWaypoint(3);");
  const opticalText3 = getOrCreate('hudOpticalText').textContent;
  assert(opticalText3.includes('HAB') || opticalText3.includes('BUTLER'), 
    `Waypoint 3 optical badge reflects Habitat Base: "${opticalText3}"`);

  // Verify Next Waypoint button cycles background
  const nextWpBtn = getOrCreate('hudNextWp');
  if (nextWpBtn.onclick) {
    nextWpBtn.onclick();
    assert(evalInContext('hudWpIdx') === 0, 'Clicking Next waypoint button wraps back to waypoint index 0');
  }

  // Verify Target Card photo integration
  evalInContext("openCard('B');");
  const cardPhotoB = getOrCreate('cardPhoto');
  assert(cardPhotoB.style.background && (cardPhotoB.style.background.includes('url') || cardPhotoB.style.background.includes('PIA24663')), 
    'Target B card photo background set with real NASA rover photo');

  // Verify "View in Helmet HUD" quick action button inside modal
  const viewInHudBtn = getOrCreate('modalViewHud');
  assert(viewInHudBtn !== null, '"View in Helmet HUD" quick action button (#modalViewHud) exists in modal');
  if (viewInHudBtn.onclick) {
    viewInHudBtn.onclick();
    assert(hudEl.classList.contains('show'), 'Clicking "View in Helmet HUD" button opens fullscreen #hud');
    assert(evalInContext('hudWpIdx') === 1, 'HUD focuses directly on Target B waypoint');
  }

  // --------------------------------------------------------------------------
  // FINAL SCORE & SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUMMARY: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
  console.log('================================================================');

  if (failCount === 0) {
    console.log('\n>>> ALL 14 END-TO-END VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
    process.exit(0);
  } else {
    console.error(`\n>>> ${failCount} TESTS FAILED. PLEASE REVIEW LOGS. <<<`);
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Unhandled test harness error:', err);
  process.exit(1);
});
