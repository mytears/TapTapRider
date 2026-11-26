(() => {
  "use strict";
  const achievements = window.RiderAchievements;
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

  // 4 distinct garage gear upgrades (Lv.0 -> Lv.5)
  const gears = [
    { id: "speedGear", name: "경량 배달 가방", desc: "단계마다 기본 속도 +12%" },
    { id: "tipGear", name: "보온 배달 박스", desc: "단계마다 빠른 배달 팁 +6%" },
    { id: "navGear", name: "스마트 네비게이션", desc: "단계마다 주차·계단 이동 -11%" },
    { id: "cookGear", name: "단골 가게 패스", desc: "단계마다 조리 대기 시간 -11%" }
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

  // Food codex collection milestones
  const codexMilestones = [
    { target: 5, reward: 3000, label: "동네 맛탐험가" },
    { target: 10, reward: 6000, label: "미식 라이더" },
    { target: 15, reward: 10000, label: "동네 맛집 박사" },
    { target: 20, reward: 20000, label: "전 메뉴 정복" }
  ];

  // Rotating daily mission pool (slots 2 & 3, deterministic by day so RNG stays clean)
  const missionPool = [
    { id: "deliver4", title: "오늘 배달 4건", desc: "오늘 배달을 총 4건 완료하세요.", metric: "deliver", target: 4, base: 2000 },
    { id: "perfect3", title: "별점 5점 3회", desc: "별점 5.0으로 배달을 3번 마치세요.", metric: "perfect", target: 3, base: 2400 },
    { id: "variety3", title: "다양한 메뉴 3종", desc: "오늘 서로 다른 음식 3종을 배달하세요.", metric: "variety", target: 3, base: 2300 },
    { id: "dist3", title: "동네 주행 3.0 km", desc: "오늘 배달로 총 3.0 km 이상 이동하세요.", metric: "distance", target: 30, base: 2500 },
    { id: "bonus1", title: "할증 배달 1회", desc: "우천 또는 피크 할증 배달을 1회 완료하세요.", metric: "bonus", target: 1, base: 1800 },
    { id: "combo2", title: "2연속 빠른 배달", desc: "빠른 배달을 2회 연속 성공하세요.", metric: "combo", target: 2, base: 2600 }
  ];
  const vehicleMissionScales = [1, 1.3, 1.6, 2.0, 2.6, 3.3, 4.2, 5.5];

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

  function regularTier(s, foodId) {
    const count = s?.stats?.foodCounts?.[foodId] || 0;
    if (count >= 10) return { level: 2, label: "VIP 단골", count, tipRate: 0.18, cookCut: 0.30 };
    if (count >= 3) return { level: 1, label: "단골", count, tipRate: 0.10, cookCut: 0.20 };
    return { level: 0, label: "", count, tipRate: 0, cookCut: 0 };
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
  const premiumMultiplier = 5;

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

  function missionScale(s) {
    let best = 0;
    for (let i = 0; i < vehicles.length; i++) {
      if (Array.isArray(s.owned) && s.owned.includes(vehicles[i].id)) best = i;
    }
    return vehicleMissionScales[best] || 1;
  }

  function buildDailyMissions(s, day) {
    const scale = missionScale(s);
    const scaled = base => Math.round(base * scale / 100) * 100;
    const i1 = ((day - 1) * 2) % missionPool.length;
    const i2 = (i1 + 1 + ((day - 1) % (missionPool.length - 1))) % missionPool.length;
    const pick = def => ({
      id: def.id, title: def.title, desc: def.desc, metric: def.metric,
      target: def.target, progress: 0, reward: scaled(def.base), claimed: false
    });
    return [
      { id: "fast3", title: "빠른 배달 3회", desc: "콜별 목표 시간 안에 정확한 주소로 음식을 3번 전달하세요.", metric: "fast", target: 3, progress: 0, reward: scaled(2200), claimed: false },
      pick(missionPool[i1]),
      pick(missionPool[i2])
    ];
  }

  function ensureDailyMissions(s) {
    const day = calendar(s).day;
    if (!Array.isArray(s.dailyMissions) || s.dailyMissions.length !== 3 || s.dailyDay !== day) {
      s.dailyDay = day;
      s.dailyMissions = buildDailyMissions(s, day);
      s.dailyMissions[0].progress = Math.min(3, Math.max(0, Number(s.quick) || 0));
      s.dailyMissions[0].claimed = !!s.claimed;
      if (!Array.isArray(s.dailyFoods)) s.dailyFoods = [];
    }
    if (!Array.isArray(s.dailyFoods)) s.dailyFoods = [];
    if (!Array.isArray(s.codexClaimed)) s.codexClaimed = [];
  }

  function recordDailyMissionProgress(s, o) {
    ensureDailyMissions(s);
    if (!s.dailyFoods.includes(o.food)) s.dailyFoods.push(o.food);
    const distTenths = Math.max(1, Math.round(o.dist * 10));
    for (const m of s.dailyMissions) {
      if (m.metric === "fast" && o.fast) m.progress = Math.min(m.target, m.progress + 1);
      else if (m.metric === "deliver") m.progress = Math.min(m.target, m.progress + 1);
      else if (m.metric === "perfect" && o.score === 5) m.progress = Math.min(m.target, m.progress + 1);
      else if (m.metric === "variety") m.progress = Math.min(m.target, s.dailyFoods.length);
      else if (m.metric === "distance") m.progress = Math.min(m.target, m.progress + distTenths);
      else if (m.metric === "bonus" && (o.rain || o.peak)) m.progress = Math.min(m.target, m.progress + 1);
      else if (m.metric === "combo") m.progress = Math.min(m.target, Math.max(m.progress, s.combo || 0));
    }
    s.quick = s.dailyMissions[0].progress;
  }

  function pickDifferentFood(foodId) {
    const others = foods.filter(f => f[0] !== foodId);
    return others[roll(others.length)][0];
  }

  function premiumOffer(s, first) {
    if (first || s.count <= 0) return false;
    if (!Number.isInteger(s.premiumCallsRemaining) || s.premiumCallsRemaining < 1 || s.premiumCallsRemaining > 10) {
      s.premiumCallsRemaining = 5 + roll(6);
    }
    if (--s.premiumCallsRemaining > 0) return false;
    // Count generated calls, including skipped calls, and save the next interval.
    s.premiumCallsRemaining = 5 + roll(6);
    return true;
  }

  function offer(s, first = false) {
    const [food, name] = foods[first ? 0 : roll(foods.length)];
    const dist = first ? 0.8 : (5 + roll(22)) / 10;
    const pick = first ? 0.20 : Math.min(0.55, dist * (0.2 + Math.random() * 0.18));
    const peak = calendar(s).peak, rain = s.rain, rate = rating(s);
    const base = Math.round((1760 + dist * 1380) / 100) * 100;
    const regularFare = Math.round(base * (peak ? 1.1 : 1) * (rain ? 1.25 : 1) * (0.85 + rate * 0.03) / 100) * 100;
    const premium = premiumOffer(s, first);
    const fare = premium ? regularFare * premiumMultiplier : regularFare;
    const floor = first ? 4 : 2 + roll(7), room = first ? 2 : 1 + roll(3);
    const place = placeFor(s.regionName, s.themeId);
    return locateOrder({
      id: ++s.serial, food, name, wrongFood: pickDifferentFood(food),
      homeIndex: first ? 0 : roll(place.homes.length),
      flat: floor * 100 + room, floor, dist, pick, fare, regularFare, premium, adUnlocked: false, base, peak, rain, rate,
      wrong: false, mixed: false, start: 0, age: 0, fastLimit: Math.ceil(22 + dist * 47),
      score: 0, paid: 0, fast: false, fixed: false, bonusRate: 0, combo: 0, regularLevel: 0
    }, place);
  }

  function fresh() {
    const s = {
      version: 1, regionName: "성수", themeId: "workshop",
      money: 0, count: 0, stars: 0, total: 0, gender: null,
      owned: ["walk"], vehicle: "walk", speedGear: 0, tipGear: 0, navGear: 0, cookGear: 0,
      music: true, sfx: true, haptics: true, muted: false, minutes: initialMinute,
      rain: false, weatherBlock: Math.floor(initialMinute / 75), serial: 0,
      phase: "offer", order: null, phaseTime: 0, progress: 0,
      boostTime: 0, fever: 0, combo: 0, quick: 0, claimed: false,
      dailyDay: 1, dailyMissions: null, dailyFoods: [], codexClaimed: [],
      history: [], lastResult: null, wait: 0, stats: null, achievements: null,
      premiumCallsRemaining: null
    };
    s.order = offer(s, true);
    achievements.initialize(s);
    ensureDailyMissions(s);
    return s;
  }

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE));
      if (saved?.version === 1 && saved.order?.food && Array.isArray(saved.owned) && Number.isFinite(saved.money) && Array.isArray(saved.history)) {
        const state = Object.assign(fresh(), saved);
        if (state.phase !== "result" && state.order.premium && Number.isFinite(state.order.regularFare)) {
          state.order.fare = state.order.regularFare * premiumMultiplier;
        }
        // Refund retired recovery equipment once, then remove its saved level.
        const coolingLevel = Math.max(0, Math.min(5, Math.floor(Number(state.coolGear) || 0)));
        state.money += 2500 * coolingLevel * (coolingLevel + 1) / 2;
        for (const key of ["coolGear", "fatigue", "lock", "lockMax", "sinceTap"]) delete state[key];
        for (const g of gears) state[g.id] = Math.max(0, Math.min(5, Math.floor(Number(state[g.id]) || 0)));
        state.combo = Math.max(0, Math.floor(Number(state.combo) || 0));
        state.fever = Math.max(0, Math.min(100, Number(state.fever) || 0));
        if (typeof state.haptics !== "boolean") state.haptics = true;
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
        achievements.initialize(state);
        ensureDailyMissions(state);
        return state;
      }
    } catch {}
    return fresh();
  }

  function save(s) { try { localStorage.setItem(STORE, JSON.stringify(s)); return true; } catch { return false; } }
  function reset(preservePrefs = true, prev = null) {
    const nextState = fresh();
    if (preservePrefs && prev) {
      nextState.regionName = cleanRegion(prev.regionName);
      nextState.themeId = theme(prev.themeId).id;
      nextState.music = !!prev.music;
      nextState.sfx = !!prev.sfx;
      nextState.haptics = prev.haptics !== false;
      nextState.muted = !!prev.muted;
      locateOrder(nextState.order, placeFor(nextState.regionName, nextState.themeId));
    }
    save(nextState);
    return nextState;
  }
  function phase(s, name) { s.phase = name; s.phaseTime = 0; }
  function traveling(s) { return s.phase === "toShop" || s.phase === "toHome"; }

  function start(s) {
    if (s.phase !== "offer" || !s.gender || (s.order.premium && !s.order.adUnlocked)) return false;
    s.order.start = s.minutes; s.order.age = 0;
    s.order.mixed = s.count > 0 && Math.random() < 0.16;
    if (s.order.mixed) s.order.wrongFood = pickDifferentFood(s.order.food);
    s.progress = 0; s.boostTime = 0; s.fever = 0; phase(s, "toShop");
    return true;
  }
  function unlockPremium(s, orderId) {
    if (s.phase !== "offer" || s.order.id !== orderId || !s.order.premium || s.order.adUnlocked) return false;
    s.order.adUnlocked = true;
    return true;
  }
  function useRegularFare(s, orderId) {
    if (s.phase !== "offer" || s.order.id !== orderId || !s.order.premium || s.order.adUnlocked) return false;
    s.order.fare = s.order.regularFare;
    s.order.premium = false;
    return true;
  }
  function next(s) { s.wait = calendar(s).peak ? 1.5 : 5; phase(s, "dispatch"); }
  function boostTier(s) {
    if (!traveling(s) || s.boostTime <= 0) return 0;
    if ((s.fever || 0) >= 80) return 3;
    if ((s.fever || 0) >= 40) return 2;
    return 1;
  }
  function tap(s) {
    if (!traveling(s)) return false;
    s.boostTime = Math.min(1.6, s.boostTime + 0.56);
    s.fever = Math.min(100, (s.fever || 0) + 14);
    return "boost";
  }
  function speed(s) {
    if (!traveling(s)) return 0;
    const tier = boostTier(s);
    const boostMult = tier === 3 ? 2.5 : tier === 2 ? 2.25 : tier === 1 ? 2.05 : 1;
    return vehicle(s).speed * (1 + 0.12 * s.speedGear) * boostMult;
  }

  function advance(s, dt) {
    const oldDay = calendar(s).day;
    if (s.gender || s.count || s.phase !== "offer") s.minutes += dt * 1.2;
    const newDay = calendar(s).day;
    if (newDay !== oldDay) {
      if (Array.isArray(s.dailyMissions)) {
        for (const m of s.dailyMissions) {
          if (m.progress >= m.target && !m.claimed) {
            s.money += m.reward;
            m.claimed = true;
          }
        }
      }
      s.quick = 0; s.claimed = false; s.dailyFoods = [];
      s.dailyDay = newDay;
      s.dailyMissions = buildDailyMissions(s, newDay);
    }
    const block = Math.floor(s.minutes / 75);
    if (block !== s.weatherBlock) { s.weatherBlock = block; s.rain = Math.random() < 0.33; }
    s.phaseTime += dt;
    if (s.phase !== "offer" && s.phase !== "dispatch" && s.phase !== "result") s.order.age += dt;
    if (traveling(s)) {
      const leg = s.phase === "toShop" ? s.order.pick : s.order.dist - s.order.pick;
      s.progress = Math.min(1, s.progress + dt * speed(s) * 0.0055 / leg);
      s.boostTime = Math.max(0, s.boostTime - dt);
      const decayRate = s.boostTime < 1.15 ? 28 : 6;
      s.fever = Math.max(0, (s.fever || 0) - dt * decayRate);
      if (s.progress >= 1) { s.boostTime = 0; s.fever = 0; phase(s, s.phase === "toShop" ? "shopArrive" : "park"); }
    } else {
      s.fever = 0;
      if (s.phase === "dispatch" && s.phaseTime >= s.wait) { s.order = offer(s); phase(s, "offer"); }
      else if (s.phase === "waiting" && s.phaseTime >= s.wait) phase(s, s.order.mixed ? "mismatch" : "pickup");
      else if (s.phase === "parking" && s.phaseTime >= s.wait) phase(s, "entrance");
      else if (s.phase === "climb" && s.phaseTime >= s.wait) phase(s, "door");
    }
  }

  function settle(s, lowScore = false) {
    if (s.phase === "result") return;
    const o = s.order;
    const regular = regularTier(s, o.food);
    o.fast = !lowScore && !o.wrong && o.age <= o.fastLimit;
    o.score = lowScore ? 2 : o.fixed ? 4 : o.fast ? 5 : 4;
    if (o.fast) s.combo = (s.combo || 0) + 1;
    else s.combo = 0;
    const comboRate = o.fast && s.combo >= 2 ? Math.min(0.25, (s.combo - 1) * 0.05) : 0;
    const tipRate = o.fast ? (s.tipGear || 0) * 0.06 : 0;
    const regularRate = !lowScore ? regular.tipRate : 0;
    const bonusMult = 1 + comboRate + tipRate + regularRate;
    o.combo = s.combo;
    o.regularLevel = regular.level;
    o.bonusRate = Math.round((bonusMult - 1) * 100);
    o.paid = Math.round(o.fare * (lowScore ? 0.65 : o.fixed ? 0.93 : 1) * bonusMult / 10) * 10;
    s.money += o.paid; s.total += o.paid; s.count++; s.stars += o.score;
    s.lastResult = {
      regionName: o.regionName, themeId: o.themeId, shop: o.shop, food: o.food, name: o.name,
      pay: o.paid, score: o.score, time: Math.ceil(o.age), fast: o.fast, home: o.home, day: calendar(s).day,
      rain: o.rain, peak: o.peak, premium: !!o.premium, vehicle: s.vehicle, combo: o.combo, bonusRate: o.bonusRate
    };
    s.history.unshift(s.lastResult); s.history = s.history.slice(0, 40);
    recordDailyMissionProgress(s, o);
    achievements.recordDelivery(s, o);
    achievements.update(s);
    phase(s, "result");
  }

  function act(s, action, arg) {
    const p = s.phase, o = s.order;
    const cookMult = Math.max(0.35, (1 - (s.cookGear || 0) * 0.11) * (1 - regularTier(s, o.food).cookCut));
    const navMult = Math.max(0.42, 1 - (s.navGear || 0) * 0.11);
    if (action === "next" && (p === "offer" || p === "result")) next(s);
    else if (action === "enter" && p === "shopArrive") { s.wait = (s.count && Math.random() < 0.26 ? 4.5 : 1.15) * cookMult; phase(s, "waiting"); }
    else if (action === "exchange" && p === "mismatch") { o.mixed = false; s.wait = 1.7 * cookMult; phase(s, "waiting"); }
    else if (action === "pickup" && (p === "pickup" || p === "mismatch")) phase(s, "loaded");
    else if (action === "depart" && p === "loaded") { s.progress = 0; s.fever = 0; phase(s, "toHome"); }
    else if (action === "park" && p === "park") {
      if (s.vehicle === "walk") phase(s, "entrance");
      else { s.wait = 1.25 * navMult; phase(s, "parking"); }
    }
    else if (action === "climb" && p === "entrance") { s.wait = (1.3 + o.floor * 0.28) * navMult; phase(s, "climb"); }
    else if (action === "door" && p === "door") { o.chosenFlat = Number(arg); o.wrong = o.chosenFlat !== o.flat; phase(s, "handoff"); }
    else if (action === "deliver" && p === "handoff") { if (o.wrong || o.mixed || (!o.fixed && s.count > 0 && Math.random() < 0.09)) phase(s, "claim"); else settle(s); }
    else if (action === "fix" && p === "claim") { o.fixed = true; if (o.mixed) { o.mixed = false; s.progress = 0; phase(s, "toShop"); } else { o.wrong = false; phase(s, "door"); } }
    else if (action === "compensate" && p === "claim") settle(s, true);
  }

  function buyVehicle(s, id) {
    const v = vehicles.find(v => v.id === id); if (!v) return "";
    if (!["offer", "result", "dispatch"].includes(s.phase)) return "배달을 마친 뒤 탈것을 바꿀 수 있어요.";
    if (!s.owned.includes(id)) { if (s.money < v.cost) return "잔액이 부족해요. 배달로 운임을 모아 보세요."; s.money -= v.cost; s.owned.push(id); }
    s.vehicle = id; achievements.update(s); return v.name + " 장착 완료!";
  }
  const gearCost = level => 2500 * (level + 1);
  function buyGear(s, key) {
    if (!gears.some(g => g.id === key)) return "";
    const level = s[key] || 0; if (level >= 5) return "최고 단계에 도달했어요.";
    const cost = gearCost(level); if (s.money < cost) return "잔액이 부족해요. 배달로 운임을 모아 보세요.";
    s.money -= cost; s[key] = level + 1; achievements.update(s); return "장비를 강화했어요!";
  }

  function claimMission(s, id) {
    ensureDailyMissions(s);
    const target = id
      ? s.dailyMissions.find(m => m.id === id)
      : s.dailyMissions.find(m => m.progress >= m.target && !m.claimed);
    if (!target || target.progress < target.target || target.claimed) return 0;
    s.money += target.reward;
    target.claimed = true;
    if (target.id === "fast3") s.claimed = true;
    achievements.update(s);
    return target.reward;
  }

  function missionsAvailable(s) {
    ensureDailyMissions(s);
    return s.dailyMissions.filter(m => m.progress >= m.target && !m.claimed).length;
  }

  function claimCodex(s, target) {
    ensureDailyMissions(s);
    const milestone = codexMilestones.find(m => m.target === Number(target));
    const discovered = s.stats?.foods?.length || 0;
    if (!milestone || discovered < milestone.target || s.codexClaimed.includes(milestone.target)) return 0;
    s.codexClaimed.push(milestone.target);
    s.money += milestone.reward;
    achievements.update(s);
    return milestone.reward;
  }

  function codexAvailable(s) {
    ensureDailyMissions(s);
    const discovered = s.stats?.foods?.length || 0;
    return codexMilestones.filter(m => discovered >= m.target && !s.codexClaimed.includes(m.target)).length;
  }

  window.RiderGame = {
    fresh, load, save, reset, vehicles, vehicle, gears, calendar, rating, start, unlockPremium, useRegularFare, premiumMultiplier,
    tap, boostTier, speed, advance, act, traveling, buyVehicle, buyGear, gearCost,
    claimMission, missionsAvailable, ensureDailyMissions, codexMilestones, claimCodex, codexAvailable, regularTier,
    foods, foodById, shopName, themes, theme, presetRegions, cleanRegion, placeFor, setRegion, setTheme
  };
})();
