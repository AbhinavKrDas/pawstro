const fs = require('fs');
const vm = require('vm');

const f1 = fs.readFileSync('d:\\akd.ai\\PAWSTRO\\index.html');
const f2 = fs.readFileSync('d:\\akd.ai\\PAWSTRO\\Pawstro – Mission Planner (1).html');

console.log('f1 length:', f1.length);
console.log('f2 length:', f2.length);
console.log('Byte-for-byte equal:', f1.equals(f2));

// Extract <script> and test compile
const html = f1.toString('utf8');
const scriptStart = html.indexOf('<script>');
const scriptEnd = html.lastIndexOf('</script>');
const scriptContent = html.substring(scriptStart + 8, scriptEnd);

try {
  new vm.Script(scriptContent);
  console.log('Script compiles cleanly with vm.Script! Zero syntax errors.');
} catch (err) {
  console.error('JS syntax error:', err.message);
  process.exit(1);
}
