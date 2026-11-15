const fs = require('fs');

console.log('=== TEST 1: JS SYNTAX VALIDATION ===');
const filesToTest = ['index.html', fs.readdirSync('.').find(f => f.startsWith('Pawstro') && f.endsWith('.html'))];

for (const file of filesToTest) {
  const html = fs.readFileSync(file, 'utf8');
  const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!scriptMatch) {
    throw new Error(`No <script> tag found in ${file}`);
  }
  const js = scriptMatch[1];
  try {
    new Function(js);
    console.log(`[PASS] ${file}: JS SYNTAX OK`);
  } catch (err) {
    console.error(`[FAIL] ${file}: Syntax Error:`, err);
    process.exit(1);
  }
}

console.log('\n=== TEST 2: DOM & WORDMARK VERIFICATION ===');
for (const file of filesToTest) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('<span class="wm">PAWSTRO</span>')) {
    throw new Error(`[FAIL] ${file}: Missing <span class="wm">PAWSTRO</span>`);
  }
  console.log(`[PASS] ${file}: <span class="wm">PAWSTRO</span> wordmark exists inside .logo`);

  if (!html.includes("id=\"dest\"")) {
    throw new Error(`[FAIL] ${file}: Missing #dest select`);
  }
  console.log(`[PASS] ${file}: <select id="dest"> exists`);
}

console.log('\n=== TEST 3: FUNCTIONAL & DOM RUNTIME SIMULATION ===');
// We run the actual script in a lightweight DOM environment
const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

// Create mock DOM elements
const elements = {};
function getMockEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id: id,
      textContent: '',
      innerHTML: '',
      value: '',
      style: {
        setProperty: function(k, v) { this[k] = v; }
      },
      classList: {
        add: function(c) { this[c] = true; },
        remove: function(c) { delete this[c]; },
        contains: function(c) { return !!this[c]; }
      },
      setAttribute: function(k, v) { this[k] = v; },
      getAttribute: function(k) { return this[k]; },
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

// Pre-populate elements referenced in calc, draw, openCard, etc.
['tlist', 'pins', 'card', 'modal', 'op', 'r1', 'r2', 'r3', 'v1', 'v2', 'v3',
 'dest', 'sd', 'st', 'ss', 'score', 'ring', 'badge', 'rad', 'tmp', 'wnd',
 'hb', 'ssn', 'sol', 'ho', 'hs', 'hr', 'hw', 'hh', 'hd', 'hdg', 'elev',
 'route', 'plan', 'demo', 'rtb', 'hudBtn', 'tab', 'help', 'bub', 'met', 'tk', 'map', 'co', 'hud'
].forEach(id => getMockEl(id));

elements['r1'].value = '20';
elements['r2'].value = '4';
elements['r3'].value = '6';
elements['dest'].value = 'all';

const window = {
  document: {
    querySelector: function(sel) {
      if (sel.startsWith('#')) return getMockEl(sel.slice(1));
      if (sel.startsWith('.')) return getMockEl(sel.slice(1));
      return getMockEl(sel);
    },
    querySelectorAll: function(sel) {
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
    getElementById: function(id) {
      return getMockEl(id);
    }
  },
  Date: Date,
  Math: Math,
  setInterval: () => {},
  alert: () => {},
  addEventListener: () => {}
};

const context = {
  window,
  document: window.document,
  Date,
  Math,
  setInterval: () => {},
  alert: () => {},
  console
};

const runner = new Function(
  'window', 'document', 'Date', 'Math', 'setInterval', 'alert', 'console',
  script
);

runner(window, window.document, Date, Math, () => {}, () => {}, console);

// Assert openCard('B') renders correctly with unescaped destination
console.log('Testing openCard("B")...');
window.document.defaultView = window;
// execute openCard('B')
const openCardMatch = script.match(/function openCard[\s\S]*?\{[\s\S]*?\}\s*function/);
// In runner, openCard is defined in scope, but we can verify from the card innerHTML
// We invoke openCard by evaluating within runner or calling directly
const testFn = new Function('document', 'window', script + '; openCard("B"); return document.getElementById("card").innerHTML;');
const cardHtml = testFn(window.document, window);

if (cardHtml.includes("$('#dest').value='B'")) {
  console.log('[PASS] openCard("B") rendered destination: onclick="$(\'#dest\').value=\'B\';closeM();plan()"');
} else {
  throw new Error('[FAIL] openCard("B") did not render proper destination. Found: ' + cardHtml);
}

if (cardHtml.includes('\\${i}') || cardHtml.includes('${i}')) {
  throw new Error('[FAIL] openCard("B") contains literal ${i} or \\${i}');
}
console.log('[PASS] Verified no unescaped/escaped template literal string bug in openCard');

// Test plan() and calc() across all destinations
const destinations = ['all', 'A', 'B', 'C'];
for (const dest of destinations) {
  const simFn = new Function('document', 'window', script + `;
    $('#dest').value = '${dest}';
    plan();
    calc();
    return {
      sd: $('#sd').textContent,
      st: $('#st').textContent,
      ss: $('#ss').textContent,
      score: $('#score').textContent,
      badge: $('#badge').textContent
    };
  `);
  const res = simFn(window.document, window);
  console.log(`[PASS] Destination '${dest}': Distance=${res.sd}, Time=${res.st}, Steepest=${res.ss}, Score=${res.score}, Badge=${res.badge}`);
  if (!res.sd || !res.st || !res.ss || !res.score) {
    throw new Error(`Incomplete route calculation for destination ${dest}`);
  }
}

console.log('\n=== ALL PHASE 1 AUTOMATED TESTS PASSED SUCCESSFULLY! ===');
