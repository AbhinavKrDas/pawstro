const fs = require('fs');

console.log('=== TEST 1: SCRIPT SYNTAX VALIDATION (PHASE 5) ===');
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

console.log('\n=== TEST 2: FUNCTIONAL HUD, EXPORT & HELP MODAL TESTS ===');
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
  getMockEl('hudRtb')
];

[
  'tlist', 'pins', 'card', 'modal', 'op', 'r1', 'r2', 'r3', 'v1', 'v2', 'v3',
  'dest', 'sd', 'st', 'ss', 'score', 'ring', 'badge', 'rad', 'tmp', 'wnd',
  'hb', 'ssn', 'sol', 'ho', 'hs', 'hr', 'hw', 'hh', 'hd', 'hdg', 'elev',
  'route', 'plan', 'demo', 'rtb', 'hudBtn', 'tab', 'help', 'bub', 'met', 'tk', 'map', 'co', 'hud',
  'cmpBtn', 'cmpClip', 'cmpRect', 'cmpLine', 'cmpHandle', 'cmpHandleArrows', 'cmpTextLeft', 'cmpTextRight',
  'L-overlays', 'cmpSplitter', 'L-steep', 'hudO2Bar', 'fieldNote', 'sampleCheck',
  'hudNextWp', 'hudMarkSample', 'hudMuteAlerts', 'hudRtb', 'hudMiniMap', 'hudMiniRoute', 'hudMiniTarget', 'hudMiniAstro',
  'btnExportRoute', 'btnBriefingPdf'
].forEach(id => getMockEl(id));

elements['map'].setAttribute('viewBox', '0 0 700 460');
elements['r1'].value = '20';
elements['r2'].value = '4';
elements['r3'].value = '6';
elements['dest'].value = 'all';

// Mock tl and alert elements inside #hud
const mockTl = getMockEl('hudTl');
const mockAlert = getMockEl('hudAlert');
const mockHudBadge = getMockEl('hudBadge');

const mockStorage = {};
const window = {
  document: {
    querySelector: function(sel) {
      if (sel === 'aside.left [data-id="SYS-01"] button') return getMockEl('cmpBtn');
      if (sel === '#hud .tl') return mockTl;
      if (sel === '#hud .alert') return mockAlert;
      if (sel === '#hud .badge') return mockHudBadge;
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
    getElementById: function(id) { return getMockEl(id); },
    body: {
      appendChild: () => {},
      removeChild: () => {}
    },
    createElement: (tag) => ({ tag, setAttribute: () => {}, click: () => {} })
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
  print: () => {},
  addEventListener: () => {},
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} }
};

const runner = new Function(
  'window', 'document', 'localStorage', 'Date', 'Math', 'setInterval', 'alert', 'console',
  script
);

runner(window, window.document, window.localStorage, Date, Math, () => {}, () => {}, console);

// Assertion 1: HUD Open & Waypoint Navigation
console.log('Testing HUD mode open and Waypoint Navigation...');
const testHudFn = new Function('window', 'document', 'localStorage', script + `;
  $('#dest').value = 'all';
  plan();
  $('#hudBtn').onclick();
  const isHudOpen = $('#hud').classList.contains('show');
  const wp0Name = document.querySelector('#hud .tl').innerHTML;
  const hdg0 = $('#hdg').textContent;
  
  // Advance to next waypoint
  $('#hudNextWp').onclick();
  const wp1Name = document.querySelector('#hud .tl').innerHTML;
  const hdg1 = $('#hdg').textContent;
  
  // Mark sample
  $('#hudMarkSample').onclick();
  const isSampled = targetState['B'].sampled;
  const alertText = document.querySelector('#hud .alert').textContent;
  
  // Mute alerts
  $('#hudMuteAlerts').onclick();
  const isMuted = document.querySelector('#hud .alert').style.display === 'none';
  $('#hudMuteAlerts').onclick();
  const isUnmuted = document.querySelector('#hud .alert').style.display !== 'none';
  
  // Return to Tablet view
  $('#tab').onclick();
  const isHudClosed = !$('#hud').classList.contains('show');
  
  return {
    isHudOpen,
    wp0Name,
    hdg0,
    wp1Name,
    hdg1,
    isSampled,
    alertText,
    isMuted,
    isUnmuted,
    isHudClosed
  };
`);

