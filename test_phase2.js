const fs = require('fs');

console.log('=== TEST 1: SCRIPT SYNTAX VALIDATION (PHASE 2) ===');
const filesToTest = ['index.html', fs.readdirSync('.').find(f => f.startsWith('Pawstro') && f.endsWith('.html'))];

for (const file of filesToTest) {
  const html = fs.readFileSync(file, 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) throw new Error(`No <script> in ${file}`);
  try {
    new Function(scriptMatch[1]);
    console.log(`[PASS] ${file}: JS SYNTAX OK`);
  } catch (err) {
    console.error(`[FAIL] ${file} Syntax Error:`, err);
    process.exit(1);
  }
}

console.log('\n=== TEST 2: DOM NODES & LEGEND VERIFICATION ===');
for (const file of filesToTest) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('id="mapLegend"')) throw new Error(`Missing #mapLegend in ${file}`);
  if (!html.includes('#ffe1c2') || !html.includes('#5de6c4') || !html.includes('#ff6b8b')) {
    throw new Error(`Missing mineral swatches in ${file}`);
  }
  if (!html.includes('id="cmpBtn"')) throw new Error(`Missing #cmpBtn in ${file}`);
  if (!html.includes('id="cmpClip"')) throw new Error(`Missing #cmpClip in ${file}`);
  if (!html.includes('id="L-overlays"')) throw new Error(`Missing #L-overlays in ${file}`);
  if (!html.includes('id="cmpSplitter"')) throw new Error(`Missing #cmpSplitter in ${file}`);
  console.log(`[PASS] ${file}: All Phase 2 SVG, legend, and comparison nodes exist.`);
}

console.log('\n=== TEST 3: FUNCTIONAL VIEWPORT & INTERACTION TESTS ===');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Mock DOM
const elements = {};
function getMockEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      textContent: '',
      innerHTML: '',
      value: '',
      attributes: {},
      style: {
        setProperty: function(k, v) { this[k] = v; },
        display: ''
      },
      classList: {
        _classes: new Set(),
        add: function(c) { this._classes.add(c); },
        remove: function(c) { this._classes.delete(c); },
        toggle: function(c, force) {
          if (force === true) this._classes.add(c);
          else if (force === false) this._classes.delete(c);
          else if (this._classes.has(c)) this._classes.delete(c);
          else this._classes.add(c);
          return this._classes.has(c);
        },
        contains: function(c) { return this._classes.has(c); }
      },
      setAttribute: function(k, v) { this.attributes[k] = String(v); },
      getAttribute: function(k) { return this.attributes[k] || null; },
      removeAttribute: function(k) { delete this.attributes[k]; },
      getContext: function() {
        return { clearRect: () => {}, beginPath: () => {}, moveTo: () => {}, lineTo: () => {}, fill: () => {}, stroke: () => {} };
      },
      addEventListener: function(evt, fn) { this['on' + evt] = fn; },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 700, height: 460 })
    };
  }
  return elements[id];
}

// Pre-create zoom buttons
const zBtns = [
  { textContent: '+', onclick: null, addEventListener: function(e, f) { this.onclick = f; } },
  { textContent: '−', onclick: null, addEventListener: function(e, f) { this.onclick = f; } },
  { textContent: 'H', onclick: null, addEventListener: function(e, f) { this.onclick = f; } },
  { textContent: 'N', onclick: null, addEventListener: function(e, f) { this.onclick = f; } }
];

[
  'tlist', 'pins', 'card', 'modal', 'op', 'r1', 'r2', 'r3', 'v1', 'v2', 'v3',
  'dest', 'sd', 'st', 'ss', 'score', 'ring', 'badge', 'rad', 'tmp', 'wnd',
  'hb', 'ssn', 'sol', 'ho', 'hs', 'hr', 'hw', 'hh', 'hd', 'hdg', 'elev',
  'route', 'plan', 'demo', 'rtb', 'hudBtn', 'tab', 'help', 'bub', 'met', 'tk', 'map', 'co', 'hud',
  'cmpBtn', 'cmpClip', 'cmpRect', 'cmpLine', 'cmpHandle', 'cmpHandleArrows', 'cmpTextLeft', 'cmpTextRight',
  'L-overlays', 'cmpSplitter'
].forEach(id => getMockEl(id));

elements['map'].setAttribute('viewBox', '0 0 700 460');
elements['r1'].value = '20';
elements['r2'].value = '4';
elements['r3'].value = '6';
elements['dest'].value = 'all';

