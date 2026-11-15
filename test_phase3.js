const fs = require('fs');

console.log('=== TEST 1: SCRIPT SYNTAX VALIDATION (PHASE 3) ===');
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

console.log('\n=== TEST 2: FUNCTIONAL A* ROUTING & GEOMETRY ASSERTIONS ===');
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

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
        display: '',
        opacity: 0
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
        return {
          clearRect: () => {},
          beginPath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          closePath: () => {},
          fill: () => {},
          stroke: () => {}
        };
      },
      addEventListener: function(evt, fn) { this['on' + evt] = fn; },
      getBoundingClientRect: () => ({ left: 0, top: 0, width: 700, height: 460 })
    };
  }
  return elements[id];
}

const zBtns = [
  { textContent: '+', onclick: null },
  { textContent: '−', onclick: null },
  { textContent: 'H', onclick: null },
  { textContent: 'N', onclick: null }
];

const modeBtns = [
  { dataset: { m: '0' }, classList: { remove: () => {}, add: () => {} } },
  { dataset: { m: '1' }, classList: { remove: () => {}, add: () => {} } },
  { dataset: { m: '2' }, classList: { remove: () => {}, add: () => {} } }
];

[
  'tlist', 'pins', 'card', 'modal', 'op', 'r1', 'r2', 'r3', 'v1', 'v2', 'v3',
  'dest', 'sd', 'st', 'ss', 'score', 'ring', 'badge', 'rad', 'tmp', 'wnd',
  'hb', 'ssn', 'sol', 'ho', 'hs', 'hr', 'hw', 'hh', 'hd', 'hdg', 'elev',
  'route', 'plan', 'demo', 'rtb', 'hudBtn', 'tab', 'help', 'bub', 'met', 'tk', 'map', 'co', 'hud',
  'cmpBtn', 'cmpClip', 'cmpRect', 'cmpLine', 'cmpHandle', 'cmpHandleArrows', 'cmpTextLeft', 'cmpTextRight',
  'L-overlays', 'cmpSplitter', 'L-steep'
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
      if (sel === '#modes button') return modeBtns;
      if (sel === '.chip') return [
        { dataset: { g: 'water' }, addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } },
        { dataset: { g: 'bio' }, addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } },
        { dataset: { g: 'geo' }, addEventListener: () => {}, classList: { remove: () => {}, add: () => {} } }
      ];
      if (sel === '[data-l]') return [];
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

// Helper to run route calculation in runner scope
function runPlan(dest, slope, modeVal) {
  elements['dest'].value = dest;
  elements['r1'].value = String(slope);
  const fn = new Function('window', 'document', script + `;
    mode = ${modeVal};
    $('#dest').value = '${dest}';
    $('#r1').value = '${slope}';
    plan();
    return {
      d: $('#route').getAttribute('d'),
      sd: $('#sd').textContent,
      st: $('#st').textContent,
      ss: $('#ss').textContent,
      score: $('#score').textContent,
      path: window.currentPath,
      steepHtml: $('#L-steep').innerHTML
    };
  `);
  return fn(window, window.document);
}

// 1. Assert routes for dest = 'A', 'B', 'C', 'all' are different and end at target coords
console.log('Testing destination routes and terminal coordinates...');
const rA = runPlan('A', 20, 0);
const rB = runPlan('B', 20, 0);
const rC = runPlan('C', 20, 0);
const rAll = runPlan('all', 20, 0);

console.log(`Route A: ${rA.sd}, ${rA.st}, ${rA.ss} | Ends: ${rA.d.slice(-20)}`);
console.log(`Route B: ${rB.sd}, ${rB.st}, ${rB.ss} | Ends: ${rB.d.slice(-20)}`);
console.log(`Route C: ${rC.sd}, ${rC.st}, ${rC.ss} | Ends: ${rC.d.slice(-20)}`);
console.log(`Route All: ${rAll.sd}, ${rAll.st}, ${rAll.ss} | Ends: ${rAll.d.slice(-20)}`);

if (rA.d === rB.d || rB.d === rC.d || rC.d === rAll.d) {
  throw new Error('Destination routes are not distinct!');
}

if (!rA.d.endsWith('290 218')) throw new Error('Route A does not end at Target A (290 218)');
if (!rB.d.endsWith('405 205')) throw new Error('Route B does not end at Target B (405 205)');
if (!rC.d.endsWith('540 180')) throw new Error('Route C does not end at Target C (540 180)');
if (!rAll.d.endsWith('540 180')) throw new Error('Route All does not end at Target C (540 180)');
console.log('[PASS] All destination routes are distinct and terminate at exact target coords.');

// 2. Assert modes on dest = 'all' produce distinct routes and Safest <= Fastest slope
console.log('\nTesting routing modes on dest = "all"...');
const rSafest = runPlan('all', 20, 0);
const rFastest = runPlan('all', 20, 1);
const rScience = runPlan('all', 20, 2);

console.log(`Safest: d=${rSafest.d.slice(0, 30)}... | ${rSafest.sd}, ${rSafest.st}, ${rSafest.ss}`);
console.log(`Fastest: d=${rFastest.d.slice(0, 30)}... | ${rFastest.sd}, ${rFastest.st}, ${rFastest.ss}`);
console.log(`Most Science: d=${rScience.d.slice(0, 30)}... | ${rScience.sd}, ${rScience.st}, ${rScience.ss}`);

if (rSafest.d === rFastest.d) throw new Error('Safest and Fastest routes are identical!');
if (rFastest.d === rScience.d) throw new Error('Fastest and Most Science routes are identical!');

const slopeSafest = parseFloat(rSafest.ss);
const slopeFastest = parseFloat(rFastest.ss);
if (slopeSafest > slopeFastest) {
  throw new Error(`Safest mode has higher steepest slope (${slopeSafest}) than Fastest (${slopeFastest})`);
}
console.log(`[PASS] Routing modes produce distinct geometries: Safest (${slopeSafest}°) <= Fastest (${slopeFastest}°).`);

// 3. Assert lowering max slope from 25 to 12 causes detour and updates #L-steep
console.log('\nTesting Max slope slider constraint (25 deg vs 12 deg)...');
const rSlope25 = runPlan('all', 25, 1);
const rSlope12 = runPlan('all', 12, 1);

console.log(`MaxSlope 25 deg: steepest=${rSlope25.ss}, dist=${rSlope25.sd}`);
console.log(`MaxSlope 12 deg: steepest=${rSlope12.ss}, dist=${rSlope12.sd}`);

if (rSlope25.d === rSlope12.d) {
  throw new Error('Lowering Max slope from 25 to 12 did not alter route geometry!');
}
const slopeAt12 = parseFloat(rSlope12.ss);
if (slopeAt12 > 12) {
  throw new Error(`Route at maxSlope=12 exceeds limit (steepest=${slopeAt12})`);
}

if (rSlope25.steepHtml.length >= rSlope12.steepHtml.length) {
  throw new Error('Lowering max slope did not expand #L-steep overlay!');
}
console.log(`[PASS] Lowering maxSlope reshapes A* path (25° -> 12°) and expands #L-steep hazard overlay.`);

console.log('\n=== ALL PHASE 3 TESTS PASSED 100% PERFECTLY! ===');