const resHud = testHudFn(window, window.document, window.localStorage);
console.log('HUD Test Result:', resHud);
if (!resHud.isHudOpen) throw new Error('HUD failed to open on #hudBtn click');
if (resHud.wp0Name === resHud.wp1Name) throw new Error('Next waypoint failed to update waypoint name');
if (!resHud.isSampled) throw new Error('Mark sample failed to update targetState');
if (!resHud.isMuted || !resHud.isUnmuted) throw new Error('Mute alerts toggle failed');
if (!resHud.isHudClosed) throw new Error('Tablet view button failed to close HUD');
console.log('[PASS] HUD Mode opens, cycles waypoints, logs samples, toggles alerts, and returns to Tablet view.');

// Assertion 2: Styled Help Modal (no alert)
console.log('\nTesting Styled Help Modal...');
const testHelpFn = new Function('window', 'document', 'localStorage', script + `;
  $('#help').onclick();
  return {
    isOpen: $('#modal').classList.contains('show'),
    hasGuide: $('#card').innerHTML.includes('HOW PAWSTRO WORKS'),
    hasShortcuts: $('#card').innerHTML.includes('KEYBOARD SHORTCUTS')
  };
`);
const resHelp = testHelpFn(window, window.document, window.localStorage);
console.log('Help Modal Result:', resHelp);
if (!resHelp.isOpen) throw new Error('Help modal did not open on #help click');
if (!resHelp.hasGuide || !resHelp.hasShortcuts) throw new Error('Help modal missing guide/shortcuts content');
console.log('[PASS] Help button opens rich NASA mission control manual modal.');

// Assertion 3: Mission Export JSON Builder
console.log('\nTesting Mission Export JSON Builder...');
const testExportFn = new Function('window', 'document', 'localStorage', script + `;
  $('#dest').value = 'all';
  plan();
  return buildMissionExportJson();
`);
const resExport = testExportFn(window, window.document, window.localStorage);
console.log('Export JSON Metadata:', {
  mission: resExport.mission,
  sol: resExport.sol,
  routeStats: resExport.routeStats,
  safetyScore: resExport.safetyScore,
  goStatus: resExport.goStatus,
  waypointsCount: resExport.waypoints.length
});
if (!resExport.waypoints || resExport.waypoints.length === 0) throw new Error('Export JSON missing waypoints');
if (resExport.safetyScore === undefined) throw new Error('Export JSON missing safetyScore');
if (!resExport.targets || !resExport.targets.A) throw new Error('Export JSON missing targets state');
console.log('[PASS] Mission Export creates complete JSON telemetry and waypoint payload.');

// Assertion 4: Printable Briefing PDF View
console.log('\nTesting Printable Briefing PDF view...');
const testBriefingFn = new Function('window', 'document', 'localStorage', script + `;
  $('#btnBriefingPdf').onclick();
  return {
    isOpen: $('#modal').classList.contains('show'),
    hasTitle: $('#card').innerHTML.includes('PAWSTRO // MISSION PLAN'),
    hasPrintBtn: $('#card').innerHTML.includes('Print / Save PDF')
  };
`);
const resBriefing = testBriefingFn(window, window.document, window.localStorage);
console.log('Briefing Result:', resBriefing);
if (!resBriefing.isOpen || !resBriefing.hasTitle || !resBriefing.hasPrintBtn) {
  throw new Error('Briefing PDF modal failed to render');
}
console.log('[PASS] Briefing PDF renders printable EVA Mission Briefing sheet.');

console.log('\n=== ALL PHASE 5 TESTS PASSED 100% PERFECTLY! ===');