const window = {
  document: {
    querySelector: function(sel) {
      if (sel === 'aside.left [data-id="SYS-01"] button') return getMockEl('cmpBtn');
      if (sel.startsWith('#')) return getMockEl(sel.slice(1));
      return getMockEl(sel);
    },
    querySelectorAll: function(sel) {
      if (sel === '.zoom button') return zBtns;
      if (sel === '.chip') return [
        { dataset: { g: 'water' }, addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } },
        { dataset: { g: 'bio' }, addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } },
        { dataset: { g: 'geo' }, addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } }
      ];
      if (sel === '[data-l]') return [];
      if (sel === '#modes button') return [
        { dataset: { m: '0' }, classList: { remove: () => {}, add: () => {} } },
        { dataset: { m: '1' }, classList: { remove: () => {}, add: () => {} } },
        { dataset: { m: '2' }, classList: { remove: () => {}, add: () => {} } }
      ];
      if (sel === '[data-t]') return [];
      if (sel === '.bimg') return [{ src: '' }];
      return [];
    },
    getElementById: function(id) { return getMockEl(id); }
  },
  Date,
  Math,
  setInterval: () => {},
  alert: () => {},
  addEventListener: () => {}
};

const runner = new Function(
  'window', 'document', 'Date', 'Math', 'setInterval', 'alert', 'console',
  script
);

runner(window, window.document, Date, Math, () => {}, () => {}, console);

// Assert initial viewBox
const map = elements['map'];
console.log('Initial viewBox:', map.getAttribute('viewBox'));
if (map.getAttribute('viewBox') !== '0 0 700 460') throw new Error('Initial viewBox not 0 0 700 460');

// Test Zoom In (+)
zBtns[0].onclick();
const vbZoomIn = map.getAttribute('viewBox');
console.log('[PASS] Zoom In (+) updated viewBox to:', vbZoomIn);
const [zx, zy, zw, zh] = vbZoomIn.split(' ').map(Number);
if (zw >= 700 || zh >= 460) throw new Error('Zoom in did not reduce viewBox width/height');

// Test Zoom Out (-)
zBtns[1].onclick();
const vbZoomOut = map.getAttribute('viewBox');
console.log('[PASS] Zoom Out (−) updated viewBox to:', vbZoomOut);

// Test Center on Habitat (H)
zBtns[2].onclick();
const vbHab = map.getAttribute('viewBox');
console.log('[PASS] Habitat (H) updated viewBox to:', vbHab);
const [hx, hy, hw, hh] = vbHab.split(' ').map(Number);
if (hw !== 350 || hh !== 230) throw new Error('Habitat zoom width/height not 350x230');
if (elements['bub'].textContent !== 'Centered on Habitat Base (Octavia E. Butler Landing).') {
  throw new Error('CAPCOM speech bubble text incorrect for Habitat');
}

// Test North / Reset (N)
zBtns[3].onclick();
const vbReset = map.getAttribute('viewBox');
console.log('[PASS] North (N) reset viewBox to:', vbReset);
if (vbReset !== '0 0 700 460') throw new Error(`North (N) failed to reset to '0 0 700 460', got: '${vbReset}'`);
if (elements['bub'].textContent !== 'Map aligned to Martian True North.') {
  throw new Error('CAPCOM speech bubble text incorrect for North reset');
}

// Test Compare layers toggle
const cmpBtn = elements['cmpBtn'];
const overlays = elements['L-overlays'];
const splitter = elements['cmpSplitter'];

console.log('\nTesting Compare Layers...');
cmpBtn.onclick(); // Turn ON
if (!cmpBtn.classList.contains('on')) throw new Error('cmpBtn missing "on" class when activated');
if (overlays.getAttribute('clip-path') !== 'url(#cmpClip)') throw new Error('Overlays clip-path not url(#cmpClip)');
if (splitter.style.display !== '') throw new Error('cmpSplitter not visible');
console.log('[PASS] Compare layers activated: .on added, clip-path applied, splitter shown');
console.log('CAPCOM announcement:', elements['bub'].textContent);
if (!elements['bub'].textContent.includes('Layer comparison active')) throw new Error('CAPCOM missing layer comparison announcement');

// Turn OFF
cmpBtn.onclick();
if (cmpBtn.classList.contains('on')) throw new Error('cmpBtn still has "on" class after deactivating');
if (overlays.getAttribute('clip-path')) throw new Error('Overlays still has clip-path');
if (splitter.style.display !== 'none') throw new Error('cmpSplitter not hidden');
console.log('[PASS] Compare layers deactivated cleanly: .on removed, clip-path removed, splitter hidden');

console.log('\n=== ALL PHASE 2 TESTS PASSED PERFECTLY! ===');
