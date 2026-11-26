/* Run with: node tap-tap-rider/qa/features.test.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = file => fs.readFileSync(path.join(__dirname, '../dist', file), 'utf8');
let stored = null;
const math = Object.create(Math);
math.random = () => 0.5;
const scope = {
  window: {}, Math: math,
  localStorage: { getItem: () => stored, setItem: (k, v) => { stored = v; } }
};
vm.createContext(scope);
for (const file of ['achievements.js', 'model.js']) vm.runInContext(source(file), scope);
const G = scope.window.RiderGame;

// 1. All 4 gear upgrades buy, cap at Lv.5, and affect gameplay timings & tips
const gState = G.fresh();
gState.gender = 'male';
gState.money = 500000;
assert.equal(G.gears.length, 4);
for (const g of G.gears) {
  for (let lv = 0; lv < 5; lv++) {
    assert.equal(G.buyGear(gState, g.id), '장비를 강화했어요!');
  }
  assert.equal(gState[g.id], 5);
  assert.equal(G.buyGear(gState, g.id), '최고 단계에 도달했어요.');
}
// Compare cook & climb waits with Lv.5 cookGear/navGear vs Lv.0 baseline
const baseState = G.fresh();
baseState.gender = 'male';
baseState.phase = 'shopArrive';
G.act(baseState, 'enter');
const baseCookWait = baseState.wait;
gState.phase = 'shopArrive';
G.act(gState, 'enter');
assert(gState.wait < baseCookWait * 0.6, 'cookGear Lv.5 should significantly reduce cook wait');

baseState.phase = 'entrance';
G.act(baseState, 'climb');
const baseClimbWait = baseState.wait;
gState.phase = 'entrance';
G.act(gState, 'climb');
assert(gState.wait < baseClimbWait * 0.6, 'navGear Lv.5 should significantly reduce climb wait');

// 2. Tap Fever tiers (1 -> 2 -> 3) & speed scaling
const fState = G.fresh();
fState.gender = 'female';
assert.equal(G.start(fState), true);
assert.equal(G.boostTier(fState), 0);
const walkBase = G.speed(fState);
assert.equal(walkBase, 5);
assert.equal(G.tap(fState), 'boost');
assert.equal(G.boostTier(fState), 1);
assert.equal(G.speed(fState), 5 * 2.05);
for (let i = 0; i < 3; i++) G.tap(fState);
assert.equal(G.boostTier(fState), 2);
assert.equal(G.speed(fState), 5 * 2.25);
for (let i = 0; i < 4; i++) G.tap(fState);
assert.equal(G.boostTier(fState), 3);
assert.equal(G.speed(fState), 5 * 2.5);
// Fever decays when not tapping
G.advance(fState, 1.5);
assert(fState.fever < 100);

// 3. Fast Delivery Combo & Regular Shop bonuses
const cState = G.fresh();
cState.gender = 'male';
for (let i = 1; i <= 4; i++) {
  cState.phase = 'handoff';
  cState.order.food = 'pizza';
  cState.order.fare = 2000;
  cState.order.age = 5;
  cState.order.wrong = false;
  cState.order.mixed = false;
  G.act(cState, 'deliver');
  assert.equal(cState.combo, i);
  if (i === 1) assert.equal(cState.order.paid, 2000);
  if (i === 2) assert.equal(cState.order.paid, 2100); // +5% combo
  if (i === 3) assert.equal(cState.order.paid, 2200); // +10% combo
  // After 3 deliveries, pizza becomes 단골 (+10% regular tip)!
  if (i === 4) {
    assert.equal(cState.order.regularLevel, 1);
    assert.equal(cState.order.paid, 2500); // +15% combo + 10% regular = +25%
  }
  cState.order = Object.assign({}, cState.order, { id: cState.order.id + 1, wrong: false, mixed: false, fixed: false });
}
assert.equal(cState.stats.bestCombo, 4);
assert.equal(G.regularTier(cState, 'pizza').label, '단골');
// Slow delivery resets combo while keeping bestCombo
cState.phase = 'handoff';
cState.order.age = 999;
G.act(cState, 'deliver');
assert.equal(cState.combo, 0);
assert.equal(cState.stats.bestCombo, 4);

// 4. Food Codex milestones (5, 10, 15, 20) & duplicate claim prevention
const codexState = G.fresh();
codexState.stats.foods = G.foods.slice(0, 10).map(f => f[0]);
assert.equal(G.codexAvailable(codexState), 2);
assert.equal(G.claimCodex(codexState, 5), 3000);
assert.equal(G.claimCodex(codexState, 5), 0);
assert.equal(G.claimCodex(codexState, 10), 6000);
assert.equal(G.claimCodex(codexState, 15), 0);
assert.equal(codexState.money, 9000);
assert.equal(G.codexAvailable(codexState), 0);

// 5. Dynamic Daily Missions (3 per day, scaling by vehicle tier, day rollover refresh)
const mState = G.fresh();
assert.equal(mState.dailyMissions.length, 3);
assert.equal(mState.dailyMissions[0].reward, 2200);
// Complete mission 1 and claim individually
mState.dailyMissions[0].progress = 3;
assert.equal(G.missionsAvailable(mState), 1);
assert.equal(G.claimMission(mState, 'fast3'), 2200);
assert.equal(G.claimMission(mState, 'fast3'), 0);
assert.equal(mState.money, 2200);
// Upgrade to car (tier 6 -> 4.2x) and advance to Day 2 -> rewards scale up!
mState.gender = 'male';
mState.owned.push('car');
mState.dailyMissions[1].progress = mState.dailyMissions[1].target; // unclaimed -> auto-paid at rollover
const beforeRollover = mState.money;
const autoReward = mState.dailyMissions[1].reward;
mState.minutes = 1439.5; // Day 1 -> crosses 1440 into Day 2 during advance
G.advance(mState, 1);
assert.equal(mState.money, beforeRollover + autoReward);
assert.equal(mState.dailyDay, 2);
assert.equal(mState.dailyMissions[0].reward, Math.round(2200 * 4.2 / 100) * 100);
assert.equal(mState.dailyMissions[0].progress, 0);

// 6. Haptics toggle persistence & Safe Reset preserving preferences
const rState = G.fresh();
rState.regionName = '부천';
rState.themeId = 'art';
rState.haptics = false;
rState.money = 99999;
rState.count = 12;
G.save(rState);
const loaded = G.load();
assert.equal(loaded.haptics, false);
assert.equal(loaded.regionName, '부천');
const wiped = G.reset(true, loaded);
assert.equal(wiped.money, 0);
assert.equal(wiped.count, 0);
assert.equal(wiped.regionName, '부천');
assert.equal(wiped.themeId, 'art');
assert.equal(wiped.haptics, false);

console.log('Passed all new feature QA tests: 4 gears, tap fever, fast combo, regular shops, 20-dish food codex, 3 scaled daily missions, haptics, and safe reset.');
