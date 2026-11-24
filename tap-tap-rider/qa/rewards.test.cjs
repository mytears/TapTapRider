/* Run from any directory with node tap-tap-rider/qa/rewards.test.cjs. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = file => fs.readFileSync(path.join(__dirname, '../dist', file), 'utf8');
let stored = null;
const math = Object.create(Math);
math.random = () => 0.1;
const scope = {
  window: {}, Math: math,
  localStorage: {getItem: () => stored, setItem: (key, value) => {stored = value;}}
};
vm.createContext(scope);
for (const file of ['achievements.js', 'model.js']) vm.runInContext(source(file), scope);
const G = scope.window.RiderGame;
const H = scope.window.RiderAchievements;

assert.equal(H.definitions.length, 30);
assert.equal(new Set(H.definitions.map(a => a.id)).size, 30);
const state = G.fresh();
state.gender = 'male';
assert.equal(state.order.premium, false);
assert.equal(G.start(state), true);

const optionalAd = G.fresh();
optionalAd.gender = 'female';
Object.assign(optionalAd.order, {premium: true, regularFare: 3200, fare: 8000});
assert.equal(G.start(optionalAd), false);
assert.equal(G.useRegularFare(optionalAd, optionalAd.order.id + 1), false);
assert.equal(G.useRegularFare(optionalAd, optionalAd.order.id), true);
assert.equal(optionalAd.order.fare, 3200);
assert.equal(G.unlockPremium(optionalAd, optionalAd.order.id), false);
assert.equal(G.start(optionalAd), true);
assert.equal(G.useRegularFare(optionalAd, optionalAd.order.id), false);
for (let i = 0; i < 200; i++) assert.equal(G.tap(state), 'boost');
state.phase = 'handoff';
state.order.age = 10;
G.act(state, 'deliver');
assert.equal(state.phase, 'result');
assert.equal(state.count, 1);
assert.equal(state.stats.fast, 1);
assert.equal(state.stats.perfect, 1);
assert.equal(state.stats.peak, 1);
assert.equal(state.stats.foods.length, 1);
G.act(state, 'deliver');
assert.equal(state.count, 1);
const beforeReward = state.money;
assert.equal(H.claim(state, 'deliver-1'), 500);
assert.equal(H.claim(state, 'deliver-1'), 0);
assert.equal(H.claim(state, 'deliver-100'), 0);
assert.equal(H.claim(state, '__proto__'), 0);
assert.equal(state.money, beforeReward + 500);

function nextOffer(s) {
  G.act(s, 'next');
  G.advance(s, 6);
}
for (let i = 1; i <= 5; i++) {
  nextOffer(state);
  assert.equal(state.order.premium, i === 5);
}
assert.equal(state.order.premium, true);
assert.equal(state.order.fare, state.order.regularFare * 2.5);
assert.equal(G.start(state), false);
assert.equal(G.unlockPremium(state, state.order.id - 1), false);
assert.equal(G.unlockPremium(state, state.order.id), true);
assert.equal(G.unlockPremium(state, state.order.id), false);
G.save(state);
const resumed = G.load();
assert.equal(resumed.order.adUnlocked, true);
assert.equal(G.start(resumed), true);
assert.equal(G.unlockPremium(resumed, resumed.order.id), false);
assert.equal(H.claim(resumed, 'deliver-1'), 0);
const staleOrder = state.order.id;
G.act(state, 'next');
math.random = () => 0.9;
G.advance(state, 10);
assert.equal(state.order.premium, false);
assert.equal(G.unlockPremium(state, staleOrder), false);
assert.equal(G.start(state), true);

// Both interval boundaries must hold over repeated cycles, including reloads.
for (const [randomValue, interval] of [[0, 5], [0.999999, 10]]) {
  math.random = () => randomValue;
  let cadence = G.fresh();
  cadence.count = 1;
  for (let cycle = 0; cycle < 20; cycle++) {
    for (let call = 1; call <= interval; call++) {
      nextOffer(cadence);
      assert.equal(cadence.order.premium, call === interval);
      const remaining = cadence.premiumCallsRemaining;
      G.save(cadence);
      // Reload with a different RNG: the scheduled interval must not change.
      math.random = () => 1 - randomValue - 0.000001;
      cadence = G.load();
      assert.equal(cadence.premiumCallsRemaining, remaining);
      math.random = () => randomValue;
    }
  }
}

// Every possible interval is selectable, and skipped/regular-fare calls count.
const cadence = G.fresh();
cadence.count = 1;
let previousPremium = 0;
let premiumCount = 0;
math.random = () => ((premiumCount % 6) + 0.1) / 6;
for (let call = 1; call <= 450; call++) {
  nextOffer(cadence);
  if (cadence.order.premium) {
    const interval = call - previousPremium;
    assert.equal(interval, premiumCount === 0 ? 5 : 5 + ((premiumCount - 1) % 6));
    previousPremium = call;
    premiumCount++;
    assert.equal(G.useRegularFare(cadence, cadence.order.id), true);
  }
  assert(call - previousPremium < 10);
}
assert(premiumCount > 50);

const legacy = G.fresh();
Object.assign(legacy, {count: 25, total: 120000, money: 17, owned: ['walk', 'bike'], speedGear: 2, quick: 2});
legacy.history = [{score: 5, fast: true, food: 'burger'}];
delete legacy.stats;
delete legacy.achievements;
delete legacy.premiumCallsRemaining;
stored = JSON.stringify(legacy);
const migrated = G.load();
assert.equal(migrated.count, 25);
assert.equal(migrated.money, 17);
assert(migrated.achievements['deliver-25']);
assert(migrated.achievements['income-100k']);
assert(migrated.achievements['own-bike']);
assert.equal(migrated.stats.fast, 2);
assert.equal(migrated.stats.rain, 0);
nextOffer(migrated);
assert.equal(migrated.order.premium, false);
assert(migrated.premiumCallsRemaining >= 4 && migrated.premiumCallsRemaining <= 9);

const completed = G.fresh();
Object.assign(completed, {count: 100, total: 1000000, speedGear: 5, owned: G.vehicles.map(v => v.id)});
Object.assign(completed.stats, {fast: 50, perfect: 50, rain: 10, peak: 10, foods: G.foods.map(f => f[0])});
assert.equal(H.update(completed).length, 30);
assert.equal(H.available(completed), 30);
for (const item of H.definitions) assert.equal(H.claim(completed, item.id), item.reward);
assert.equal(completed.money, H.definitions.reduce((sum, item) => sum + item.reward, 0));
G.save(completed);
for (const item of H.definitions) assert.equal(H.claim(G.load(), item.id), 0);

function adEnvironment(android, nativeBridge) {
  let clock = 0;
  let nextId = 0;
  const intervals = new Map();
  const timeouts = new Map();
  const messages = [];
  const window = {};
  if (nativeBridge) window.RiderNativeAds = {postMessage: data => messages.push(JSON.parse(data))};
  const document = {hidden: false};
  const context = {window, document, location: {hostname: android ? 'appassets.androidplatform.net' : 'localhost'},
    performance: {now: () => clock},
    setInterval: callback => {intervals.set(++nextId, callback); return nextId;},
    clearInterval: id => intervals.delete(id),
    setTimeout: callback => {timeouts.set(++nextId, callback); return nextId;},
    clearTimeout: id => timeouts.delete(id)
  };
  vm.createContext(context);
  vm.runInContext(source('ads.js'), context);
  return {
    ads: window.RiderAds, document, messages,
    advance: ticks => {for (let i = 0; i < ticks; i++) {clock += 200; for (const callback of [...intervals.values()]) callback();}},
    reply: (id, status) => window.RiderNativeAds.onmessage({data: JSON.stringify({id, status})}),
    timeout: () => {for (const callback of [...timeouts.values()]) callback();}
  };
}

async function testAds() {
  const web = adEnvironment(false, false);
  const cancelled = web.ads.request(() => {});
  web.advance(10);
  web.ads.cancel();
  assert.equal((await cancelled).earned, false);
  web.advance(50);
  const reward = web.ads.request(() => {});
  assert.equal((await web.ads.request(() => {})).earned, false);
  web.document.hidden = true;
  web.advance(50);
  web.document.hidden = false;
  web.advance(26);
  assert.equal((await reward).earned, true);
  assert.equal((await adEnvironment(true, false).ads.request(() => {})).earned, false);

  const native = adEnvironment(true, true);
  let promise = native.ads.request(() => {});
  native.reply('other-request', 'earned');
  native.reply(native.messages[0].id, 'cancelled');
  assert.equal((await promise).earned, false);
  promise = native.ads.request(() => {});
  const id = native.messages[1].id;
  native.reply(id, 'showing');
  native.reply(id, 'earned');
  assert.equal((await promise).earned, true);
  native.reply(id, 'earned');
  promise = native.ads.request(() => {});
  native.timeout();
  assert.equal((await promise).earned, false);
  console.log('Passed 5–10 call intervals (all six choices), reload persistence, optional ads, 30 achievements, save migration, duplicate prevention, and web/native ad lifecycle tests.');
}
testAds().catch(error => {console.error(error); process.exitCode = 1;});
