(() => {
  "use strict";

  // Measured coordinates on the 3:1 (2172x724) street paintings:
  // slots[0] = left shop (sign box [x,y,w,h], emblem center [x,y], doorX)
  // slots[1] = right shop (sign box [x,y,w,h], emblem center [x,y], doorX)
  const layouts = {
    workshop: {
      slots: [
        { sign: [0.365, 0.460, 0.205, 0.077], emblem: [0.228, 0.452], door: 0.361 },
        { sign: [0.754, 0.474, 0.190, 0.075], emblem: [0.626, 0.468], door: 0.766 }
      ]
    },
    avenue: {
      slots: [
        { sign: [0.404, 0.460, 0.165, 0.074], emblem: [0.290, 0.456], door: 0.440 },
        { sign: [0.735, 0.465, 0.150, 0.072], emblem: [0.628, 0.464], door: 0.724 }
      ]
    },
    art: {
      slots: [
        { sign: [0.395, 0.510, 0.178, 0.073], emblem: [0.267, 0.506], door: 0.462 },
        { sign: [0.785, 0.519, 0.145, 0.068], emblem: [0.679, 0.517], door: 0.835 }
      ]
    }
  };

  const spriteWidth = 180;
  const strideUnitsPerKm = 2200;

  function pickupSlot(order) {
    return (order && Number.isFinite(order.id)) ? (order.id % 2) : 0;
  }

  function project(place, order, phase, progress, terrain) {
    const tileWidth = Math.max(terrain.w, terrain.h * 3);
    const spriteScale = terrain.riderWidth / spriteWidth;
    const layout = layouts[place.themeId] || layouts.workshop;
    const slotIdx = pickupSlot(order);
    const door = layout.slots[slotIdx].door;
    const pickupWorldX = door * tileWidth;
    const pickupLength = order.pick * strideUnitsPerKm;
    const deliveryLength = (order.dist - order.pick) * strideUnitsPerKm;
    const startScreenX = terrain.w * 0.23;
    const pickupScreenX = startScreenX + Math.min(terrain.w * 0.15, pickupLength * spriteScale * 0.22);
    const endScreenX = pickupScreenX + Math.min(terrain.w * 0.20, deliveryLength * spriteScale * 0.22);

    const delivery = phase === "toHome";
    const t = phase === "shopArrive" ? 1 : phase === "toShop" || delivery ? progress : 0;
    const startX = delivery ? pickupScreenX : startScreenX;
    const endX = delivery ? endScreenX : pickupScreenX;
    const feetX = startX + (endX - startX) * t;
    const stride = t * (delivery ? deliveryLength : pickupLength);
    const origin = delivery ? pickupWorldX : pickupWorldX - pickupLength * spriteScale;
    const cameraX = feetX - (origin + stride * spriteScale);
    const targetWorldX = delivery ? pickupWorldX + deliveryLength * spriteScale : pickupWorldX;
    return { tileWidth, cameraX, feetX, stride, markerX: targetWorldX + cameraX };
  }

  function foodForStorefront(tileIndex, slotIdx, order) {
    const G = window.RiderGame;
    const list = G.foods;
    // On tile 0, the target pickup slot ALWAYS shows the current order's exact store!
    if (tileIndex === 0 && order && slotIdx === pickupSlot(order)) {
      return G.foodById(order.food);
    }
    // Otherwise pick a diverse, deterministic neighborhood shop so the rider passes many different shops
    const orderIdx = order ? Math.max(0, list.findIndex(f => f[0] === order.food)) : 0;
    const raw = (tileIndex * 7 + slotIdx * 3 + orderIdx + 5);
    let idx = ((raw % list.length) + list.length) % list.length;
    if (tileIndex === 0 && order && list[idx][0] === order.food) {
      idx = (idx + 1) % list.length;
    }
    return list[idx];
  }

  function applySignText(label, text, box) {
    const [, , w, h] = box;
    label.textContent = text;
    // Dynamically fit longer region + shop names inside the cream signboard neatly
    const len = Math.max(4, text.length);
    const widthFactor = (w * 0.80) / (len * 0.92);
    const sizeRatio = Math.min(h * 0.26, widthFactor);
    label.style.fontSize = "calc(var(--tile-width) * " + sizeRatio.toFixed(5) + ")";
  }

  function createStrip(element) {
    let currentKey = "", currentPlace = null, currentOrder = null, tiles = [], tileSize = 0;

    function buildTile(place) {
      const layout = layouts[place.themeId] || layouts.workshop;
      const tile = document.createElement("div");
      tile.className = "street-tile";
      tile.setAttribute("aria-hidden", "true");

      const art = document.createElement("div");
      art.className = "street-painting";
      art.style.backgroundImage = 'url("assets/' + place.image + '.webp?v=4")';
      tile.append(art);

      const slots = layout.slots.map((slot, slotIdx) => {
        const label = document.createElement("span");
        label.className = "shop-lettering " + (slotIdx === 0 ? "primary" : "secondary");
        const [x, y, w, h] = slot.sign;
        label.style.setProperty("--sign-x", x * 100 + "%");
        label.style.top = y * 100 + "%";
        label.style.width = w * 100 + "%";
        label.style.height = h * 100 + "%";

        const emblem = document.createElement("canvas");
        emblem.className = "shop-emblem";
        emblem.style.setProperty("--emblem-x", slot.emblem[0] * 100 + "%");
        emblem.style.top = slot.emblem[1] * 100 + "%";

        tile.append(label, emblem);
        return { label, emblem, box: slot.sign, foodId: "", text: "" };
      });

      return { el: tile, slots, tileIndex: null };
    }

    function updateTileContent(tileObj, index) {
      if (!currentPlace) return;
      const reflected = Math.abs(index) % 2 === 1;
      tileObj.el.classList.toggle("reflected", reflected);
      tileObj.slots.forEach((slot, slotIdx) => {
        const food = foodForStorefront(index, slotIdx, currentOrder);
        const text = currentPlace.name + food[2];
        if (slot.text !== text) {
          applySignText(slot.label, text, slot.box);
          slot.text = text;
        }
        if (slot.foodId !== food[0]) {
          window.RiderArt.drawFoodEmblem(slot.emblem, food[0]);
          slot.foodId = food[0];
        }
      });
      tileObj.tileIndex = index;
    }

    function show(place, order) {
      element.hidden = false;
      const key = place.themeId + "|" + place.name + "|" + (order?.id || 0) + "|" + (order?.food || "");
      currentPlace = place;
      currentOrder = order;
      if (key === currentKey) return;
      const themeChanged = !tiles.length || currentKey.split("|")[0] !== place.themeId;
      currentKey = key;
      element.setAttribute("aria-label", place.name + " 상점 거리");
      if (themeChanged) {
        tiles = [0, 1].map(() => buildTile(place));
        element.replaceChildren(...tiles.map(t => t.el));
      } else {
        tiles.forEach(t => { if (t.tileIndex !== null) updateTileContent(t, t.tileIndex); });
      }
    }

    function position({ tileWidth, cameraX }) {
      if (tileWidth !== tileSize) {
        element.style.setProperty("--tile-width", tileWidth + "px");
        tileSize = tileWidth;
      }
      const firstTile = Math.floor(-cameraX / tileWidth);
      tiles.forEach((tileObj, i) => {
        const index = firstTile + i;
        if (tileObj.tileIndex !== index) updateTileContent(tileObj, index);
        tileObj.el.style.transform = "translate3d(" + (cameraX + index * tileWidth) + "px,0,0)";
      });
    }

    function refreshArtwork() {
      tiles.forEach(tile => {
        tile.slots.forEach(slot => { slot.foodId = ""; });
        if (tile.tileIndex !== null) updateTileContent(tile, tile.tileIndex);
      });
    }

    return { show, position, refreshArtwork };
  }

  window.RiderStreet = { project, createStrip };
})();
