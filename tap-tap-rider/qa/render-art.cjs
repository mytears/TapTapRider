/* Optional visual QA: NODE_PATH=<directory containing @napi-rs/canvas> node qa/render-art.cjs <output.png> */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL, fileURLToPath } = require('node:url');
const { createCanvas, Image, Path2D } = require('@napi-rs/canvas');
const root = path.resolve(__dirname, '../dist');
function canvas() { const c = createCanvas(1, 1); c.style = {}; return c; }
class LocalImage extends Image {
  set src(value) { super.src = fs.readFileSync(fileURLToPath(value)); }
}
const scope = {
  window: {}, Image: LocalImage, Path2D, URL, console,
  document: { currentScript: { src: pathToFileURL(path.join(root, 'painted-art.js')).href }, createElement: canvas }
};
vm.createContext(scope);
for (const file of ['painted-art.js', 'art.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), scope);
const vehicles = ['walk', 'bike', 'kickboard', 'ebike', 'moto', 'sport', 'car', 'rocket'];
async function main() {
  await scope.window.RiderArt.ready;
  const output = createCanvas(1440, 1100), c = output.getContext('2d');
  c.fillStyle = '#eee8dc'; c.fillRect(0, 0, output.width, output.height);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const vehicle = vehicles[Math.floor(row / 2) * 4 + col], gender = row % 2 ? 'female' : 'male';
      const stage = canvas();
      scope.window.RiderArt.drawRider(stage, { vehicle, gender, moving: true, boost: false, time: Number(process.env.ART_TIME || 960) });
      c.fillStyle = '#fffdf7'; c.fillRect(col * 360 + 8, row * 275 + 8, 344, 259);
      c.drawImage(stage, col * 360 + 18, row * 275, 324, 266.4);
      c.fillStyle = '#30463b'; c.font = '16px sans-serif';
      c.fillText(`${vehicle} / ${gender}`, col * 360 + 20, row * 275 + 256);
    }
  }
  fs.writeFileSync(process.argv[2] || path.join(__dirname, 'art-contact-sheet.png'), output.toBuffer('image/png'));
  let checked = 0;
  const probe = canvas();
  for (const vehicle of vehicles) for (const gender of ['male', 'female'])
    for (const moving of [false, true]) for (const boost of [false, true])
      for (const time of [0, 620, 670, 960, 1800, 2400]) {
        scope.window.RiderArt.drawRider(probe, {vehicle, gender, moving, boost, time, stride: time * .1}); checked++;
      }
  console.log(`${checked} rider poses rendered; contact sheet saved.`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
