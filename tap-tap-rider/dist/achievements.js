(() => {
  "use strict";
  const definitions = [
    ["deliver-1", "첫 배달", "배달 1건 완료", "count", 1, 500],
    ["deliver-5", "동네 라이더", "배달 5건 완료", "count", 5, 1000],
    ["deliver-10", "단골의 시작", "배달 10건 완료", "count", 10, 1500],
    ["deliver-25", "골목길 전문가", "배달 25건 완료", "count", 25, 3000],
    ["deliver-50", "배달 베테랑", "배달 50건 완료", "count", 50, 5000],
    ["deliver-100", "백 번의 문 두드림", "배달 100건 완료", "count", 100, 10000],
    ["income-10k", "첫 만 원", "누적 배달 운임 1만 원", "total", 10000, 500],
    ["income-50k", "차곡차곡", "누적 배달 운임 5만 원", "total", 50000, 1500],
    ["income-100k", "십만 원 라이더", "누적 배달 운임 10만 원", "total", 100000, 3000],
    ["income-300k", "동네 큰손", "누적 배달 운임 30만 원", "total", 300000, 5000],
    ["income-1m", "백만 원의 여정", "누적 배달 운임 100만 원", "total", 1000000, 15000],
    ["fast-1", "따끈할 때 도착", "빠른 배달 1회 성공", "fast", 1, 500],
    ["fast-10", "시간을 달리는 라이더", "빠른 배달 10회 성공", "fast", 10, 2000],
    ["fast-50", "번개 배달", "빠른 배달 50회 성공", "fast", 50, 7000],
    ["perfect-1", "첫 별 다섯 개", "별점 5점 배달 1회", "perfect", 1, 500],
    ["perfect-10", "믿고 맡기는 배달", "별점 5점 배달 10회", "perfect", 10, 2000],
    ["perfect-50", "별빛 라이더", "별점 5점 배달 50회", "perfect", 50, 7000],
    ["rain-1", "빗속의 배달", "우천 할증 배달 1회 완료", "rain", 1, 700],
    ["rain-10", "레인 마스터", "우천 할증 배달 10회 완료", "rain", 10, 2500],
    ["peak-1", "피크 타임 출근", "피크 할증 배달 1회 완료", "peak", 1, 500],
    ["peak-10", "불금 해결사", "피크 할증 배달 10회 완료", "peak", 10, 2000],
    ["own-bike", "두 바퀴의 시작", "자전거 구매", "bike", 1, 1000],
    ["own-kickboard", "가볍게 씽씽", "킥보드 구매", "kickboard", 1, 1500],
    ["own-ebike", "전기의 힘", "전기자전거 구매", "ebike", 1, 2000],
    ["own-moto", "엔진 시동", "오토바이 구매", "moto", 1, 3000],
    ["own-sport", "도로의 에이스", "고급 오토바이 구매", "sport", 1, 4000],
    ["own-car", "네 바퀴 배달", "자동차 구매", "car", 1, 5000],
    ["own-rocket", "우주까지 배달", "로켓 구매", "rocket", 1, 10000],
    ["food-10", "동네 맛집 도감", "서로 다른 음식 10종 배달", "foods", 10, 3000],
    ["gear-5", "가벼운 발걸음", "경량 배달 가방 5단계 강화", "speedGear", 5, 5000]
  ].map(([id, title, description, metric, target, reward]) => ({id, title, description, metric, target, reward}));

  function initialize(s) {
    const history = s.history || [];
    const previous = s.stats || {};
    const count = predicate => history.filter(predicate).length;
    const counter = (key, fallback) => Math.max(fallback, Number(previous[key]) || 0);
    const foods = [...new Set([...(Array.isArray(previous.foods) ? previous.foods : []), ...history.map(r => r.food).filter(Boolean)])];
    const prevCounts = previous.foodCounts && typeof previous.foodCounts === "object" && !Array.isArray(previous.foodCounts) ? previous.foodCounts : {};
    const foodCounts = {};
    for (const [k, v] of Object.entries(prevCounts)) {
      const n = Math.floor(Number(v) || 0);
      if (n > 0) foodCounts[k] = n;
    }
    const histCounts = {};
    for (const r of history) if (r.food) histCounts[r.food] = (histCounts[r.food] || 0) + 1;
    for (const [k, n] of Object.entries(histCounts)) foodCounts[k] = Math.max(foodCounts[k] || 0, n);
    for (const f of foods) if (!foodCounts[f]) foodCounts[f] = 1;
    s.stats = {
      fast: counter("fast", Math.max(s.quick || 0, count(r => r.fast))),
      perfect: counter("perfect", count(r => r.score === 5)),
      rain: counter("rain", count(r => r.rain)),
      peak: counter("peak", count(r => r.peak)),
      foods,
      foodCounts,
      bestCombo: counter("bestCombo", Number(s.combo) || 0)
    };
    s.achievements = s.achievements && typeof s.achievements === "object" && !Array.isArray(s.achievements)
      ? s.achievements : {};
    update(s);
  }

  function recordDelivery(s, order) {
    if (order.fast) s.stats.fast++;
    if (order.score === 5) s.stats.perfect++;
    if (order.rain) s.stats.rain++;
    if (order.peak) s.stats.peak++;
    if (!s.stats.foods.includes(order.food)) s.stats.foods.push(order.food);
    s.stats.foodCounts[order.food] = (s.stats.foodCounts[order.food] || 0) + 1;
    if ((s.combo || 0) > (s.stats.bestCombo || 0)) s.stats.bestCombo = s.combo;
  }

  function progress(s, achievement) {
    const key = achievement.metric;
    if (key === "count" || key === "total" || key === "speedGear") return s[key];
    if (key === "foods") return s.stats.foods.length;
    if (["fast", "perfect", "rain", "peak"].includes(key)) return s.stats[key];
    return s.owned.includes(key) ? 1 : 0;
  }

  function update(s) {
    const unlocked = [];
    for (const achievement of definitions) {
      if (!s.achievements[achievement.id] && progress(s, achievement) >= achievement.target) {
        s.achievements[achievement.id] = {unlockedAt: Date.now(), claimed: false};
        unlocked.push(achievement);
      }
    }
    return unlocked;
  }

  function claim(s, id) {
    update(s);
    const achievement = definitions.find(item => item.id === id);
    const completion = s.achievements[id];
    if (!achievement || !completion || completion.claimed) return 0;
    completion.claimed = true;
    s.money += achievement.reward;
    return achievement.reward;
  }

  const available = s => definitions.filter(a => s.achievements[a.id] && !s.achievements[a.id].claimed).length;
  window.RiderAchievements = {definitions, initialize, recordDelivery, progress, update, claim, available};
})();
