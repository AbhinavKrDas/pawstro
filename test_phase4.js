const fs = require('fs');

console.log('=== TEST 1: SCRIPT SYNTAX VALIDATION (PHASE 4) ===');
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

console.log('\n=== TEST 2: FUNCTIONAL SAFETY SCORING, TIMER & PERSISTENCE ===');
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
      checked: false,
      attributes: {},
      style: {
        setProperty: function(k, v) { this[k] = v; },
        display: '',
        opacity: 0,
        width: '',
        background: ''
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

const rtbBtns = [
  getMockEl('rtb'),
  { style: {}, onclick: null }
];

[
  'tlist', 'pins', 'card', 'modal', 'op', 'r1', 'r2', 'r3', 'v1', 'v2', 'v3',
  'dest', 'sd', 'st', 'ss', 'score', 'ring', 'badge', 'rad', 'tmp', 'wnd',
  'hb', 'ssn', 'sol', 'ho', 'hs', 'hr', 'hw', 'hh', 'hd', 'hdg', 'elev',
  'route', 'plan', 'demo', 'rtb', 'hudBtn', 'tab', 'help', 'bub', 'met', 'tk', 'map', 'co', 'hud',
  'cmpBtn', 'cmpClip', 'cmpRect', 'cmpLine', 'cmpHandle', 'cmpHandleArrows', 'cmpTextLeft', 'cmpTextRight',
  'L-overlays', 'cmpSplitter', 'L-steep', 'hudO2Bar', 'fieldNote', 'sampleCheck'
].forEach(id => getMockEl(id));

elements['map'].setAttribute('viewBox', '0 0 700 460');
elements['r1'].value = '20';
elements['r2'].value = '4';
elements['r3'].value = '6';
elements['dest'].value = 'all';

// In-memory mock localStorage
const mockStorage = {};
const window = {
  document: {
    querySelector: function(sel) {
      if (sel === 'aside.left [data-id="SYS-01"] button') return getMockEl('cmpBtn');
      if (sel === '#hud .badge') return getMockEl('hudBadge');
      if (sel.startsWith('#')) return getMockEl(sel.slice(1));
      return getMockEl(sel);
    },
    querySelectorAll: function(sel) {
      if (sel === '.zoom button') return zBtns;
      if (sel === '#modes button') return modeBtns;
      if (sel === '.rtb') return rtbBtns;
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
  localStorage: {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; },
    clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
  },
  Date,
  Math,
  setInterval: () => {},
  alert: () => {},
  addEventListener: () => {}
};

const runner = new Function(
  'window', 'document', 'localStorage', 'Date', 'Math', 'setInterval', 'alert', 'console',
  script
);

runner(window, window.document, window.localStorage, Date, Math, () => {}, () => {}, console);

// Assertion 1: NO-GO test with max distance = 1 km
console.log('Testing NO-GO penalty with #r2 = 1 km...');
const testNoGoFn = new Function('window', 'document', script + `;
  $('#dest').value = 'all';
  $('#r2').value = '1';
  calc();
  return {
    badge: $('#badge').textContent,
    score: +$('#score').textContent,
    bub: $('#bub').textContent
  };
`);
const resNoGo = testNoGoFn(window, window.document);
console.log('NO-GO Result:', resNoGo);
if (resNoGo.badge !== 'NO-GO') throw new Error(`Expected NO-GO badge, got: ${resNoGo.badge}`);
if (resNoGo.score >= 60) throw new Error(`Expected score < 60, got: ${resNoGo.score}`);
console.log('[PASS] Suit limit distance violation correctly triggers NO-GO badge and score penalty.');

// Assertion 2: GO test with restored limits
console.log('\nTesting GO with restored suit limits (#r1=25, #r2=6, #r3=8)...');
const testGoFn = new Function('window', 'document', script + `;
  $('#dest').value = 'all';
  $('#r1').value = '25';
  $('#r2').value = '6';
  $('#r3').value = '8';
  calc();
  return {
    badge: $('#badge').textContent,
    score: +$('#score').textContent
  };
`);
const resGo = testGoFn(window, window.document);
console.log('GO Result:', resGo);
if (resGo.badge !== 'GO') throw new Error(`Expected GO badge, got: ${resGo.badge}`);
if (resGo.score < 60) throw new Error(`Expected score >= 60, got: ${resGo.score}`);
console.log('[PASS] Nominal suit limits correctly evaluate to GO badge (Score: ' + resGo.score + ').');

// Assertion 3: Dynamic Head back by timer test (#r3 from 8 to 2)
console.log('\nTesting dynamic Head Back By countdown (#r3 = 8 vs 2)...');
const testTimerFn = new Function('window', 'document', script + `;
  $('#dest').value = 'all';
  $('#r3').value = '8';
  calc();
  const hb8 = $('#hb').textContent;
  const hh8 = $('#hh').textContent;
  
  $('#r3').value = '2';
  calc();
  const hb2 = $('#hb').textContent;
  const hh2 = $('#hh').textContent;
  
  return { hb8, hh8, hb2, hh2 };
`);
const resTimer = testTimerFn(window, window.document);
console.log('Timer Result:', resTimer);
if (resTimer.hb8 === resTimer.hb2) throw new Error(`Changing oxygen hours did not alter #hb: ${resTimer.hb8}`);
if (resTimer.hh8 === resTimer.hh2) throw new Error(`Changing oxygen hours did not alter #hh: ${resTimer.hh8}`);
if (resTimer.hb8 !== resTimer.hh8 || resTimer.hb2 !== resTimer.hh2) throw new Error('Tablet #hb and HUD #hh out of sync');
console.log(`[PASS] Head Back By time changes dynamically with oxygen budget (${resTimer.hb8} -> ${resTimer.hb2}).`);

// Assertion 4: Field notes and sample collection persistence
console.log('\nTesting Target A field note and sample collection persistence...');
const testPersistenceFn = new Function('window', 'document', 'localStorage', script + `;
  openCard('A');
  const card1 = $('#card').innerHTML;
  
  // Update note and check sample
  targetState['A'].note = 'Carbonate sample #1';
  targetState['A'].sampled = true;
  saveTargetState();
  
  closeM();
  openCard('A');
  const card2 = $('#card').innerHTML;
  
  return {
    savedJson: window.localStorage.getItem('pawstro_target_state'),
    card2HasNote: card2.includes('Carbonate sample #1'),
    card2Checked: card2.includes('checked')
  };
`);
const resPersist = testPersistenceFn(window, window.document, window.localStorage);
console.log('Persistence Result:', resPersist);
if (!resPersist.savedJson.includes('Carbonate sample #1')) throw new Error('localStorage missing note');
if (!resPersist.card2HasNote) throw new Error('Target card does not render saved note');
if (!resPersist.card2Checked) throw new Error('Target card does not render checked sample');
console.log('[PASS] Field note and sample collection persist seamlessly across modal sessions.');

// Assertion 5: Emergency Return-to-Base
console.log('\nTesting Emergency Return-to-Base (#rtb)...');
const testRtbFn = new Function('window', 'document', script + `;
  $('#dest').value = 'C';
  plan();
  executeReturnToBase();
  return {
    d: $('#route').getAttribute('d'),
    stroke: $('#route').getAttribute('stroke'),
    sd: $('#sd').textContent,
    bub: $('#bub').textContent
  };
`);
const resRtb = testRtbFn(window, window.document);
console.log('RTB Result:', resRtb);
if (resRtb.stroke !== '#ff6b8b') throw new Error(`Expected RTB stroke #ff6b8b, got: ${resRtb.stroke}`);
if (!resRtb.d.endsWith('165 270')) throw new Error(`RTB route does not terminate at Habitat (165 270): ${resRtb.d}`);
if (!resRtb.bub.includes('Return-to-Base')) throw new Error('CAPCOM speech bubble missing RTB confirmation');
console.log('[PASS] Emergency Return-to-Base locks safe return route ending at Habitat (165 270) with coral stroke.');

console.log('\n=== ALL PHASE 4 TESTS PASSED 100% PERFECTLY! ===');
