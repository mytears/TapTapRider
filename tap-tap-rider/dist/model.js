(() => {
  "use strict";
  const vehicles = [
    { id: "walk", name: "도보", cost: 0, speed: 5 },
    { id: "bike", name: "자전거", cost: 7500, speed: 10 },
    { id: "kickboard", name: "킥보드", cost: 16500, speed: 13 },
    { id: "ebike", name: "전기자전거", cost: 29000, speed: 17 },
    { id: "moto", name: "오토바이", cost: 48000, speed: 23 },
    { id: "sport", name: "고급 오토바이", cost: 80000, speed: 29 },
    { id: "car", name: "자동차", cost: 125000, speed: 36 },
    { id: "rocket", name: "로켓", cost: 240000, speed: 65 }
  ];

  // 20 diverse delivery foods: [id, menu display name, store suffix]
  const foods = [
    ["burger", "치즈버거 세트", "버거"],
    ["pizza", "페퍼로니 피자", "피자"],
    ["chicken", "바삭한 후라이드 치킨", "치킨"],
    ["noodles", "따끈한 잔치국수", "국수"],
    ["sushi", "모둠 초밥", "스시"],
    ["tteokbokki", "매콤한 국물 떡볶이", "분식"],
    ["sandwich", "에그 샌드위치 세트", "카페"],
    ["jjajang", "윤기 짜장면", "반점"],
    ["ramen", "진한 차슈 라멘", "라멘"],
    ["tonkatsu", "바삭 등심 돈까스", "카츠"],
    ["gimbap", "참치 김밥 세트", "김밥"],
    ["bibimbap", "돌솥 비빔밥", "한식"],
    ["kimchistew", "보글보글 김치찌개", "찌개"],
    ["jokbal", "윤기 족발 보쌈", "족발"],
    ["malatang", "얼큰 마라탕", "마라"],
    ["pasta", "크림 까르보나라", "파스타"],
    ["curry", "일본식 카레라이스", "카레"],
    ["taco", "멕시칸 타코 플래터", "타코"],
    ["bakery", "갓 구운 크루아상 세트", "베이커리"],
    ["bingsu", "달콤 망고 빙수", "디저트"]
  ];

  // Street architectural atmospheres (completely decoupled from the user's custom region name)
  const themes = [
    { id: "workshop", name: "벽돌 공방거리", short: "공방거리", image: "street" },
    { id: "avenue", name: "푸른 가로수길", short: "가로수길", image: "street-nowon" },
    { id: "art", name: "감성 예술거리", short: "예술거리", image: "street-hongdae" }
  ];

  const presetRegions = ["부천", "성수", "홍대", "노원", "강남", "해운대"];
  const homeSuffixes = ["한빛빌라", "노을아파트", "하이츠", "포레스트", "다온빌라", "리버파크", "센트럴빌"];
  const legacyMap = {
    seongsu: { region: "성수", theme: "workshop" },
    nowon: { region: "노원", theme: "avenue" },
    hongdae: { region: "홍대", theme: "art" }
  };

  function cleanRegion(raw) {
    const cleaned = String(raw || "").trim().replace(/\s+/g, " ").slice(0, 10);
    return cleaned || "성수";
  }

  function theme(id) {
    return themes.find(t => t.id === id) || themes[0];
  }

  function buildHomes(regionName) {
    const base = cleanRegion(regionName);
    return homeSuffixes.map(suffix => base + " " + suffix);
  }

  function placeFor(regionName, themeId) {
    const name = cleanRegion(regionName);
    const t = theme(themeId);
    return {
      id: t.id,
      themeId: t.id,
      name,
      street: name + " " + t.short,
      themeName: t.name,
      image: t.image,
      homes: buildHomes(name)
    };
  }

  function foodById(id) {
    return foods.find(item => item[0] === id) || foods[0];
  }

  function shopName(regionName, foodId) {
    const food = foodById(foodId);
    return cleanRegion(regionName) + (food?.[2] || "식당");
  }

  function locateOrder(order, place) {
    order.regionName = place.name;
    order.themeId = place.themeId;
    order.shop = shopName(place.name, order.food);
    const idx = Number.isInteger(order.homeIndex) ? ((order.homeIndex % place.homes.length) + place.homes.length) % place.homes.length : 0;
    order.homeIndex = idx;
    order.home = place.homes[idx];
    return order;
  }

  function setRegion(s, rawName) {
    const name = cleanRegion(rawName);
    if (s.regionName === name) return false;
    s.regionName = name;
    if (s.phase !== "result") locateOrder(s.order, placeFor(s.regionName, s.themeId));
    return true;
  }

  function setTheme(s, id) {
    const t = themes.find(item => item.id === id);
    if (!t || s.themeId === id) return false;
    s.themeId = id;
    if (s.phase !== "result") locateOrder(s.order, placeFor(s.regionName, s.themeId));
    return true;
  }

  const weekdays = ["금요일", "토요일", "일요일", "월요일", "화요일", "수요일", "목요일"];
  const roll = n => Math.floor(Math.random() * n);
  const initialMinute = 18 * 60 + 20;
  const STORE = "taptap-rider.game.v1";

  function calendar(s) {
    const day = Math.floor(s.minutes / 1440), tm = Math.floor(s.minutes) % 1440, h = Math.floor(tm / 60);
    return {
      day: day + 1,
      week: weekdays[day % 7],
      clock: String(h).padStart(2, "0") + ":" + String(tm % 60).padStart(2, "0"),
      peak: day % 7 === 1 || (day % 7 === 0 && h >= 18),
      night: h >= 20 || h < 6
    };
  }
  function rating(s) { return s.count ? s.stars / s.count : 5; }
  function vehicle(s) { return vehicles.find(x => x.id === s.vehicle) || vehicles[0]; }

  function pickDifferentFood(foodId) {
    const others = foods.filter(f => f[0] !== foodId);
    return others[roll(others.length)][0];
  }

  function offer(s, first = false) {
    const [food, name] = foods[first ? 0 : roll(foods.length)];
    const dist = first ? 0.8 : (5 + roll(22)) / 10;
    const pick = first ? 0.20 : Math.min(0.55, dist * (0.2 + Math.random() * 0.18));
    const peak = calendar(s).peak, rain = s.rain, rate = rating(s);
    const base = Math.round((1760 + dist * 1380) / 100) * 100;
    const fare = Math.round(base * (peak ? 1.1 : 1) * (rain ? 1.25 : 1) * (0.85 + rate * 0.03) / 100) * 100;
    const floor = first ? 4 : 2 + roll(7), room = first ? 2 : 1 + roll(3);
    const place = placeFor(s.regionName, s.themeId);
    return locateOrder({
      id: ++s.serial, food, name, wrongFood: pickDifferentFood(food),
      homeIndex: first ? 0 : roll(place.homes.length),
      flat: floor * 100 + room, floor, dist, pick, fare, base, peak, rain, rate,
      wrong: false, mixed: false, start: 0, age: 0, fastLimit: Math.ceil(22 + dist * 47),
      score: 0, paid: 0, fast: false, fixed: false
    }, place);
  }

  function fresh() {
    const s = {
      version: 1, regionName: "성수", themeId: "workshop",
      money: 0, count: 0, stars: 0, total: 0, gender: null,
      owned: ["walk"], vehicle: "walk", speedGear: 0,
      music: true, sfx: true, muted: false, minutes: initialMinute,
      rain: false, weatherBlock: Math.floor(initialMinute / 75), serial: 0,
      phase: "offer", order: null, phaseTime: 0, progress: 0,
      boostTime: 0, quick: 0, claimed: false,
      history: [], lastResult: null, wait: 0
    };
    s.order = offer(s, true);
    return s;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE));
      if (saved?.version === 1 && saved.order?.food && Array.isArray(saved.owned) && Number.isFinite(saved.money) && Array.isArray(saved.history)) {
        const state = Object.assign(fresh(), saved);
        // Refund retired recovery equipment once, then remove its saved level.
        const coolingLevel = Math.max(0, Math.min(5, Math.floor(Number(state.coolGear) || 0)));
        state.money += 2500 * coolingLevel * (coolingLevel + 1) / 2;
        for (const key of ["coolGear", "fatigue", "lock", "lockMax", "sinceTap"]) delete state[key];
        // Migrate legacy districtId saves cleanly
        if (!saved.regionName && saved.districtId && legacyMap[saved.districtId]) {
          state.regionName = legacyMap[saved.districtId].region;
          state.themeId = legacyMap[saved.districtId].theme;
        }
        state.regionName = cleanRegion(state.regionName);
        state.themeId = theme(state.themeId).id;
        const orderRegion = state.order.regionName || (state.order.districtId && legacyMap[state.order.districtId]?.region) || state.regionName;
        const orderTheme = state.order.themeId || (state.order.districtId && legacyMap[state.order.districtId]?.theme) || state.themeId;
        const place = placeFor(orderRegion, orderTheme);
        if (!state.order.wrongFood || state.order.wrongFood === state.order.food) {
          state.order.wrongFood = pickDifferentFood(state.order.food);
        }
        locateOrder(state.order, place);
        return state;
      }
    } catch {}
    return fresh();
  }

  function save(s) { try { localStorage.setItem(STORE, JSON.stringify(s)); return true; } catch { return false; } }
  function phase(s, name) { s.phase = name; s.phaseTime = 0; }
  function traveling(s) { return s.phase === "toShop" || s.phase === "toHome"; }

  function start(s) {
    if (s.phase !== "offer" || !s.gender) return;
    s.order.start = s.minutes; s.order.age = 0;
    s.order.mixed = s.count > 0 && Math.random() < 0.16;
    if (s.order.mixed) s.order.wrongFood = pickDifferentFood(s.order.food);
    s.progress = 0; s.boostTime = 0; phase(s, "toShop");
  }
  function next(s) { s.wait = calendar(s).peak ? 1.5 : 5; phase(s, "dispatch"); }
  function tap(s) {
    if (!traveling(s)) return false;
    s.boostTime = Math.min(1.6, s.boostTime + 0.56); return "boost";
  }
  function speed(s) { return traveling(s) ? vehicle(s).speed * (1 + 0.12 * s.speedGear) * (s.boostTime > 0 ? 2.05 : 1) : 0; }

  function advance(s, dt) {
    const oldDay = calendar(s).day;
    if (s.gender || s.count || s.phase !== "offer") s.minutes += dt * 1.2;
    if (calendar(s).day !== oldDay) { if (s.quick >= 3 && !s.claimed) s.money += 2200; s.quick = 0; s.claimed = false; }
    const block = Math.floor(s.minutes / 75);
    if (block !== s.weatherBlock) { s.weatherBlock = block; s.rain = Math.random() < 0.33; }
    s.phaseTime += dt;
    if (s.phase !== "offer" && s.phase !== "dispatch" && s.phase !== "result") s.order.age += dt;
    if (traveling(s)) {
      const leg = s.phase === "toShop" ? s.order.pick : s.order.dist - s.order.pick;
      s.progress = Math.min(1, s.progress + dt * speed(s) * 0.0055 / leg);
      s.boostTime = Math.max(0, s.boostTime - dt);
      if (s.progress >= 1) { s.boostTime = 0; phase(s, s.phase === "toShop" ? "shopArrive" : "park"); }
    } else if (s.phase === "dispatch" && s.phaseTime >= s.wait) { s.order = offer(s); phase(s, "offer"); }
    else if (s.phase === "waiting" && s.phaseTime >= s.wait) phase(s, s.order.mixed ? "mismatch" : "pickup");
    else if (s.phase === "parking" && s.phaseTime >= 1.25) phase(s, "entrance");
    else if (s.phase === "climb" && s.phaseTime >= s.wait) phase(s, "door");
  }

  function settle(s, lowScore = false) {
    if (s.phase === "result") return;
    const o = s.order;
    o.fast = !lowScore && !o.wrong && o.age <= o.fastLimit;
    o.score = lowScore ? 2 : o.fixed ? 4 : o.fast ? 5 : 4;
    o.paid = Math.round(o.fare * (lowScore ? 0.65 : o.fixed ? 0.93 : 1) / 10) * 10;
    s.money += o.paid; s.total += o.paid; s.count++; s.stars += o.score;
    if (o.fast) s.quick = Math.min(3, s.quick + 1);
    s.lastResult = {
      regionName: o.regionName, themeId: o.themeId, shop: o.shop, food: o.food, name: o.name,
      pay: o.paid, score: o.score, time: Math.ceil(o.age), fast: o.fast, home: o.home, day: calendar(s).day
    };
    s.history.unshift(s.lastResult); s.history = s.history.slice(0, 40);
    phase(s, "result");
  }

  function act(s, action, arg) {
    const p = s.phase, o = s.order;
    if (action === "next" && (p === "offer" || p === "result")) next(s);
    else if (action === "enter" && p === "shopArrive") { s.wait = s.count && Math.random() < 0.26 ? 4.5 : 1.15; phase(s, "waiting"); }
    else if (action === "exchange" && p === "mismatch") { o.mixed = false; s.wait = 1.7; phase(s, "waiting"); }
    else if (action === "pickup" && (p === "pickup" || p === "mismatch")) phase(s, "loaded");
    else if (action === "depart" && p === "loaded") { s.progress = 0; phase(s, "toHome"); }
    else if (action === "park" && p === "park") phase(s, s.vehicle === "walk" ? "entrance" : "parking");
    else if (action === "climb" && p === "entrance") { s.wait = 1.3 + o.floor * 0.28; phase(s, "climb"); }
    else if (action === "door" && p === "door") { o.chosenFlat = Number(arg); o.wrong = o.chosenFlat !== o.flat; phase(s, "handoff"); }
    else if (action === "deliver" && p === "handoff") { if (o.wrong || o.mixed || (!o.fixed && s.count > 0 && Math.random() < 0.09)) phase(s, "claim"); else settle(s); }
    else if (action === "fix" && p === "claim") { o.fixed = true; if (o.mixed) { o.mixed = false; s.progress = 0; phase(s, "toShop"); } else { o.wrong = false; phase(s, "door"); } }
    else if (action === "compensate" && p === "claim") settle(s, true);
  }

  function buyVehicle(s, id) {
    const v = vehicles.find(v => v.id === id); if (!v) return "";
    if (!["offer", "result", "dispatch"].includes(s.phase)) return "배달을 마친 뒤 탈것을 바꿀 수 있어요.";
    if (!s.owned.includes(id)) { if (s.money < v.cost) return "잔액이 부족해요. 배달로 운임을 모아 보세요."; s.money -= v.cost; s.owned.push(id); }
    s.vehicle = id; return v.name + " 장착 완료!";
  }
  const gearCost = level => 2500 * (level + 1);
  function buyGear(s, key) {
    if (key !== "speedGear") return "";
    const level = s[key]; if (level >= 5) return "최고 단계에 도달했어요.";
    const cost = gearCost(level); if (s.money < cost) return "잔액이 부족해요. 배달로 운임을 모아 보세요.";
    s.money -= cost; s[key]++; return "장비를 강화했어요!";
  }
  function claimMission(s) { if (s.quick < 3 || s.claimed) return false; s.money += 2200; s.claimed = true; return true; }

  window.RiderGame = {
    fresh, load, save, vehicles, vehicle, calendar, rating, start, tap, speed, advance, act, traveling,
    buyVehicle, buyGear, gearCost, claimMission, foods, foodById, shopName,
    themes, theme, presetRegions, cleanRegion, placeFor, setRegion, setTheme
  };
})();
