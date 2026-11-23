(() => {
  "use strict";
  const G = window.RiderGame, V = window.GameVisuals, A = window.RiderArt, S = window.RiderSound;
  const $ = id => document.getElementById(id), I = V.icon;
  const s = G.load(), dialog = $("dialog"), world = $("world"), panel = $("order-panel"), hero = $("hero");
  const strip = window.RiderStreet.createStrip($("street-strip"));
  const currentPlace = () => G.placeFor(
    s.phase === "result" ? (s.order.regionName || s.regionName) : s.regionName,
    s.phase === "result" ? (s.order.themeId || s.themeId) : s.themeId
  );
  const esc = str => String(str || "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const won = n => "₩" + Math.round(n).toLocaleString("ko-KR");
  const distance = n => n >= 1 ? n.toFixed(1) + " km" : Math.max(0, Math.round(n * 1000)) + " m";
  const button = (action, label, cls = "main-btn", value = "", disabled = false) =>
    '<button type="button" class="' + cls + '" data-action="' + action + '" data-value="' + esc(value) + '"' + (disabled ? " disabled" : "") + ">" + label + "</button>";
  const scenes = {
    offer: ["street", "", ""], dispatch: ["street", "", ""],
    toShop: ["street", "가게로 이동 중", "ROUTE · PICKUP"], shopArrive: ["street", "가게 앞 도착", "STOP · RESTAURANT"],
    waiting: ["shop", "조리 대기", "SHOP · KITCHEN"], mismatch: ["shop", "주문 확인", "SHOP · COUNTER"], pickup: ["shop", "픽업 카운터", "SHOP · COUNTER"], loaded: ["shop", "픽업 완료", "SHOP · COUNTER"],
    toHome: ["street", "목적지로 이동 중", "ROUTE · DELIVERY"], park: ["parking", "목적지 도착", "STOP · PARKING"], parking: ["parking", "주차 중", "STOP · PARKING"], entrance: ["parking", "건물 입구", "APT · ENTRANCE"],
    climb: ["hall", "계단 오르는 중", "APT · STAIRWAY"], door: ["hall", "배달 층 복도", "APT · HALLWAY"], handoff: ["hall", "음식 전달", "APT · DOOR"],
    claim: ["hall", "고객센터 연결", "CALL · SUPPORT"], result: ["hall", "배달 완료", "DELIVERY · COMPLETE"]
  };
  let modal = "", garageTab = "rides", choice = s.gender || "male", choiceContext = "", noteTimer = 0, lastScene = "", lastFrame = 0, tick = 0, displayTick = 0, saveTick = 0, anim = 0;
  let lastOrderId = -1, doorChoices = [], terrain = { w: 1, h: 1, riderWidth: 1 }, modalMessage = "";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function note(msg) { $("scene-note").textContent = msg; $("scene-note").classList.add("on"); clearTimeout(noteTimer); noteTimer = setTimeout(() => $("scene-note").classList.remove("on"), 2000); }
  function persist() { G.save(s); }
  function snapshot() {
    terrain = { w: world.clientWidth, h: world.clientHeight, riderWidth: hero.getBoundingClientRect().width };
    $("particles").width = Math.max(1, Math.round(terrain.w / 2)); $("particles").height = Math.max(1, Math.round(terrain.h / 2));
  }
  function visualMapProgress() {
    const stop = 88 / 190, p = s.phase;
    if (["offer", "dispatch"].includes(p)) return 0;
    if (p === "toShop") return stop * s.progress;
    if (["shopArrive", "waiting", "mismatch", "pickup", "loaded"].includes(p)) return stop;
    if (p === "toHome") return stop + (1 - stop) * s.progress;
    return 1;
  }
  function renderPreviewTags(regionRaw) {
    const base = G.cleanRegion(regionRaw);
    const samples = ["버거", "피자", "치킨", "스시", "라멘", "카페"];
    return samples.map(suf => "<span>" + esc(base + suf) + "</span>").join("");
  }
  function renderOrder() {
    const p = s.phase, o = s.order;
    const wrongFoodInfo = G.foodById(o.wrongFood && o.wrongFood !== o.food ? o.wrongFood : (G.foods.find(f => f[0] !== o.food)?.[0] || "pizza"));
    const fareTag = p === "offer" && (o.rain || o.peak) ? '<em class="fare-tag">' + (o.rain ? "우천 할증" : "피크 할증") + "</em>" : "";
    const head = (label, icon = "radio") => '<div class="panel-heading"><span>' + I(icon) + label + fareTag + "</span><small>" + (G.traveling(s) ? '<span id="goal-timer"></span>' : "CALL #" + String(o.id).padStart(3, "0")) + "</small></div>";
    const food = '<div class="item-art"><canvas id="food" aria-label="' + esc(o.name) + '"></canvas></div>';
    const detail = (title, desc) => '<div class="offer-detail">' + food + '<div class="offer-text"><h2>' + title + "</h2><p>" + desc + "</p></div></div>";
    const pay = (n = o.fare) => '<span class="offer-pay">' + I("coin") + won(n) + "<small>" + o.dist.toFixed(1) + " km</small></span>";
    const actions = (left, right) => '<div class="offer-actions">' + left + '<div class="actions-right">' + right + "</div></div>";
    const step = (heading, title, desc, action, label, icon = "bag", extra = "") => head(heading, icon) + detail(title, desc) + actions('<span class="route-stat">' + (extra || "") + "</span>", action ? button(action, label) : "");
    let html = "";
    if (p === "offer") html = head("신규 배달 콜") + detail(esc(o.name), esc(o.shop) + I("arrow") + esc(o.home)) + actions(pay(), '<button class="refresh-btn" data-action="next" title="다른 콜 찾기" aria-label="다른 콜 찾기">' + I("refresh") + "</button>" + button("accept", I("check") + "콜 수락"));
    else if (p === "dispatch") html = step("배차 대기", "다음 콜 찾는 중…", G.calendar(s).peak ? "콜이 많은 피크 시간이에요." : esc(currentPlace().name) + " 근처 가게에서 새 콜을 찾고 있어요.", "", "", "radio");
    else if (G.traveling(s)) {
      const pickup = p === "toShop";
      html = head(pickup ? "가게로 이동" : "배달 운행 중", pickup ? "store" : "pin") + detail(esc(pickup ? o.shop : o.home + " " + o.flat + "호"), esc(pickup ? o.name + " 픽업" : o.name + " 전달")) +
        '<div class="offer-actions"><span class="route-stat" id="route-dist"></span><div class="route-line"><i id="route-fill"></i></div><span class="service-text" id="route-pct"></span></div>';
    } else if (p === "shopArrive") html = step("가게 도착", esc(o.shop), esc(o.name) + " 주문을 찾으세요.", "enter", "가게 들어가기", "store");
    else if (p === "waiting") html = step("조리 중", s.wait > 3 ? "음식이 조금 늦어져요" : "포장하고 있어요", esc(o.shop) + " · " + esc(o.name), "", "", "timer", '<span id="wait-time"></span>');
    else if (p === "pickup") html = step("음식 준비 완료", esc(o.name), "주문 내역과 포장된 음식이 일치해요.", "pickup", "음식 받기", "bag");
    else if (p === "mismatch") html = head("픽업 확인", "bag") + detail("다른 음식이 나왔어요", "주문은 " + esc(o.name) + ", 받은 음식은 " + esc(wrongFoodInfo[1]) + "예요.") + actions("", button("pickup", "그대로 받기", "sub-btn") + button("exchange", "교환 요청"));
    else if (p === "loaded") html = step("픽업 완료", esc(o.home) + " " + o.flat + "호", esc(o.name) + " 포장을 받았어요.", "depart", "배달 출발", "bag", distance(o.dist - o.pick));
    else if (p === "park") html = step("목적지 도착", esc(o.home), "건물 입구에서 " + o.flat + "호를 찾아가세요.", "park", s.vehicle === "walk" ? "입구로 이동" : "주차하기", "pin");
    else if (p === "parking") html = step("주차 중", esc(o.home) + " 주차장", G.vehicle(s).name + " 주차 구역으로 이동 중이에요.", "", "", "garage");
    else if (p === "entrance") html = step(s.vehicle === "walk" ? "건물 입구" : "주차 완료", esc(o.home) + " " + o.floor + "층", o.flat + "호 고객에게 음식을 전달하세요.", "climb", "건물 올라가기", "steps");
    else if (p === "climb") html = step("계단 이동", "배달 층으로 올라가는 중", esc(o.home) + " · " + o.flat + "호", "", "", "steps", '<span id="floor-count"></span>');
    else if (p === "door") {
      if (lastOrderId !== o.id) { const other = o.floor * 100 + (o.flat % 100 === 3 ? 1 : o.flat % 100 + 1); doorChoices = o.id % 2 ? [other, o.flat] : [o.flat, other]; lastOrderId = o.id; }
      html = head("배달지 확인", "home") + detail("어느 집으로 갈까요?", esc(o.home) + " · 주문 주소 " + o.flat + "호") +
        actions('<span class="route-stat">' + o.floor + "층</span>", doorChoices.map(n => button("door", n + "호", "sub-btn", n)).join(""));
    } else if (p === "handoff") html = step("문 앞 전달", esc(o.name), esc(o.home) + " " + (o.chosenFlat || o.flat) + "호 문 앞에 도착했어요.", "deliver", "음식 전달하기", "box");
    else if (p === "claim") html = head("고객센터 전화", "phone") + detail("배달 확인 요청", o.mixed ? "고객이 다른 음식을 받았어요." : o.wrong ? "고객이 음식을 찾을 수 없어요." : "고객이 전달 위치 확인을 요청했어요.") +
      actions("", button("compensate", "감액 정산", "sub-btn") + button("fix", o.mixed ? "가게 재방문" : "배달지 확인"));
    else if (p === "result") html = head("배달 완료", "check") + detail(o.fast ? "빠른 배달 성공!" : "배달 정산", esc(o.name) + " · 평점 " + o.score.toFixed(1) + " ★ · " + Math.ceil(o.age) + "초") + actions(pay(o.paid), button("next", "다음 콜 받기"));
    panel.innerHTML = html;
    if ($("food")) A.drawFood($("food"), p === "mismatch" ? wrongFoodInfo[0] : o.food);
  }
  function updateShopWallSign(scene, o) {
    const wall = $("shop-wall-sign");
    if (scene !== "shop") { wall.hidden = true; return; }
    wall.hidden = false;
    const { w: screenW, h: screenH } = terrain;
    const imgW = Math.max(screenW, screenH * 3);
    const imgH = imgW / 3;
    const imgLeft = (screenW - imgW) / 2;
    const imgTop = screenH - imgH;
    wall.style.left = (imgLeft + imgW * 0.341) + "px";
    wall.style.top = (imgTop + imgH * 0.200) + "px";
    wall.style.width = (imgW * 0.104) + "px";
    wall.style.height = (imgH * 0.215) + "px";
    const nameEl = $("shop-wall-name");
    nameEl.textContent = o.shop;
    const len = Math.max(4, o.shop.length);
    nameEl.style.fontSize = Math.max(10, Math.min(imgH * 0.044, (imgW * 0.095) / (len * 0.85))) + "px";
    if (wall.dataset.food !== o.food) {
      A.drawFoodEmblem($("shop-wall-emblem"), o.food);
      wall.dataset.food = o.food;
    }
  }
  function swapScene(animate = true) {
    const p = s.phase, o = s.order, [asset, loc, code] = scenes[p] || scenes.offer;
    const place = currentPlace(), streetScene = asset === "street";
    $("street-strip").hidden = !streetScene;
    if (streetScene) strip.show(place, o);
    $("view").style.backgroundImage = streetScene ? "none" : 'url("assets/' + asset + '.webp?v=4")';
    world.setAttribute("aria-label", place.name + " 배달 게임 화면");
    $("loc-name").textContent = loc || place.street;
    $("loc-code").textContent = code ? place.name + " · " + code.split(" · ").at(-1) : "DELIVERY ZONE · " + place.name;
    $("place-marker").hidden = !["offer", "toShop", "shopArrive", "toHome", "park", "entrance", "door", "handoff"].includes(p);
    $("marker-text").textContent = ({ toHome: "배달지", park: "입구", entrance: "입구", door: o.flat + "호", handoff: "전달" })[p] || (o.shop + " 픽업");
    const markerIcon = $("place-marker").querySelector("i"); markerIcon.innerHTML = I(["offer", "toShop", "shopArrive"].includes(p) ? "store" : "pin");
    updateShopWallSign(asset, o);
    if (animate && lastScene !== p) { const w = $("wipe"); w.classList.remove("go"); void w.offsetWidth; w.classList.add("go"); }
    if (animate && lastScene !== p) {
      const sound = ({ result: "complete", claim: "phone", loaded: "pickup", park: "arrive", shopArrive: "arrive", offer: "accept" })[p];
      if (sound) S.effect(sound);
      const msg = ({ shopArrive: o.shop + "에 도착했어요!", toHome: "배달 출발!", park: "목적지 도착!", result: "배달 완료  +" + won(o.paid), claim: "고객센터에서 전화가 왔어요" })[p];
      if (msg) note(msg);
    }
    lastScene = p; renderOrder(); status(); paint(anim); persist();
  }
  function status() {
    const time = G.calendar(s), o = s.order, p = s.phase, travel = G.traveling(s);
    $("day").textContent = "DAY " + String(time.day).padStart(2, "0"); $("clock").textContent = time.week + " " + time.clock;
    const weather = s.rain ? "rain" : time.night ? "moon" : "sun";
    if ($("weather").dataset.kind !== weather) { $("weather").dataset.kind = weather; $("weather").innerHTML = I(weather) + (s.rain ? "비" : time.night ? "밤" : "맑음"); }
    world.classList.toggle("rain", s.rain && scenes[p][0] === "street"); world.classList.toggle("night", time.night && scenes[p][0] === "street");
    $("wallet").textContent = won(s.money); $("rating").textContent = G.rating(s).toFixed(1); $("ride-type").textContent = G.vehicle(s).name;
    const h = Math.round(s.fatigue); $("fatigue-value").innerHTML = h + "<span>%</span>"; $("fatigue-gauge").setAttribute("aria-valuenow", h);
    $("heat-fill").style.width = h + "%"; $("heat-fill").style.background = h > 75 ? "#f69a70" : h > 45 ? "#e7c775" : "var(--mint)";
    $("speed").textContent = G.speed(s).toFixed(1);
    $("boost").classList.toggle("ready", travel && !s.lock); $("boost").classList.toggle("exhausted", s.lock > 0); $("boost").setAttribute("aria-disabled", String(!travel || s.lock > 0));
    $("boost-hint").innerHTML = s.lock ? "회복까지 " + Math.ceil(s.lock) + "초" : "<kbd>SPACE</kbd> 또는 탭";
    $("quick-count").textContent = s.quick + "/3"; $("claim-dot").hidden = s.quick < 3 || s.claimed;
    if ($("route-dist")) { $("route-dist").textContent = distance((1 - s.progress) * (p === "toShop" ? o.pick : o.dist - o.pick)) + " 남음"; $("route-fill").style.width = s.progress * 100 + "%"; $("route-pct").textContent = Math.floor(s.progress * 100) + "%"; }
    if ($("goal-timer")) $("goal-timer").textContent = "목표 " + Math.ceil(o.age) + " / " + o.fastLimit + "초";
    if ($("wait-time")) $("wait-time").textContent = Math.max(0, Math.ceil(s.wait - s.phaseTime)) + "초";
    if ($("floor-count")) $("floor-count").textContent = Math.min(o.floor, 1 + Math.floor(s.phaseTime / s.wait * o.floor)) + "층 / " + o.floor + "층";
    V.drawMap($("map"), visualMapProgress()); if (modal === "map") V.drawMap($("large-map"), visualMapProgress());
    $("mute").innerHTML = I(s.muted ? "muted" : "volume"); $("mute").setAttribute("aria-pressed", String(!s.muted));
  }
  function paint(t) {
    const p = s.phase, o = s.order, moving = G.traveling(s), scene = scenes[p][0], outside = scene === "street";
    const { w: screenW, h: screenH } = terrain, imgW = Math.max(screenW, screenH * 3);
    const route = outside ? window.RiderStreet.project(currentPlace(), o, p, s.progress, terrain) : null;
    if (route) strip.position(route);
    if (scene === "shop") updateShopWallSign(scene, o);
    const interiorX = p === "climb" ? 42 + Math.min(1, s.phaseTime / s.wait) * 22 : p === "door" || p === "handoff" ? 72 : p === "parking" ? 49 + Math.min(1, s.phaseTime / 1.25) * 16 : p === "entrance" ? 65 : 49;
    $("player").style.left = route ? route.feetX + "px" : interiorX + "%";
    world.classList.toggle("player-left", route ? route.feetX < screenW * 0.5 : interiorX < 50);
    $("player").classList.toggle("dash", moving && s.boostTime > 0);
    $("player").style.bottom = p === "climb" ? (5.3 + 5 * Math.min(1, s.phaseTime / s.wait)) + "%" : "5.3%";
    const riding = moving || ["offer", "dispatch", "park", "parking", "shopArrive"].includes(p);
    $("player").dataset.vehicle = riding ? s.vehicle : "walk";
    const stride = route?.stride ?? (p === "climb" ? Math.min(1, s.phaseTime / s.wait) * screenW * 0.22 * 180 / terrain.riderWidth : undefined);
    A.drawRider(hero, { gender: s.gender || "male", vehicle: riding ? s.vehicle : "walk", moving: moving || p === "climb" || p === "parking", boost: moving && s.boostTime > 0, time: reduce ? 0 : t, stride: reduce ? 0 : stride });
    if (!$("place-marker").hidden) {
      const x = route ? route.markerX : (scene === "hall" ? 0.81 : 0.74) * imgW + (screenW - imgW) / 2;
      $("place-marker").style.left = x + "px"; $("place-marker").style.bottom = (scene === "hall" ? 36 : 34) + "%";
    }
    const c = $("particles"), cx = c.getContext("2d"), w = c.width, h = c.height; cx.clearRect(0, 0, w, h);
    if (reduce || !outside) return;
    if (s.rain) { cx.strokeStyle = "#d5eafa99"; cx.lineWidth = 1; cx.beginPath(); for (let i = 0; i < 66; i++) { const x = (i * 137.3 + w * 2 - t * 0.048 % w) % w, y = (i * 49.7 + t * 0.21) % h; cx.moveTo(x, y); cx.lineTo(x - 3, y + 7); } cx.stroke(); }
    else { for (let i = 0; i < 12; i++) { const x = (i * 79.8 + t * 0.006) % w, y = h * (0.15 + (i % 6) * 0.115) + Math.sin(t * 0.0007 + i) * 4; cx.fillStyle = i % 2 ? "#ffdc9777" : "#ffe4a460"; cx.beginPath(); cx.ellipse(x, y, 1.3, 0.75, Math.sin(t * 0.0008 + i), 0, Math.PI * 2); cx.fill(); } }
  }
  function frame(time) {
    const dt = Math.min(0.12, Math.max(0, (time - lastFrame) / 1000)); lastFrame = time;
    if (!document.hidden && !modal) {
      const before = s.phase; G.advance(s, dt); anim += dt * 1000; tick += dt; displayTick += dt; saveTick += dt;
      if (before !== s.phase) swapScene();
      if (tick >= 1 / 30) { paint(anim); tick = 0; }
      if (displayTick > 0.12) { status(); displayTick = 0; }
      if (saveTick > 2) { persist(); saveTick = 0; }
    }
    requestAnimationFrame(frame);
  }
  function closeModal() { if (dialog.open) dialog.close(); modal = ""; modalMessage = ""; markNav(); }
  function markNav() { document.querySelectorAll(".nav-items button").forEach(b => b.classList.toggle("active", b.dataset.action === (["garage", "missions", "history"].includes(modal) ? modal : "home"))); }
  function openModal(name) { modal = name; modalMessage = ""; drawModal(); if (!dialog.open) dialog.showModal(); dialog.scrollTop = 0; markNav(); }
  function picker(gender, label) { return button("choose", '<canvas data-character="' + gender + '"></canvas><b>' + label + "</b>", "rider-choice" + (choice === gender ? " chosen" : ""), gender); }
  function drawModal() {
    const o = s.order, body = $("modal-content"), place = currentPlace();
    let title = "", kicker = "", html = "";
    if (modal === "rider") {
      title = "라이더 선택"; kicker = "RIDER SELECT";
      html = "<p>" + esc(place.street) + "에서 배달할 라이더를 골라 주세요.</p><div class=\"pickers\">" + picker("male", "남성 라이더") + picker("female", "여성 라이더") + "</div>" + button("confirmRider", choiceContext === "start" ? "이 라이더로 출발" : "라이더 변경", "main-btn wide");
    } else if (modal === "settings") {
      title = "설정"; kicker = "SETTINGS";
      html = '<fieldset class="region-box"><legend>배달 지역명</legend><p>원하는 동네 이름을 적으면 거리 간판과 매장 이름이 모두 그 지역으로 바뀌어요.</p>' +
        '<form id="region-form" class="region-form"><input id="region-input" class="region-input" type="text" maxlength="10" autocomplete="off" placeholder="예: 부천, 강남, 해운대" value="' + esc(s.regionName) + '" aria-label="배달 지역명"><button type="submit" class="main-btn">적용</button></form>' +
        '<div id="region-preview" class="region-preview">' + renderPreviewTags(s.regionName) + "</div>" +
        '<div class="region-chips">' + G.presetRegions.map(r => button("presetRegion", esc(r), "region-chip" + (s.regionName === r ? " chosen" : ""), r)).join("") + "</div>" +
        (modalMessage ? '<div class="modal-note" role="status">' + esc(modalMessage) + "</div>" : "") + "</fieldset>" +
        '<fieldset class="district-picker"><legend>거리 배경 분위기</legend><div class="district-options">' + G.themes.map(t => {
          const selected = s.themeId === t.id;
          return '<button type="button" class="district-card" data-action="theme" data-value="' + t.id + '" aria-label="' + esc(t.name) + '" aria-pressed="' + selected + '"><img src="assets/' + t.image + '.webp?v=4" alt=""><span>' + esc(t.short) + "</span>" + (selected ? I("check") : "") + "</button>";
        }).join("") + "</div></fieldset>" +
        '<div class="setting-row"><strong>라이더</strong>' + button("editRider", (s.gender === "female" ? "여성" : s.gender === "male" ? "남성" : "라이더") + " 선택", "sub-btn") + "</div>";
      for (const [key, label] of [["music", "배경음악"], ["sfx", "효과음"]]) html += '<div class="setting-row"><strong>' + label + "</strong>" + button("toggle", s[key] ? "켜짐" : "꺼짐", "toggle" + (s[key] ? " chosen" : ""), key) + "</div>";
      html += '<div class="setting-row"><strong>전체 화면</strong>' + button("fullscreen", document.fullscreenElement ? "해제" : "전환", "sub-btn") + '</div><p style="margin-top:12px">이동 중 화면을 탭하거나 Space를 누르면 가속합니다. 피로가 가득 차기 전에 잠깐 쉬면 더 빨리 회복해요.</p>';
    } else if (modal === "garage") {
      title = "라이더 차고"; kicker = "GARAGE"; html = '<div class="modal-money">' + I("coin") + " " + won(s.money) + '</div><div class="modal-tabs">' + button("garageTab", "배달 수단", garageTab === "rides" ? "chosen" : "", "rides") + button("garageTab", "강화 장비", garageTab === "gear" ? "chosen" : "", "gear") + "</div>";
      if (garageTab === "rides") {
        html += '<div class="garage-grid">' + G.vehicles.map(v => { const owned = s.owned.includes(v.id), active = v.id === s.vehicle; return button("vehicle", '<canvas data-vehicle="' + v.id + '"></canvas><b>' + v.name + '</b><small class="' + (owned ? "owned" : "") + '">' + (active ? "장착 중" : owned ? "장착하기" : won(v.cost)) + '</small><small class="owned">' + v.speed + " km/h</small>", "vehicle" + (active ? " chosen" : ""), v.id); }).join("") + "</div>";
      } else for (const [id, name, desc] of [["speedGear", "경량 배달 가방", "단계마다 기본 속도 +12%"], ["coolGear", "쿨링 조끼", "단계마다 피로 회복 속도 증가"]]) {
        html += '<div class="list-row"><div><strong>' + name + " · Lv." + s[id] + "</strong><small>" + desc + "</small></div>" + button("gearBuy", s[id] >= 5 ? "최고 단계" : won(G.gearCost(s[id])) + " 강화", "sub-btn", id, s[id] >= 5) + "</div>";
      }
      html += '<div class="modal-note" role="status">' + modalMessage + "</div>";
    } else if (modal === "missions") {
      title = "오늘의 미션"; kicker = "DAILY MISSION";
      html = "<h3>" + I("flag") + ' 빠른 배달 3회</h3><p style="margin:8px 0">콜별 목표 시간 안에 정확한 주소로 음식을 3번 전달하세요.</p><div class="list-row"><strong>달성 횟수</strong><b class="modal-money">' + s.quick + ' / 3</b></div><div class="list-row"><strong>보너스 운임</strong><b class="modal-money">' + won(2200) + "</b></div>" + button("claimMission", s.claimed ? "보상 수령 완료" : s.quick === 3 ? "보상 받기" : "미션 진행 중", "main-btn wide", "", s.claimed || s.quick < 3);
    } else if (modal === "history") {
      title = "배달 기록"; kicker = "DELIVERY LOG"; html = '<div class="summary-grid"><div><small>완료한 배달</small><b>' + s.count + "건</b></div><div><small>누적 운임</small><b>" + won(s.total) + "</b></div><div><small>평균 평점</small><b>" + G.rating(s).toFixed(1) + "</b></div></div>";
      if (!s.history.length) html += '<p class="empty">첫 음식을 전달하면 여기에 정산 기록이 쌓여요.</p>';
      else for (const r of s.history) html += '<div class="list-row"><div><strong>' + esc(r.name) + "</strong><small>DAY " + r.day + " · " + esc(r.shop || r.regionName || s.regionName) + " · " + esc(r.home) + " · " + r.time + "초 · ★ " + r.score.toFixed(1) + '</small></div><b class="modal-money">' + won(r.pay) + "</b></div>";
    } else if (modal === "map") {
      title = "배달 경로"; kicker = esc(place.name) + " DELIVERY MAP"; html = '<canvas class="large-map" id="large-map" width="1056" height="492"></canvas><div class="map-legend"><span>현재 위치</span><span class="pickup">픽업</span><span class="destination">배달지</span></div><div class="list-row"><div><strong>' + esc(o.shop) + " → " + esc(o.home) + "</strong><small>" + esc(o.name) + " · " + o.flat + "호 · " + o.dist.toFixed(1) + ' km</small></div><b class="modal-money">' + won(o.fare) + "</b></div><p>목표 시간 " + o.fastLimit + "초 · 평점 " + o.rate.toFixed(1) + (o.peak ? " · 피크 할증 10%" : "") + (o.rain ? " · 우천 할증 25%" : "") + "</p>";
    }
    $("modal-title").textContent = title; $("modal-kicker").textContent = kicker; body.innerHTML = html;
    body.querySelectorAll("[data-character]").forEach(c => A.drawRider(c, { gender: c.dataset.character, vehicle: "walk", time: 0, moving: false, boost: false }));
    body.querySelectorAll("[data-vehicle]").forEach(c => A.drawTransport(c, c.dataset.vehicle));
    if ($("large-map")) V.drawMap($("large-map"), visualMapProgress());
    if ($("region-form")) {
      const input = $("region-input"), preview = $("region-preview");
      input.addEventListener("input", () => { preview.innerHTML = renderPreviewTags(input.value); });
      $("region-form").addEventListener("submit", e => {
        e.preventDefault();
        applyRegionName(input.value);
      });
    }
  }
  function applyRegionName(raw) {
    const cleaned = G.cleanRegion(raw);
    const changed = G.setRegion(s, cleaned);
    modalMessage = changed ? "'" + cleaned + "' 지역이 적용되었어요! (거리 간판과 매장 이름에 바로 반영됨)" : "'" + cleaned + "' 지역이 이미 적용 중이에요.";
    swapScene(false);
    drawModal();
    persist();
    note(changed ? cleaned + " 지역으로 변경했어요!" : cleaned + " 지역이 적용 중이에요.");
  }
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else { await document.documentElement.requestFullscreen(); try { await screen.orientation.lock("landscape"); } catch {} }
    } catch { note("이 브라우저에서는 전체 화면을 지원하지 않아요."); }
    if (modal === "settings") drawModal();
  }
  function boost() {
    if (modal) return;
    const result = G.tap(s);
    if (!result) { if (!G.traveling(s)) note("가게나 배달지로 이동할 때 탭하세요."); return; }
    S.effect(result === "locked" ? "lock" : "boost"); if (result === "locked") note("피로가 가득 찼어요! 잠시 회복합니다.");
    $("boost").classList.add("hit"); setTimeout(() => $("boost").classList.remove("hit"), 85); status(); paint(anim);
  }
  function action(id, value) {
    S.unlock(s);
    if (id === "boost") { boost(); return; }
    if (id !== "mute") S.effect("click");
    if (id === "home" || id === "close") closeModal();
    else if (["garage", "missions", "history", "map", "settings"].includes(id)) openModal(id);
    else if (id === "mute") { s.muted = !s.muted; note(s.muted ? "전체 소리 끔" : "전체 소리 켬"); status(); }
    else if (id === "fullscreen") { fullscreen(); return; }
    else if (id === "presetRegion") { applyRegionName(value); return; }
    else if (id === "theme") {
      if (G.setTheme(s, value)) { swapScene(false); drawModal(); dialog.querySelector('[data-action="theme"][data-value="' + s.themeId + '"]')?.focus(); }
    }
    else if (id === "toggle") { if (["music", "sfx"].includes(value)) { s[value] = !s[value]; if (s[value]) s.muted = false; } drawModal(); status(); }
    else if (id === "accept" && s.phase === "offer") {
      if (!s.gender) { choiceContext = "start"; choice = "male"; openModal("rider"); }
      else { G.start(s); S.effect("accept"); swapScene(); }
    } else if (id === "editRider") { choiceContext = "settings"; choice = s.gender || "male"; openModal("rider"); }
    else if (id === "choose") { choice = value; drawModal(); }
    else if (id === "confirmRider") {
      s.gender = choice; closeModal(); if (choiceContext === "start") { G.start(s); S.effect("accept"); swapScene(); } else { paint(anim); openModal("settings"); }
    } else if (id === "garageTab") { garageTab = value; modalMessage = ""; drawModal(); }
    else if (id === "vehicle") { modalMessage = G.buyVehicle(s, value); drawModal(); status(); paint(anim); }
    else if (id === "gearBuy") { modalMessage = G.buyGear(s, value); drawModal(); status(); }
    else if (id === "claimMission") { if (G.claimMission(s)) { S.effect("complete"); status(); drawModal(); } }
    else { const old = s.phase; G.act(s, id, value); if (s.phase !== old) swapScene(); }
    persist();
  }
  document.addEventListener("click", e => {
    const b = e.target.closest("[data-action]");
    if (b) { action(b.dataset.action, b.dataset.value); return; }
    if (e.target === dialog) { closeModal(); return; }
    if (!modal && world.contains(e.target) && G.traveling(s)) { S.unlock(s); boost(); }
  });
  document.addEventListener("keydown", e => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.code === "Space" && !modal && G.traveling(s) && !e.ctrlKey && !e.altKey) { e.preventDefault(); if (!e.repeat) { S.unlock(s); boost(); } }
  });
  dialog.addEventListener("close", () => { if (!dialog.open) { modal = ""; markNav(); } });
  dialog.addEventListener("cancel", () => { modal = ""; markNav(); });
  document.addEventListener("visibilitychange", () => { if (document.hidden) persist(); lastFrame = performance.now(); }); window.addEventListener("pagehide", persist);
  new ResizeObserver(() => { snapshot(); paint(anim); }).observe(world);
  V.hydrate(); dialog.setAttribute("aria-labelledby", "modal-title"); snapshot(); swapScene(false); requestAnimationFrame(frame);
  for (const file of ["shop", "parking", "hall"]) { const img = new Image(); img.src = "assets/" + file + ".webp?v=4"; }
})();
