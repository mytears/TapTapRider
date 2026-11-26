/* Golden-hour painterly artwork for Tap Tap Rider — harmonized with the painted street, shop, parking, and hall scenes. */
(() => {
  "use strict";
  const painted = window.PaintedSprites;

  // Warm sunset palette tuned directly to street.webp / shop.webp / parking.webp
  const ink = "#3c2629", softInk = "#633e38", warmShadow = "#4a2a36";
  const rimGold = "#ffebb3", sunPeach = "#ffd08a", sunAmber = "#f49e58";
  const jadeDark = "#1d574c", jade = "#2f7a6c", mint = "#62b59b", paleMint = "#b7e4cc";
  const cream = "#fff2d4", paper = "#fff9ea", warmWood = "#b87643", darkWood = "#6e4026";
  const terracotta = "#d66c4c", coral = "#ec8c6b", blush = "#ef9882";
  const skinLit = "#ffe7c8", skinMid = "#fcc99c", skinShad = "#d9927a";
  const pantsDark = "#2d3c4b", pantsMid = "#41566a", pantsLit = "#657e92";
  const tireDark = "#2d2830", steel = "#8fa2a4", chrome = "#eef3e8", brass = "#e5b25d";
  const TAU = Math.PI * 2, paths = new Map(), layers = new Map(), foodCache = new Map();
  const aliases = {
    foot: "walk", walking: "walk", bicycle: "bike", scooter: "kickboard", kick: "kickboard",
    electric: "ebike", electricbike: "ebike", motorcycle: "moto", motorbike: "moto",
    superbike: "sport", sportbike: "sport"
  };

  // Subtle gouache/canvas grain pattern so painted surfaces feel organic like the backgrounds
  let grainPattern = null;
  function getGrain(ctx) {
    if (grainPattern) return grainPattern;
    const g = document.createElement("canvas");
    g.width = 48; g.height = 48;
    const gc = g.getContext("2d");
    let seed = 1337;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < 48; y += 2) {
      for (let x = 0; x < 48; x += 2) {
        const v = rand();
        gc.fillStyle = v > 0.5 ? `rgba(255,238,200,${(v - 0.5) * 0.14})` : `rgba(60,34,38,${(0.5 - v) * 0.12})`;
        gc.fillRect(x, y, 2, 2);
      }
    }
    grainPattern = ctx.createPattern(g, "repeat");
    return grainPattern;
  }

  function surface(canvas, w, h, scale = 3) {
    if (canvas.width !== w * scale) canvas.width = w * scale;
    if (canvas.height !== h * scale) canvas.height = h * scale;
    canvas.style.imageRendering = "auto";
    const c = canvas.getContext("2d");
    c.setTransform(scale, 0, 0, scale, 0, 0);
    c.clearRect(0, 0, w, h);
    c.lineJoin = "round";
    c.lineCap = "round";
    return c;
  }

  function getPath(d) {
    if (typeof d !== "string") return d;
    let p = paths.get(d);
    if (!p) { p = new Path2D(d); paths.set(d, p); }
    return p;
  }

  function paint(c, path, fill, stroke = ink, width = 1.65) {
    const p = getPath(path);
    if (fill) { c.fillStyle = fill; c.fill(p); }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
  }

  function paintTextured(c, path, fill, stroke = ink, width = 1.65) {
    const p = getPath(path);
    if (fill) {
      c.fillStyle = fill;
      c.fill(p);
      c.save();
      c.clip(p);
      c.fillStyle = getGrain(c);
      c.fill(p);
      c.restore();
    }
    if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
  }

  function ellipse(c, x, y, rx, ry, fill, stroke = null, width = 1.4, angle = 0) {
    c.beginPath();
    c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), angle, 0, TAU);
    if (fill) { c.fillStyle = fill; c.fill(); }
    if (stroke) { c.lineWidth = width; c.strokeStyle = stroke; c.stroke(); }
  }

  function line(c, x, y, x2, y2, color, width = 1.5) {
    c.beginPath(); c.moveTo(x, y); c.lineTo(x2, y2);
    c.strokeStyle = color; c.lineWidth = width; c.stroke();
  }

  function transform(c, x, y, scale, angle, draw) {
    c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale); draw(); c.restore();
  }

  function grad(c, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1);
    for (const [at, col] of stops) g.addColorStop(at, col);
    return g;
  }

  function wash(c, top, bottom, a, b) {
    return grad(c, 0, top, 0, bottom, [[0, a], [1, b]]);
  }

  function light(c, x, y, r, stops) {
    const g = c.createRadialGradient(x, y, 0, x, y, Math.max(0.5, r));
    for (const [at, col] of stops) g.addColorStop(at, col);
    return g;
  }

  function stitches(c, path, color, width = 0.8) {
    c.save(); c.setLineDash([1.7, 1.8]); paint(c, path, null, color, width); c.restore();
  }

  function glow(c, x, y, r, inner, outer = "rgba(255,214,120,0)") {
    ellipse(c, x, y, r, r, light(c, x, y, r, [[0, inner], [1, outer]]));
  }

  function layer(c, id, x, y, w, h, draw) {
    let image = layers.get(id);
    if (!image) {
      const density = 4;
      image = document.createElement("canvas");
      image.width = Math.ceil(w * density);
      image.height = Math.ceil(h * density);
      const b = image.getContext("2d");
      b.setTransform(density, 0, 0, density, -x * density, -y * density);
      b.lineCap = "round"; b.lineJoin = "round";
      draw(b);
      layers.set(id, image);
    }
    c.drawImage(image, x, y, w, h);
  }

  function pipe(c, x, y, ex, ey, color, width, hi = null) {
    line(c, x, y, ex, ey, ink, width + 2.7);
    line(c, x, y, ex, ey, color, width);
    if (hi) {
      const dx = ex - x, dy = ey - y, len = Math.max(1, Math.hypot(dx, dy));
      const nx = -dy / len * (width * 0.24), ny = dx / len * (width * 0.24);
      line(c, x + nx, y + ny, ex + nx, ey + ny, hi, Math.max(0.8, width * 0.28));
    }
  }

  // Signature twin-leaf courier emblem
  function leaves(c, x, y, scale, color = paper) {
    transform(c, x, y, scale, 0, () => {
      paint(c, "M0 3 Q-8 3 -9 -5 Q-1 -6 1 1 Q2 -7 11 -9 Q12 0 3 3 L1 7 Q0 8 -1 7 Z", color, null);
    });
  }

  /* ============================================================================
   * GOLDEN-HOUR PAINTERLY RIDER (MALE & FEMALE)
   * ============================================================================ */

  function face(c, female, blink) {
    if (painted?.face(c, female, blink)) return;
    const closed = blink > 0.86;
    layer(c, "portrait-v4-" + female + "-" + closed, -48, -42, 90, 76, b => paintFace(b, female, closed));
  }

  function paintFace(c, female, closed) {
    // Flowing sunlit ponytail for female rider
    if (female) {
      paintTextured(c, "M-18 -5 C-32 -14 -44 -2 -41 8 Q-36 16 -45 25 Q-36 27 -30 22 Q-34 26 -35 28 C-21 29 -13 17 -16 8 Z",
        grad(c, -42, -10, -16, 26, [[0, "#8d5749"], [0.45, "#613939"], [1, "#3b2329"]]), ink, 1.5);
      // Warm sunset golden hair highlights on ponytail
      paint(c, "M-26 -4 C-37 -5 -38 4 -35 10 Q-32 16 -38 22", null, "#d99268", 1.7);
      paint(c, "M-22 1 Q-28 6 -27 14 T-31 23", null, "#a86855", 1.25);
      // Warm peach scrunchie + ribbon tails
      paint(c, "M-27 6 L-34 14 L-28 13 L-25 8 Z", terracotta, ink, 0.9);
      ellipse(c, -25, 3, 3.6, 5.4, grad(c, -28, -2, -22, 8, [[0, "#ffc28d"], [1, "#cf6b53"]]), ink, 1.2, -0.35);
    }

    // Neck with warm sunset ambient shadow
    paint(c, "M-8 19 L5 19 L4 29 L-9 29 Z", grad(c, -8, 19, 5, 28, [[0, "#d8927c"], [1, "#f7c299"]]), ink, 1.2);

    // Sculpted anime/Ghibli 3/4 head with golden-hour lighting from upper-left
    const faceShape = "M-22 -11 Q-21 -25 0 -26 Q23 -25 27 -9 Q30 -0.5 27 5 Q29.7 7.6 30 9.2 Q30 11.4 26.8 12.2 Q26.8 15.5 24.6 17.6 C20.8 25.8 6.5 29.2 -7.5 25 Q-25 21 -26 7 Z";
    paintTextured(c, faceShape,
      light(c, 13, -7, 46, [[0, "#fff4d8"], [0.42, skinLit], [0.76, skinMid], [1, skinShad]]),
      ink, 1.6);

    // Warm rose-umber jawline & cap cast shadow
    paint(c, "M-20 9 C-19 23 -1 28 14 23.5 Q1 29 -12 23.5 Q-19 20 -21 13 Z", "rgba(182, 102, 92, 0.45)", null);
    paint(c, "M-12 -8 Q6 -14 23 -10 L26 -6 Q10 -8 -9 -2 Z", "rgba(155, 86, 78, 0.36)", null);

    // Rich sunlit chestnut hair framing face
    const hairPath = female
      ? "M-25 -13 Q-10 -30 13 -21 Q25 -16 26 -7 Q18 -13 13 -13 Q12 -6 5 -4 Q7 -9 6 -11 Q-1 -5 -6 -2 Q-4 -8 -7 -9 Q-13 -5 -14 3 Q-16 14 -21 15 Q-29 10 -28 0 Z"
      : "M-26 -13 Q-14 -28 10 -23 Q24 -19 26 -8 Q19 -10 14 -13 Q15 -7 9 -4 L8 -11 Q2 -4 -5 -3 L-5 -10 Q-12 -4 -14 4 Q-15 13 -21 12 Q-28 6 -27 -1 Z";
    paintTextured(c, hairPath,
      grad(c, -20, -26, 20, 14, [[0, "#9b6453"], [0.35, "#6b413d"], [0.8, "#472c30"], [1, "#352026"]]),
      ink, 1.5);
    // Warm golden sunset hair sheen strands
    paint(c, "M-23 -8 Q-16 -16 -6 -17 Q-15 -13 -19 -6 Z M-14 -6 Q-10 -12 -5 -12 Q-9 -8 -12 -3 Z M2 -10 Q9 -15 18 -13 Q11 -12 5 -8 Z", "#d6946b", null);
    paint(c, "M-21 -3 Q-19 2 -16 4 M-10 -9 Q-6 -14 1 -15 M12 -14 Q17 -14 21 -11", null, "#f4be86", 0.95);

    // Sculpted ear + golden earring for female
    ellipse(c, -17.5, 7, 5.4, 6.2, light(c, -20, 4, 10, [[0, skinLit], [1, skinShad]]), softInk, 1.25, -0.2);
    paint(c, "M-20 7.7 Q-19.5 3.6 -16.5 5.4 Q-14.5 7 -16.6 8.6", null, "#b87666", 1.05);
    if (female) {
      ellipse(c, -17.2, 12.6, 1.9, 1.9, brass, softInk, 0.75);
      ellipse(c, -17.7, 12.1, 0.7, 0.7, rimGold);
      paint(c, "M-13 0 Q-13 10 -7.5 14 Q-15.5 14 -17 5", "#4a2e32", null);
    }

    // Expressive eyebrows
    paint(c, "M1.2 -3.4 Q4.8 -6.6 9.1 -3.8 Q6.4 -4 1.8 -2.5 Z M17.8 -4 Q20.4 -6.4 24.2 -3.9 Q21 -4.4 17.8 -3.1 Z", "#5d393a", null);

    // Rich multi-layered anime/Ghibli eyes
    if (closed) {
      paint(c, "M2.2 4.2 Q5.2 6.8 8.4 3.8 M17.8 4 Q20.7 6.5 23.3 3.4", null, ink, 1.85);
    } else {
      // Sclera with warm top lash shadow
      ellipse(c, 5.8, 3.5, 3.0, 4.1, "#fff8e8");
      ellipse(c, 20.6, 3.0, 2.75, 3.75, "#fff8e8");
      // Deep amber-chestnut iris with rich lower golden glow
      ellipse(c, 6.3, 3.5, 2.55, 3.7, grad(c, 6, -0.2, 6, 7.2, [[0, "#311e24"], [0.45, "#6b3e33"], [0.85, "#c97e4a"], [1, "#f2b86d"]]));
      ellipse(c, 20.9, 3.0, 2.25, 3.4, grad(c, 21, -0.4, 21, 6.5, [[0, "#311e24"], [0.45, "#6b3e33"], [0.85, "#c97e4a"], [1, "#f2b86d"]]));
      // Pupils
      ellipse(c, 6.4, 3.5, 1.15, 1.5, "#2b1a20");
      ellipse(c, 21.0, 3.0, 1.0, 1.35, "#2b1a20");
      // Crisp sunlit catchlights + lower bounce sparkle
      ellipse(c, 7.1, 1.9, 0.95, 1.05, "#fffef6");
      ellipse(c, 21.6, 1.5, 0.85, 0.95, "#fffef6");
      ellipse(c, 5.2, 5.2, 0.55, 0.45, "#ffe4a3");
      ellipse(c, 19.9, 4.6, 0.48, 0.4, "#ffe4a3");
      // Upper lash line
      paint(c, "M2.7 2.2 Q4.5 -1.1 8.4 0.5 M18.0 1.7 Q19.9 -1.2 22.8 0.1", null, ink, 1.45);
      if (female) paint(c, "M2.8 1.9 Q1.4 1.3 1.0 0.2 M18.1 1.4 Q16.8 1.0 16.5 0.0", null, ink, 1.1);
    }

    // Warm golden-hour cheek blush & sunlight speculars
    ellipse(c, -0.8, 10.2, 6.2, 3.8, light(c, -0.8, 10.2, 6.2, [[0, "rgba(239,138,116,0.72)"], [1, "rgba(239,138,116,0)"]]), null, 1, 0.08);
    ellipse(c, 23.0, 9.6, 3.8, 2.6, light(c, 23.0, 9.6, 3.8, [[0, "rgba(239,138,116,0.68)"], [1, "rgba(239,138,116,0)"]]));
    ellipse(c, -2.0, 8.7, 2.0, 0.7, "#fff2d0", null, 1, -0.15);

    // Subtle nose with warm sunset tip highlight
    paint(c, "M14.2 4.8 Q15.4 6.5 17.1 7.9 Q17.0 10.0 13.7 9.2", null, "#b87662", 1.05);
    ellipse(c, 16.8, 7.1, 1.45, 0.7, "#fff3cd", null, 1, 0.16);

    // Warm cheerful smile
    paint(c, "M8.6 14.6 Q13.1 19.0 18.0 13.6 Q15.2 20.5 11.2 18.2 Z", "#c96e6b", null);
    paint(c, "M8.5 14.5 Q13.0 18.9 17.8 13.7", null, "#794246", 1.4);
    paint(c, "M12.2 20.3 Q14.1 20.8 15.9 19.7", null, "#ffecc9", 1.05);

    // Richly shaded six-panel forest-jade courier cap with golden sunset rim
    paintTextured(c, "M-27 -8 C-28 -24 -17 -35 -0.5 -35 C11.5 -36 21.5 -29 24.5 -18 Q26.5 -13 23.5 -10 Q8 -13 -6 -8 Q-19 -2 -27 -8 Z",
      light(c, -10, -32, 44, [[0, "#d7f0cb"], [0.32, "#7bc5a7"], [0.68, "#3e8b79"], [1, "#1e564c"]]),
      ink, 1.65);
    // Cap panel shading + warm sunset top rim
    paint(c, "M-26 -12 Q-16 -16 -17 -23 Q-16 -29 -9 -31 Q-14 -25 -12 -19 Q-11 -15 -5 -13 Q-15 -9 -25 -8 Z", "rgba(25, 76, 68, 0.35)", null);
    paint(c, "M-23 -14 Q-21 -27 -10 -30 M-4 -32 Q4 -29 8 -17", null, jadeDark, 1.15);
    paint(c, "M-23 -19 C-21 -29 -11 -34 2 -33", null, rimGold, 1.9);
    // Curved cap visor with sunlit top lip
    paintTextured(c, "M-24 -10 Q-9 -10 3 -15 Q14 -19 25 -18 Q34 -19 36 -14.5 Q36 -11.5 29 -10.5 C21 -8.5 11 -10.5 2 -8.5 Q-14 -2.5 -23 -4.5 Q-26 -6 -24 -10 Z",
      grad(c, -20, -18, 34, -8, [[0, "#3f8d7b"], [0.55, "#2a6e61"], [1, "#1d4f47"]]),
      ink, 1.6);
    paint(c, "M-20 -8.5 Q-8 -8.5 3 -12.5 Q17 -17.5 31 -16", null, rimGold, 1.35);
    stitches(c, "M-21 -12 Q-9 -13 0 -16 Q13 -21 23 -19", "#e9f2cf", 0.8);
    ellipse(c, -3, -35, 3.2, 1.8, brass, ink, 1);
    leaves(c, 10.5, -23.5, 0.42, rimGold);
  }

  function bag(c) {
    if (painted?.bag(c)) return;
    // Insulated quilted courier backpack with sunset highlights, brass buckles & side bottle
    paintTextured(c, "M-41 -36 Q-42 -42 -34 -44 L-14 -46 Q-8 -45 -7 -38 L-5 -5 Q-5 1 -11 2 L-37 4 Q-44 4 -45 -3 L-47 -28 Q-48 -35 -41 -36 Z",
      grad(c, -46, -44, -6, 4, [[0, "#97d9b8"], [0.42, "#4e9d88"], [0.82, "#296d62"], [1, "#1c4e47"]]),
      ink, 1.9);
    // Side panel depth + thermos water bottle in mesh pocket
    paint(c, "M-19 -42 Q-13 -46 -8 -41 Q-6 -37 -6 -29 L-5 -3 Q-6 2 -12 2 L-17 2 Z",
      wash(c, -42, 2, "#398273", "#1b4d46"), ink, 1.2);
    paint(c, "M-16 -17 L-9 -18 L-8 -3 Q-11 -1 -15 -2 Z", grad(c, -16, -17, -8, -2, [[0, "#f5d79f"], [1, "#c47f4d"]]), ink, 1.0);
    paint(c, "M-16 -20 L-10 -21 L-10 -17 L-16 -16 Z", jadeDark, ink, 0.9);
    // Top flap bathed in golden sunset light
    paintTextured(c, "M-47 -32 Q-47 -38 -39 -39 L-19 -41 Q-15 -41 -15 -36 L-15 -28 Q-15 -25 -19 -25 L-41 -22 Q-45 -22 -46 -26 Z",
      grad(c, -46, -40, -15, -23, [[0, "#d9f1cb"], [0.45, "#7fc7a8"], [1, "#3f8978"]]),
      ink, 1.5);
    // Sunset rim highlight on lid
    paint(c, "M-44 -37 Q-33 -39 -18 -40", null, rimGold, 1.8);
    paint(c, "M-45 -25 Q-38 -23 -17 -27 L-16 -24 Q-24 -20 -42 -20 Q-44 -20 -45 -25 Z", "rgba(25, 62, 56, 0.45)", null);
    // Reflective safety stripe (warm golden-cream glow)
    paint(c, "M-43 -16 Q-33 -18 -19 -18 L-18 -6 Q-18 -3 -22 -3 L-38 -1 Q-42 -1 -42 -5 Z",
      wash(c, -18, -1, "#59a791", "#2e7366"), jadeDark, 1.05);
    paint(c, "M-42 -19 L-19 -20.5 L-19 -17.5 L-42 -16 Z", rimGold, softInk, 0.65);
    stitches(c, "M-44 -32 L-43 -26 Q-41 -25 -38 -25 L-20 -27 M-40 -13 L-39 -5 Q-38 -3 -35 -4 L-22 -5", "#e2f0c5", 0.8);
    // Embroidered circular leaf badge
    ellipse(c, -29.5, -10.5, 7.2, 7.2, jadeDark);
    ellipse(c, -29.5, -11.1, 6.6, 6.6, cream, brass, 1.0);
    leaves(c, -29.5, -10.5, 0.48, jade);
    // Brass buckle & leather strap
    paint(c, "M-22.5 -31 L-18.8 -31.5 L-18.4 -21.5 Q-19.8 -20 -21.6 -20.5 Z", darkWood, ink, 0.75);
    paint(c, "M-22.4 -27.5 L-18.6 -28 L-18.3 -24 L-22.1 -23.5 Z", brass, ink, 0.85);
    // Carry handle on top
    paint(c, "M-33 -42 Q-34 -48 -24 -49 Q-19 -49 -18 -44", null, ink, 2.8);
    paint(c, "M-31.5 -45 Q-28 -48 -23 -47.5", null, rimGold, 1.0);
  }

  function jacket(c, female) {
    if (painted?.jacket(c, female)) return;
    // Cozy golden-hour courier windbreaker: female = warm coral-peach & cream, male = warm cream & forest-jade yoke
    const bodyGrad = female
      ? grad(c, -18, -40, 18, 4, [[0, "#ffe4be"], [0.35, "#f4a782"], [0.78, "#cf6c57"], [1, "#9b4744"]])
      : grad(c, -18, -40, 18, 4, [[0, "#fff5d6"], [0.38, "#f0cfa2"], [0.78, "#c79a72"], [1, "#916953"]]);
    paintTextured(c, "M-9 -40 Q0 -44 10 -39 Q17 -34 18 -19 L20 -4 Q19 1.5 11 3 L-9 4 Q-17 4 -18 -2 L-19 -25 Q-19 -35 -9 -40 Z",
      bodyGrad, ink, 1.85);

    // Cloth folds & warm sunset shadow
    paint(c, "M-17 -28 Q-12 -22 -13 -14 Q-13 -7 -7 -3 Q-15 -3 -17 -1 Z", "rgba(74, 40, 50, 0.28)", null);
    paint(c, "M14 -24 Q14 -14 17 -10 L11 -7 L17 -8 L16 -4 Q9 0 9 -7 Z", "rgba(74, 40, 50, 0.22)", null);

    // Contrasting shoulder yoke with golden rim highlight
    paint(c, "M-18 -29 Q-17 -37 -8 -40 Q0 -42 7 -38 L11 -32 Q5 -28 -3 -29 L-11 -27 Z",
      female ? grad(c, -18, -40, 10, -28, [[0, "#ffeec9"], [1, "#e5b892"]])
             : grad(c, -18, -40, 10, -28, [[0, "#6eb59b"], [1, "#2f7467"]]),
      softInk, 0.85);
    paint(c, "M-15 -35 Q-7 -40 4 -38", null, rimGold, 1.5);
    stitches(c, "M-15 -29 Q-9 -31 -3 -30 Q3 -29 7 -31", rimGold, 0.8);

    // High cozy collar + inner sunset-gold tee peeking out
    paint(c, "M-13 -39 Q-17 -43 -7 -46 Q3 -47 9 -41 Q11 -37 7 -34 Q-4 -32 -13 -39 Z",
      female ? "#f5b892" : "#e8c89e", ink, 1.4);
    paint(c, "M1 -41 L8 -43 L10 -37 Q6 -33 2 -35 Z", sunAmber, ink, 1.0);
    paint(c, "M0 -37 L5 -35 L9 -36 L9 -25 Q5 -29 2 -29 Z", jadeDark, softInk, 0.8);

    // Padded backpack shoulder strap
    paint(c, "M-13 -38 Q-6 -38 -7 -31 Q-11 -19 -11 -7", null, ink, 6.2);
    paint(c, "M-13 -38 Q-6 -38 -7 -31 Q-11 -19 -11 -7", null, jade, 4.0);
    paint(c, "M-13 -37 Q-9 -37 -9 -33", null, rimGold, 1.4);

    // Front zipper & chest pocket badge
    paint(c, "M6 -33 Q10 -21 11 -5", null, softInk, 1.25);
    paint(c, "M7.4 -32 Q11 -21 12 -8", null, rimGold, 0.9);
    paint(c, "M-8 -13 Q-4 -16 0 -17 L4 -12 L2 -6 L-4 -5 Z", "rgba(74, 42, 52, 0.16)", null);
    paint(c, "M-15 -20 L-7 -18 L-8 -13 L-15 -15 Z", jade, ink, 0.85);
    paint(c, "M-14 -18 L-8 -16.5", null, rimGold, 0.9);

    // Ribbed elastic hem
    paint(c, "M-17 -2 Q-3 0.5 17 -4 L17 -0.5 Q4 3.5 -8 4.2 Q-14 4.4 -17 1 Z",
      female ? "#9c4e49" : jadeDark, ink, 0.9);
    paint(c, "M-12 0.3 L-10.8 2.2 M-8 0.8 L-7 2.5 M10 -1.2 L11 0.5", null, rimGold, 0.75);
  }

  function sneaker(c, x, y, scale, angle, far) {
    if (painted?.sneaker(c, x, y, scale, angle, far)) return;
    transform(c, x, y, scale, angle, () => {
      paint(c, "M-5 -6 Q-2 -3 1 -5 Q3 -6 5 -3 L8 -1 Q15 0 16 3.5 Q16 6.5 11 7.2 L-4 7.2 Q-8.5 7 -8.5 3 L-7.5 -3 Q-7 -6 -5 -6 Z",
        far ? "#b4aa9d" : grad(c, -7, -6, 15, 7, [[0, "#fff5db"], [1, "#e0c29e"]]), ink, 1.5);
      paint(c, "M-5.5 -4 L-2 -2 L1 -3 Q1 0 4.5 1.2 L1 3.2 L-7.5 3.2 Z", far ? "#4f776e" : jade, null);
      paint(c, "M6 -1.2 Q11.5 -0.2 14 2.2 L7.5 2.5 Q5 1.2 6 -1.2 Z", far ? "#9c8e82" : sunAmber, null);
      paint(c, "M-7.5 3.2 Q3 4.2 12.5 2.6 Q16 2.2 16 4.4 Q14.8 6.8 10 7.1 L-5.5 7.1 Q-7.8 6.5 -7.5 3.2 Z",
        far ? "#9d9a94" : paper, ink, 0.85);
      paint(c, "M1.5 -2.2 L5.2 -3.2 M3.5 -0.4 L7.2 -1.4", null, rimGold, 0.95);
    });
  }

  function limbs(c, h, k, a, far) {
    if (painted?.limbs(c, h, k, a, far)) return;
    const path = new Path2D();
    path.moveTo(h[0] - 5.4, h[1] - 2);
    path.quadraticCurveTo(h[0] - 5.2, h[1] + 5.2, k[0] - 5.2, k[1] - 1);
    path.quadraticCurveTo(k[0] - 4.5, k[1] + 6, a[0] - 3.4, a[1] - 2.2);
    path.quadraticCurveTo(a[0] + 0.3, a[1], a[0] + 3.6, a[1] - 2.2);
    path.quadraticCurveTo(a[0] + 3.0, a[1] - 6, k[0] + 4.7, k[1] + 2);
    path.quadraticCurveTo(k[0] + 6.8, k[1] - 0.5, k[0] + 4.7, k[1] - 3.5);
    path.lineTo(h[0] + 5.7, h[1] - 2);
    path.closePath();
    paint(c, path, wash(c, h[1], a[1], far ? "#323d4c" : pantsMid, far ? "#262c38" : pantsDark), ink, 1.65);
    // Warm sunlit crease along front of trousers
    line(c, h[0] - 2.4, h[1] + 3, k[0] - 2.8, k[1] - 2, far ? "#4e5c6b" : "#879fad", 1.7);
    line(c, k[0] + 2.8, k[1] - 0.2, k[0] - 0.5, k[1] + 2.2, "#222935", 1.25);
    // Turned-up ankle cuff & cream sock
    line(c, a[0] - 3.1, a[1] - 4.2, a[0] + 3.2, a[1] - 3.8, far ? "#a69f92" : cream, 2.7);
  }

  function kneeFor(hip, foot, reach) {
    const dx = foot[0] - hip[0], dy = foot[1] - hip[1], d = Math.max(1, Math.hypot(dx, dy));
    const bend = Math.sqrt(Math.max(0, reach * reach - d * d / 4));
    return [(hip[0] + foot[0]) / 2 + dy / d * bend, (hip[1] + foot[1]) / 2 - dx / d * bend];
  }

  function arm(c, elbow, hand, female, far) {
    if (painted?.arm(c, elbow, hand, female, far)) return;
    const sx = far ? -1 : 6, sy = far ? -28 : -30;
    const sleeve = far ? (female ? "#b76d5d" : "#b89677") : (female ? "#eb9573" : "#ecc999");
    const hi = far ? "#d89c84" : (female ? "#ffd8ae" : "#fff1ca");
    pipe(c, elbow[0], elbow[1], hand[0], hand[1], far ? skinShad : skinMid, 5.1, far ? null : skinLit);
    pipe(c, sx, sy, elbow[0], elbow[1], sleeve, 8.8, hi);
    if (!far) {
      const dx = elbow[0] - sx, dy = elbow[1] - sy, d = Math.max(1, Math.hypot(dx, dy));
      const px = -dy / d * 3.3, py = dx / d * 3.3, cx = elbow[0] - dx / d * 1.8, cy = elbow[1] - dy / d * 1.8;
      line(c, cx - px, cy - py, cx + px, cy + py, female ? "#9c4e49" : jadeDark, 2.0);
    }
    ellipse(c, hand[0], hand[1], 3.5, 4.0, far ? skinShad : skinLit, ink, 1.2, -0.45);
  }

  function torso(c, female, elbow, hand, headTilt, t, bagSwing = 0) {
    transform(c, 0, 0, 1, bagSwing, () => layer(c, "courier-bag-v4", -50, -52, 48, 60, bag));
    layer(c, "courier-jacket-v4-" + female, -22, -50, 46, 58, b => jacket(b, female));
    painted?.straps(c);
    arm(c, elbow, hand, female, false);
    transform(c, 4, -57, 1, headTilt, () => {
      const blink = Math.max(0, 1 - Math.abs(((t + 1400) % 4200) - 2070) / 370);
      face(c, female, blink);
    });
  }

  /* ============================================================================
   * STRIDE-SYNCED WALKING ANIMATION
   * ============================================================================ */

  const cycleDistance = 64, stanceFraction = 0.56, walkers = new WeakMap();
  const smooth = u => u * u * (3 - 2 * u);

  function gaitClock(canvas, t, stride, moving, boost) {
    let state = walkers.get(canvas);
    const target = boost ? 1 : 0;
    if (!state || t < state.time) {
      state = { time: t, mix: target, distance: t * cycleDistance / (boost ? 640 : 950) };
      walkers.set(canvas, state);
    }
    const dt = Math.min(160, t - state.time);
    state.mix += (target - state.mix) * (1 - Math.exp(-dt / 110));
    if (Number.isFinite(stride)) state.distance = stride;
    else if (moving) state.distance += dt * cycleDistance / (950 - 310 * state.mix);
    state.time = t;
    return state;
  }

  function footAt(p, center, scale, energy) {
    const travel = cycleDistance * stanceFraction;
    let contactX = center + travel * 0.5 - cycleDistance * p, lift = 0, angle;
    if (p < stanceFraction) {
      const s = p / stanceFraction;
      const heel = Math.max(0, 1 - s / 0.24), toe = Math.max(0, (s - 0.73) / 0.27);
      angle = -0.19 * smooth(heel) + 0.34 * smooth(toe);
    } else {
      const u = (p - stanceFraction) / (1 - stanceFraction);
      contactX += cycleDistance * smooth(u);
      lift = (13 + energy * 5) * Math.pow(Math.sin(Math.PI * u), 1.45);
      angle = 0.34 * (1 - smooth(u)) - 0.19 * smooth(u) - 0.12 * Math.sin(Math.PI * u);
    }
    const pivotX = angle < 0 ? -4.5 : 10.5, soleY = 6.5;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    const ankle = [contactX + scale * (pivotX - pivotX * cos + soleY * sin), 143 - lift - scale * (pivotX * sin + soleY * cos)];
    return { ankle, angle, swing: (contactX - center) / (travel * 0.5) };
  }

  function walker(c, female, moving, boost, t, stride) {
    const { distance, mix } = gaitClock(c.canvas, t, stride, moving, boost);
    const p = ((distance / cycleDistance) % 1 + 1) % 1, hx = 88;
    const hy = moving ? 98.5 - 2.9 * (0.5 - 0.5 * Math.cos(2 * TAU * p)) : 96.8 + Math.sin(t / 820) * 0.6;
    const far = moving ? footAt((p + 0.5) % 1, hx - 2, 0.89, mix) : { ankle: [81.5, 137.2], angle: 0, swing: 0 };
    const near = moving ? footAt(p, hx + 1, 0.92, mix) : { ankle: [94, 137], angle: 0, swing: 0 };
    const hipFar = [hx - 4, hy - 0.5], hipNear = [hx + 2, hy];

    // Warm sunset dust puff behind heel when dashing
    if (moving && boost) {
      const puff = (t % 380) / 380;
      glow(c, hx - 20 - puff * 22, 137 - puff * 6, 8 * (1 - puff * 0.5), `rgba(255,222,165,${0.48 * (1 - puff)})`);
    }

    limbs(c, hipFar, kneeFor(hipFar, far.ankle, moving ? 21.8 : 20.8), far.ankle, true);
    sneaker(c, ...far.ankle, 0.89, far.angle, true);
    limbs(c, hipNear, kneeFor(hipNear, near.ankle, moving ? 22 : 20.7), near.ankle, false);
    sneaker(c, ...near.ankle, 0.92, near.angle, false);
    const swing = moving ? near.swing : 0;
    const lean = moving ? 0.042 + 0.052 * mix - 0.016 * swing : 0.014;
    transform(c, hx, hy, 1, lean, () => {
      arm(c, [6 + swing * 7, -18], [10 + swing * 14, -9 - Math.max(0, swing) * 7], female, true);
      const elbow = moving ? [5 - swing * 9, -17 - Math.abs(swing) * 1.5] : [6, -16];
      const hand = moving ? [9 - swing * 16, -7 - Math.max(0, -swing) * (12 + mix * 3)] : [8, -4];
      const recoil = moving ? Math.sin(2 * TAU * p - 0.7) * (0.014 + 0.009 * mix) : 0;
      torso(c, female, elbow, hand, moving ? -0.03 - 0.018 * Math.sin(p * TAU) : -0.035, t, recoil);
    });
  }

  /* ============================================================================
   * GOLDEN-HOUR PAINTERLY VEHICLES (8 TYPES)
   * ============================================================================ */

  function wheels(c, x, y, r, turn, motor = false, boost = false) {
    // Rich rubber tire with warm top sunset reflection
    ellipse(c, x, y, r, r, grad(c, x, y - r, x, y + r, [[0, "#4c4149"], [0.5, tireDark], [1, "#1e1a21"]]), ink, 1.8);
    ellipse(c, x, y, r - 2.3, r - 2.3, null, "#736368", 1.0);
    // Warm sunlit arc on upper tire edge
    c.beginPath(); c.arc(x, y, r - 1.2, -Math.PI * 0.85, -Math.PI * 0.2);
    c.strokeStyle = "rgba(255,220,158,0.45)"; c.lineWidth = 1.4; c.stroke();

    // Rim
    const rimR = r - (motor ? 5.2 : 4.2);
    ellipse(c, x, y, rimR, rimR, motor ? grad(c, x, y - rimR, x, y + rimR, [[0, "#ece7d4"], [1, "#8d9c99"]]) : "#e9e2ca", ink, 1.25);
    const inside = r - (motor ? 7.0 : 5.9);
    if (!motor) {
      c.save(); c.globalCompositeOperation = "destination-out";
      ellipse(c, x, y, inside, inside, "#000"); c.restore();
    } else {
      ellipse(c, x, y, inside, inside, grad(c, x, y - inside, x, y + inside, [[0, "#4e6265"], [1, "#2f3d42"]]), ink, 0.9);
    }

    // Spokes + motion gleam
    const n = motor ? 5 : 10;
    for (let i = 0; i < n; i++) {
      const a = i * TAU / n + turn;
      line(c, x, y, x + Math.cos(a) * inside, y + Math.sin(a) * inside, motor ? "#dde3d3" : "#cfd5c3", motor ? 2.6 : 0.9);
    }
    if (boost) {
      c.beginPath(); c.arc(x, y, inside * 0.72, turn, turn + 1.8);
      c.strokeStyle = "rgba(255,235,176,0.5)"; c.lineWidth = 2.0; c.stroke();
    }
    // Hubcap + brake disc gleam
    ellipse(c, x, y, motor ? 4.8 : 3.2, motor ? 4.8 : 3.2, brass, ink, 1.2);
    ellipse(c, x - 0.8, y - 0.8, motor ? 1.6 : 1.0, motor ? 1.6 : 1.0, rimGold);
    if (!motor) {
      const a = turn + 0.65;
      line(c, x + Math.cos(a) * inside * 0.56, y + Math.sin(a) * inside * 0.56, x + Math.cos(a) * inside * 0.84, y + Math.sin(a) * inside * 0.84, sunAmber, 2.3);
    }
  }

  function headlightBeam(c, x, y, length = 34, spread = 13) {
    const g = grad(c, x, y, x + length, y, [[0, "rgba(255,238,172,0.58)"], [1, "rgba(255,220,130,0)"]]);
    paint(c, `M${x} ${y - 3} L${x + length} ${y - spread} L${x + length} ${y + spread} L${x} ${y + 3} Z`, g, null);
  }

  function bike(c, electric, turn, boost = false) {
    if (painted?.vehicle(c, electric ? "ebike" : "bike", turn, false, false, 0, boost)) return;
    const body = electric ? jade : terracotta;
    const hi = electric ? paleMint : rimGold;
    const fender = electric ? jadeDark : "#9e4835";

    wheels(c, 39, 119, 24, turn, false, boost);
    wheels(c, 138, 119, 24, turn, false, boost);

    // Painted mudguard fenders matching sunset street bikes
    c.beginPath(); c.arc(39, 119, 26.5, Math.PI * 1.12, Math.PI * 1.72);
    c.strokeStyle = ink; c.lineWidth = 4.6; c.stroke();
    c.strokeStyle = fender; c.lineWidth = 2.5; c.stroke();
    c.beginPath(); c.arc(138, 119, 26.5, Math.PI * 1.22, Math.PI * 1.78);
    c.strokeStyle = ink; c.lineWidth = 4.6; c.stroke();
    c.strokeStyle = fender; c.lineWidth = 2.5; c.stroke();

    // Rear luggage rack (classic Korean delivery bike charm!)
    paint(c, "M22 86 L55 86 L50 92 L24 92 Z", warmWood, ink, 1.3);
    line(c, 28, 92, 39, 118, steel, 2.0);
    line(c, 48, 92, 42, 118, steel, 1.8);

    // Chain guard
    paint(c, "M38 118 Q59 113 79 111 Q88 112 88 120 Q87 126 77 126 L40 123 Q35 123 38 118 Z",
      grad(c, 38, 112, 88, 126, [[0, cream], [1, "#c8b396"]]), ink, 1.45);

    // Step-through steel frame with sunlit rim highlights
    pipe(c, 39, 118, 73, 84, body, 3.2, hi);
    pipe(c, 77, 119, 71, 82, body, 4.8, hi);
    paint(c, "M77 118 Q103 113 120 79", null, ink, 8.4);
    paint(c, "M77 118 Q103 113 120 79", null, body, 5.6);
    paint(c, "M79 115 Q102 110 118 81", null, hi, 1.5);
    paint(c, "M73 91 Q94 98 116 85", null, ink, 5.6);
    paint(c, "M73 91 Q94 98 116 85", null, electric ? mint : coral, 3.4);

    // Front fork, handlebars, wicker basket (regular) or battery & lamp (e-bike)
    pipe(c, 118, 77, 138, 119, chrome, 3.4, "#ffffff");
    pipe(c, 121, 85, 115, 65, body, 3.4, hi);
    paint(c, "M115 66 Q117 59 125 61 L131 61", null, ink, 3.6);
    line(c, 124, 61, 131, 61, darkWood, 3.3);
    line(c, 125, 60.2, 130, 60.2, warmWood, 1.1);

    // Cozy front basket on regular bike / glowing headlamp + battery pack on e-bike
    if (!electric) {
      paintTextured(c, "M127 72 L146 72 L143 87 L129 87 Z",
        grad(c, 127, 72, 146, 87, [[0, "#f2c683"], [1, "#b47240"]]), ink, 1.45);
      line(c, 129, 77, 145, 77, darkWood, 0.9);
      line(c, 130, 82, 144, 82, darkWood, 0.9);
      line(c, 134, 72, 135, 87, darkWood, 0.9);
      line(c, 140, 72, 140, 87, darkWood, 0.9);
    } else {
      // Integrated sleek e-bike frame battery with charge LEDs
      paintTextured(c, "M84 111 Q98 103 108 93 Q111 91 115 95 Q118 98 114 102 Q103 115 90 119 Q85 120 84 115 Z",
        grad(c, 84, 93, 115, 118, [[0, "#355d5b"], [1, "#1e3438"]]), ink, 1.5);
      line(c, 91, 111, 102, 102, "#8ff2c6", 2.1);
      // Bright headlamp + warm beam
      headlightBeam(c, 134, 74, 30, 11);
      ellipse(c, 129, 74, 5.2, 4.2, brass, ink, 1.2);
      ellipse(c, 132.5, 74, 2.2, 3.2, rimGold, null);
    }

    // Stitched leather saddle
    pipe(c, 71, 83, 69, 77, chrome, 2.6);
    paint(c, "M58 76 Q59 71 68 73 Q75 75 82 75 Q87 76 83 80 Q72 83 62 81 Q58 81 58 76 Z",
      grad(c, 58, 72, 84, 82, [[0, "#c88652"], [1, "#6f3f2a"]]), ink, 1.55);
    paint(c, "M62 74.5 Q69 75.5 78 76", null, rimGold, 1.1);

    // Crank & animated pedal
    ellipse(c, 78, 118, 6.6, 6.6, steel, ink, 1.25);
    ellipse(c, 78, 118, 2.6, 2.6, brass, ink, 0.9);
    const px = 78 + Math.cos(turn) * 10, py = 118 + Math.sin(turn) * 9;
    line(c, 78, 118, px, py, ink, 3.2);
    line(c, px - 4.5, py + 1, px + 4.5, py + 1, darkWood, 2.8);
  }

  function kickboard(c, turn, boost = false) {
    if (painted?.vehicle(c, "kickboard", turn, false, false, 0, boost)) return;
    wheels(c, 44, 131, 11.5, turn, true, boost);
    wheels(c, 130, 131, 11.5, turn, true, boost);

    // Glowing deck under-trim & sculpted aluminum footboard
    paintTextured(c, "M40 119 Q44 116 51 118 L100 118 Q108 118 113 108 L119 107 Q113 127 104 128 L50 128 Q42 127 40 123 Z",
      grad(c, 40, 108, 118, 128, [[0, "#83cfb2"], [0.55, jade], [1, jadeDark]]), ink, 2.0);
    paint(c, "M49 119.5 L99 119.5", null, rimGold, 2.0);
    paint(c, "M50 124 L98 124", null, "#2c3d40", 2.4);

    // Front suspension stem & terracotta accent collar
    pipe(c, 130, 130, 115, 55, chrome, 4.4, "#ffffff");
    pipe(c, 121, 86, 115, 55, terracotta, 5.8, sunPeach);
    // Digital dash display + ergonomic grips
    paint(c, "M103 55 Q113 52 125 54", null, ink, 5.8);
    line(c, 105, 54.5, 113, 53.8, darkWood, 2.6);
    ellipse(c, 116, 52.5, 4.2, 2.2, "#2f4448", ink, 1.0);
    // Warm headlight + beam & glowing red rear tail-lamp
    headlightBeam(c, 124, 64, 28, 10);
    ellipse(c, 120, 64, 4.2, 2.8, rimGold, ink, 1.1);
    paint(c, "M44 118 Q31 118 31 127", null, ink, 4.0);
    ellipse(c, 33, 121, 2.4, 2.4, "#ff7d61", ink, 0.8);
  }

  function motorcycle(c, sport, turn, boost = false) {
    if (painted?.vehicle(c, sport ? "sport" : "moto", turn, false, false, 0, boost)) return;
    wheels(c, 37, 120, 23, turn, true, boost);
    wheels(c, 141, 120, 23, turn, true, boost);

    // Swingarm & inverted gold/chrome front forks
    pipe(c, 36, 120, 80, 107, steel, 7.2, chrome);
    pipe(c, 126, 76, 141, 120, sport ? brass : chrome, 6.2, rimGold);

    // Front fender
    paint(c, "M116 108 Q138 87 158 109 Q160 113 156 114 Q139 103 120 113 Z",
      sport ? grad(c, 116, 90, 158, 114, [[0, "#f78d6e"], [1, "#a63a35"]])
            : grad(c, 116, 90, 158, 114, [[0, "#9be0be"], [1, jade]]), ink, 1.75);

    if (sport) {
      // Sculpted sunset-crimson & pearl-cream café/sport superbike
      paintTextured(c, "M15 84 Q27 79 49 82 L68 84 Q74 75 86 75 Q99 73 109 80 Q118 78 124 65 Q138 67 146 78 Q146 88 130 95 L111 119 Q96 129 77 121 L48 98 Q29 90 16 90 Z",
        grad(c, 16, 65, 145, 126, [[0, "#ffb184"], [0.28, "#e6614c"], [0.7, "#b6383c"], [1, "#6e2531"]]), ink, 2.0);
      // Side fairing panel + warm golden speed stripe
      paint(c, "M92 106 Q110 93 134 86 Q128 97 116 106 L104 119 Q96 123 82 115 Z",
        grad(c, 84, 86, 134, 120, [[0, "#fff2d0"], [1, "#d9b48a"]]), ink, 1.45);
      paint(c, "M102 102 Q117 94 128 93 L117 101 L104 107 Z", rimGold, null);
      // Exposed metallic engine block
      paint(c, "M64 98 Q84 97 97 106 L90 119 Q74 120 64 111 Z",
        grad(c, 64, 98, 96, 119, [[0, "#75888d"], [1, "#39444a"]]), ink, 1.5);
      line(c, 70, 105, 89, 107, chrome, 1.2);
      line(c, 70, 110, 87, 112, chrome, 1.2);
      // Tinted windscreen with sunset sky reflection
      paint(c, "M115 76 Q126 66 122 53 Q133 55 141 72 L137 76 Z",
        grad(c, 116, 53, 141, 76, [[0, "#ffe4b2"], [0.45, "#9dc8c5"], [1, "#4b6b73"]]), ink, 1.65);
      paint(c, "M122 63 L127 69 M128 58 L133 67", null, paper, 1.25);
      // Twin glowing headlights + beam
      headlightBeam(c, 143, 81, 40, 15);
      paint(c, "M135 76 L145 77 L141 85 L130 85 Z", rimGold, ink, 1.25);
      // Sunset highlight along fuel tank
      paint(c, "M76 77 Q92 75 106 81", null, rimGold, 2.0);
    } else {
      // Cozy retro-Korean cream & mint delivery scooter with warm brass headlamp
      paintTextured(c, "M13 104 C15 88 28 79 49 79 Q62 79 72 86 Q76 96 80 105 Q83 108 97 107 Q104 103 111 78 L115 65 Q121 58 130 66 Q135 71 132 80 Q125 94 123 110 Q120 118 108 120 L75 119 Q65 117 57 105 Q44 95 26 102 L18 107 Q14 109 13 104 Z",
        grad(c, 14, 60, 134, 120, [[0, "#d7f0cb"], [0.35, "#7fc7a8"], [0.75, "#3e8b79"], [1, "#22584f"]]), ink, 2.0);
      // Cream retro side cowling + chrome vents
      paint(c, "M20 99 Q29 86 46 86 Q59 86 63 94 Q59 100 51 103 Q36 98 23 104 Z",
        grad(c, 22, 86, 62, 104, [[0, "#fff5db"], [1, "#d9c29e"]]), ink, 1.3);
      paint(c, "M28 94 Q36 90 44 91 M29 98 Q36 94 42 94", null, jadeDark, 1.25);
      paint(c, "M106 105 Q113 94 117 74", null, rimGold, 2.4);
      // Round glowing brass headlight + warm beam
      headlightBeam(c, 135, 67, 36, 13);
      ellipse(c, 129, 67, 7.2, 6.0, brass, ink, 1.5);
      ellipse(c, 131, 67, 4.5, 4.4, rimGold, null);
      ellipse(c, 132, 65.5, 2.2, 1.8, "#ffffff", null);
      // Rear insulated courier box in warm cream & jade
      paintTextured(c, "M14 58 Q14 54 18 54 L43 54 Q47 54 47 59 L47 79 L14 79 Z",
        grad(c, 14, 54, 47, 79, [[0, "#fff4d6"], [0.55, "#ead2aa"], [1, "#c7a47c"]]), ink, 1.7);
      paint(c, "M14 62 L47 62", null, jade, 2.6);
      paint(c, "M17 56 L44 56", null, rimGold, 1.4);
      leaves(c, 30.5, 70.5, 0.48, jade);
    }

    // Stitched leather seat
    paint(c, "M41 80 Q44 75 53 76 L74 76 Q79 77 77 82 Q68 86 56 84 L43 84 Q38 84 41 80 Z",
      grad(c, 40, 75, 78, 85, [[0, "#a86843"], [1, "#5c3324"]]), ink, 1.65);
    // Chrome muffler exhaust
    paint(c, "M16 108 L49 114 Q55 116 52 120 L47 122 L16 116 Q12 114 16 108 Z",
      grad(c, 16, 108, 52, 122, [[0, chrome], [0.5, steel], [1, "#546368"]]), ink, 1.6);
    line(c, 20, 111, 47, 116, "#ffffff", 1.3);
    // Handlebar mirror + red taillight
    line(c, 119, 70, 111, 65, ink, 3.2);
    line(c, 109, 65, 115, 66, darkWood, 2.2);
    ellipse(c, 20, 87, 4.0, 2.7, "#ff785c", ink, 1.0);
    if (boost) glow(c, 12, 112, 10, "rgba(255,214,138,0.55)");
  }

  function riding(c, female, v, moving, boost, t) {
    const motor = v === "moto" || v === "sport", kick = v === "kickboard";
    const turn = moving ? t / (boost ? 78 : 140) : -0.28;
    const bump = moving ? Math.sin(t / 165) * (boost ? 1.15 : 0.75) : Math.sin(t / 830) * 0.28;
    const pitch = moving && boost ? -0.028 : 0;

    transform(c, 90, 130, 1, pitch, () => {
      transform(c, -90, -130, 1, 0, () => {
        const pose = painted?.rides[v];
        const hx = pose?.seat[0] ?? 76, hy = (pose?.seat[1] ?? (kick ? 79 : 85)) + bump * (kick ? 0.35 : 1);
        const sc = kick ? 0.84 : 0.86, lean = kick ? 0.015 : v === "sport" ? 0.25 : motor ? 0.12 : 0.16;
        const hFar = [hx - 4, hy], hNear = [hx + 2, hy + 1];
        const axle = pose?.axle || [78, 118], pedal = [Math.cos(turn) * 10, Math.sin(turn) * 9];
        const farFoot = kick || motor ? (pose?.feet[0] || (kick ? [64,118] : [82,106])) : [axle[0] - pedal[0] - 6, axle[1] - pedal[1] - 5.1];
        const nearFoot = kick || motor ? (pose?.feet[1] || (kick ? [83,118] : [94,109])) : [axle[0] + pedal[0] - 6.5, axle[1] + pedal[1] - 5.5];

        // A standing scooter stance needs only a soft knee bend, unlike a
        // seated rider's bent cycling legs. Keep both soles on the deck.
        const knee = (hip,foot) => kick
          ? [(hip[0]+foot[0])/2+2,(hip[1]+foot[1])/2]
          : kneeFor(hip,foot,23);
        limbs(c, hFar, knee(hFar, farFoot), farFoot, true);
        sneaker(c, ...farFoot, 0.77, -0.06, true);

        // The opposite leg belongs behind the frame and drivetrain.
        if (kick) kickboard(c, turn, boost);
        else if (motor) motorcycle(c, v === "sport", turn, boost);
        else bike(c, v === "ebike", turn, boost);

        limbs(c, hNear, knee(hNear, nearFoot), nearFoot, false);
        sneaker(c, ...nearFoot, 0.83, -0.04, false);

        const grip = pose?.grip || (kick ? [117, 55] : motor ? [113, 66] : [128, 62]);
        const dx = (grip[0] - hx) / sc, dy = (grip[1] - hy) / sc;
        const hand = [dx * Math.cos(lean) + dy * Math.sin(lean), -dx * Math.sin(lean) + dy * Math.cos(lean)];
        const elbow = kick
          ? [(hand[0]-8)/2,(hand[1]-33)/2+2.5]
          : [hand[0] * 0.49 + 3, hand[1] * 0.44 - 9];
        transform(c, hx, hy, sc, lean, () => torso(c, female, elbow, hand, -lean * 0.65, t));
      });
    });
  }

  function car(c, female, turn, occupied, t, boost = false) {
    if (painted?.vehicle(c, "car", turn, female, occupied, t, boost)) return;
    const bounce = occupied ? Math.sin(t / 145) * (boost ? 1.0 : 0.45) : 0;
    wheels(c, 43, 121, 19, turn, true, boost);
    wheels(c, 136, 121, 19, turn, true, boost);

    transform(c, 0, bounce, 1, 0, () => {
      // Glowing roof delivery sign lamp!
      paint(c, "M66 47 Q67 38 74 37 L92 37 Q99 38 100 47 Z",
        grad(c, 66, 37, 100, 47, [[0, "#fff8d6"], [1, "#f2b857"]]), ink, 1.5);
      leaves(c, 83, 42.5, 0.36, jade);

      // Cozy golden-hour terracotta-coral & cream kei hatchback (matching parking.webp's car aesthetic!)
      paintTextured(c, "M8 99 Q8 89 21 84 L31 72 Q41 53 54 49 Q66 45 91 46 Q109 46 122 60 L138 78 Q161 80 170 90 Q175 98 172 111 L168 118 Q162 123 156 122 Q153 102 138 101 Q120 99 116 123 L63 123 Q60 102 45 100 Q28 100 23 120 Q10 120 8 113 Z",
        grad(c, 10, 46, 172, 123, [[0, "#ffc28d"], [0.3, "#e88463"], [0.72, "#c65b4a"], [1, "#85383c"]]), ink, 2.2);

      // Two-tone warm cream roof
      paintTextured(c, "M30 75 Q40 54 55 50 Q70 45 92 48 Q110 49 121 62 L136 79 L29 80 Z",
        grad(c, 30, 46, 136, 80, [[0, "#fff8e2"], [1, "#e5cba2"]]), ink, 1.45);
      paint(c, "M48 50 Q72 46 105 51", null, rimGold, 1.8);

      // Windows with warm sunset sky gradient reflection
      paint(c, "M33 77 Q41 58 55 54 Q63 51 71 52 L70 77 Z",
        grad(c, 33, 52, 71, 77, [[0, "#ffe4b5"], [0.45, "#a6cfc5"], [1, "#557d7d"]]), ink, 1.55);
      paint(c, "M76 52 Q95 50 106 56 Q117 62 129 78 L76 77 Z",
        grad(c, 76, 51, 129, 78, [[0, "#ffe8be"], [0.42, "#a2cbc2"], [1, "#4e7576"]]), ink, 1.55);

      // Driver visible inside cabin
      c.save();
      c.clip(getPath("M76 52 Q95 50 106 56 Q117 62 129 78 L76 77 Z"));
      if (occupied) {
        paint(c, "M88 82 Q89 69 99 70 Q110 69 113 81 Z", female ? coral : cream, ink, 1.3);
        transform(c, 99, 65, 0.44, -0.035, () => face(c, female, 0));
      }
      // Diagonal sunset reflection streaks on glass
      paint(c, "M111 58 L123 76 M116 62 L125 74", null, "rgba(255,248,225,0.68)", 1.8);
      c.restore();

      // Delivery bag visible through back window
      paint(c, "M41 69 Q41 67 45 67 L61 67 Q64 67 64 70 L64 76 L40 76 Z", jade, ink, 1.1);
      paint(c, "M39 70.5 L64 70.5", null, rimGold, 1.0);

      // Sculpted body beltline, chrome door handle, wheel arches
      paint(c, "M11 95 Q41 81 76 83 Q113 83 155 84", null, rimGold, 2.2);
      paint(c, "M73 83 L72 107 Q72 114 79 114 L107 114 Q113 110 116 100", null, "#8a423e", 1.25);
      paint(c, "M64 119 Q91 121 116 118", null, "#793538", 2.2);
      paint(c, "M22 111 Q31 97 43 97 Q54 97 62 107 M118 108 Q125 98 137 98 Q150 99 157 110", null, "#793538", 1.4);

      // Glowing headlights + warm light cone & tail lamp
      headlightBeam(c, 170, 94, 42, 16);
      paint(c, "M160 89 Q171 91 170 98 Q163 102 155 98 Q153 93 160 89 Z", rimGold, ink, 1.35);
      paint(c, "M10 94 Q13 92 18 92 L17 102 L10 104 Z", "#ff6d52", ink, 1.2);
      paint(c, "M156 111 Q165 112 173 108 L172 115 Q168 119 158 118 Z", chrome, ink, 1.25);
      line(c, 78, 88, 86, 88, chrome, 2.6);
      ellipse(c, 124, 78, 5.2, 3.0, "#e28868", ink, 1.15);

      // Circular door emblem
      ellipse(c, 94, 101, 8.6, 8.6, cream, brass, 1.2);
      leaves(c, 94, 100.8, 0.6, jade);
    });
  }

  function rocket(c, female, t, occupied, boost) {
    if (painted?.vehicle(c, "rocket", 0, female, occupied, t, boost)) return;
    const pulse = Math.sin(t / 85) * 0.5 + 0.5, flame = boost ? 1.32 : 0.82;
    // Multi-layered warm plasma thruster plume + glowing embers
    transform(c, 43, 99, 1, 0, () => {
      c.save(); c.scale(flame * (0.86 + 0.14 * pulse), 1);
      glow(c, -12, 0, 22, "rgba(255,196,95,0.45)");
      paint(c, "M0 -10 Q-12 -14 -24 -8 Q-15 -4 -20 -3 Q-35 -2 -46 2 Q-28 2 -21 7 Q-14 11 -2 9 Z",
        grad(c, 0, 0, -45, 0, [[0, "#fff0a6"], [0.4, "#ff974d"], [1, "#d94b3d"]]), "#8c3b36", 1.3);
      paint(c, "M-1 -5 Q-10 -7 -18 -3 Q-10 -2 -25 2 Q-9 1 -3 5 Z", "#fffbe0", null);
      c.restore();
    });

    // Upper sage-jade tail fin with brass rivets
    paintTextured(c, "M58 86 Q50 71 41 62 Q43 52 54 57 Q71 60 85 80 Z",
      grad(c, 42, 54, 84, 85, [[0, "#8ed8b8"], [0.5, jade], [1, jadeDark]]), ink, 1.9);
    paint(c, "M45 60 Q56 63 67 73", null, rimGold, 1.5);

    // Sculpted Ghibli retro-cream fuselage bathed in sunset glow
    paintTextured(c, "M44 87 C75 69 133 69 166 87 Q178 94 178 99 Q173 108 152 113 Q124 121 68 115 L45 109 Q41 101 44 87 Z",
      grad(c, 44, 70, 176, 118, [[0, "#fff9e5"], [0.35, "#f5d9ac"], [0.75, "#d8a87e"], [1, "#9a6c58"]]), ink, 2.1);
    paint(c, "M66 77 Q108 73 145 83", null, "#ffffff", 2.0);

    // Nose cone in burnished terracotta-crimson & gold ring
    paintTextured(c, "M138 78 Q161 83 174 93 Q179 97 175 103 Q169 109 152 112 Q159 94 138 78 Z",
      grad(c, 140, 78, 176, 112, [[0, "#ffb885"], [0.45, terracotta], [1, "#8c3534"]]), ink, 1.5);
    paint(c, "M151 84 Q162 88 167 93", null, rimGold, 2.0);
    // Brass band & exhaust nozzle
    paint(c, "M43 87 Q48 84 54 85 Q51 98 56 111 Q49 113 43 109 Q38 98 43 87 Z",
      grad(c, 42, 84, 54, 112, [[0, brass], [0.5, "#9c6d41"], [1, "#5c3f2e"]]), ink, 1.6);
    paint(c, "M76 107 Q68 120 55 130 Q68 134 77 130 Q92 123 100 110 Z",
      grad(c, 55, 108, 98, 132, [[0, "#85cfa9"], [1, jadeDark]]), ink, 1.75);
    paint(c, "M68 125 Q81 119 88 112", null, rimGold, 1.5);

    // Glass dome cockpit with warm sunset cloud reflections + smiling rider
    paint(c, "M73 79 Q77 64 89 56 Q101 50 112 57 Q121 63 127 78 Q101 84 73 82 Z",
      grad(c, 74, 52, 126, 82, [[0, "#ffedc4"], [0.45, "#a9d4cc"], [1, "#4f7a7c"]]), ink, 1.85);
    c.save();
    c.clip(getPath("M76 80 Q79 65 91 58 Q102 53 111 59 Q121 65 124 78 Q101 82 76 80 Z"));
    if (occupied) {
      paint(c, "M88 86 Q87 72 99 71 Q108 72 111 84 Z", female ? coral : cream, ink, 1.25);
      transform(c, 99, 71, 0.54, 0, () => face(c, female, 0));
    }
    c.restore();
    paint(c, "M79 73 Q83 64 90 61 M83 74 L86 70", null, "#fffef4", 1.9);
    paint(c, "M72 81 Q101 84 127 78", null, brass, 2.7);
    paint(c, "M72 81 Q101 84 127 78", null, ink, 1.1);

    // Circular courier emblem + brass rivets
    ellipse(c, 109, 97, 9.2, 9.2, jade, brass, 1.4);
    leaves(c, 109, 96.5, 0.64, rimGold);
    ellipse(c, 64, 99, 2.3, 2.3, brass, ink, 0.9);
    ellipse(c, 72, 100, 1.6, 1.6, brass, ink, 0.7);
  }

  function garageShoe(c) {
    transform(c, 84, 86, 1.08, -0.07, () => {
      paintTextured(c, "M-41 -4 Q-35 -14 -32 -26 Q-28 -33 -20 -25 Q-11 -16 -2 -21 L10 -29 Q15 -32 19 -26 Q20 -17 30 -11 Q39 -6 47 -4 Q58 0 59 8 Q59 17 46 18 L-35 18 Q-47 17 -47 8 Q-47 0 -41 -4 Z",
        grad(c, -45, -30, 58, 18, [[0, "#fff6de"], [0.55, "#ebd0a6"], [1, "#c49c78"]]), ink, 2.2);
      paint(c, "M-35 -16 Q-36 -7 -44 1 L-45 8 Q-27 11 -16 6 L-7 1 Q-22 -1 -25 -13 Z",
        grad(c, -45, -15, -7, 10, [[0, "#7bc7a8"], [1, jadeDark]]), ink, 1.5);
      paint(c, "M-18 -9 Q-7 -5 -1 -10 L7 -19 Q9 -20 12 -16 Q7 -8 -1 -2 Q-9 4 -17 3 Z", terracotta, ink, 1.0);
      paint(c, "M15 -17 Q26 -5 42 -3 Q34 0 30 7", null, "#b47c5c", 1.4);
      paint(c, "M-46 8 Q-12 12 20 9 Q45 8 57 4 Q62 12 53 16 Q38 20 -32 19 Q-47 19 -46 8 Z",
        grad(c, -46, 5, 60, 19, [[0, paper], [1, "#d9ccb4"]]), ink, 1.65);
      paint(c, "M-34 15 Q-4 17 26 14", null, brass, 1.5);
      paint(c, "M4 -18 L14 -21 M9 -14 L19 -17 M14 -10 L24 -13", null, rimGold, 2.2);
      paint(c, "M-26 -24 Q-16 -20 -8 -21", null, rimGold, 1.5);
    });
  }

  /* ============================================================================
   * 20 GOLDEN-HOUR PAINTERLY DELIVERY FOODS (Harmonized with shop.webp!)
   * Logical canvas: 96 x 88, cached at 3x resolution for silky performance
   * ============================================================================ */

  const fInk = "#472c28";

  function plateShadow(c, x, y, rx, ry) {
    ellipse(c, x, y, rx, ry, light(c, x, y, rx, [[0, "rgba(74,40,36,0.28)"], [1, "rgba(74,40,36,0)"]]));
  }

  function steam(c, points) {
    for (const [x, y, h] of points) {
      paint(c, `M${x} ${y} Q${x - 4} ${y - h * 0.45} ${x + 1} ${y - h * 0.72} T${x - 1} ${y - h}`, null, "rgba(255,248,230,0.78)", 2.2);
    }
  }

  function food_burger(c) {
    plateShadow(c, 48, 76, 36, 9);
    // Warm glazed lower bun
    paintTextured(c, "M12 56 Q11 63 17 69 Q24 76 48 76 Q72 76 79 69 Q84 63 82 56 Z",
      grad(c, 12, 56, 82, 76, [[0, "#f5be6b"], [1, "#bd7238"]]), fInk, 2.0);
    // Juicy seared beef patty with char marks
    paintTextured(c, "M11 48 C15 42 28 43 35 44 Q52 40 68 44 Q82 43 85 51 C88 58 80 62 72 61 Q58 65 44 62 Q28 65 16 61 Q7 60 9 53 Z",
      grad(c, 10, 42, 85, 64, [[0, "#8f4a35"], [0.5, "#673026"], [1, "#451e1c"]]), fInk, 2.1);
    paint(c, "M18 53 Q23 50 28 52 M36 56 L42 55 M62 54 Q67 51 73 53", null, "#ba7850", 1.7);
    // Melted cheddar cheese waterfall
    paint(c, "M11 45 Q32 41 50 43 L82 44 L79 51 Q69 52 63 58 Q60 60 56 56 L50 53 L34 59 Q31 60 28 56 L23 52 L13 52 Z",
      grad(c, 12, 42, 80, 60, [[0, "#ffe074"], [0.6, "#f5a638"], [1, "#d97a26"]]), fInk, 1.5);
    // Juicy ruby tomato slice
    paint(c, "M13 42 Q15 37 23 37 L73 37 Q81 37 82 42 Q82 47 74 48 L22 48 Q13 47 13 42 Z",
      grad(c, 14, 37, 82, 48, [[0, "#f26c4f"], [1, "#b8362e"]]), fInk, 1.45);
    // Crisp ruffled sunlit lettuce
    paint(c, "M10 37 Q17 31 24 35 Q31 30 39 34 Q48 30 55 34 Q63 30 70 34 Q78 30 85 36 Q90 41 84 44 Q79 47 72 43 Q66 42 62 46 Q56 49 51 44 Q46 41 41 45 Q34 49 28 44 Q22 41 18 45 Q14 48 10 44 Q6 42 10 37 Z",
      grad(c, 10, 31, 86, 48, [[0, "#a9d672"], [0.6, "#659b52"], [1, "#3f6e42"]]), "#385b3a", 1.5);
    // Glossy domed brioche bun bathed in sunset gold
    paintTextured(c, "M11 35 C12 18 26 7 47 6 Q70 4 82 23 Q86 29 85 36 Q82 41 72 41 Q44 44 15 39 Q10 39 11 35 Z",
      light(c, 34, 15, 58, [[0, "#ffeaad"], [0.35, "#f5b864"], [0.78, "#cf7a3b"], [1, "#9a4e2c"]]), fInk, 2.0);
    paint(c, "M18 28 Q26 13 44 11", null, "#fff5cc", 3.0);
    for (const [x, y, a] of [[27, 25, -0.5], [35, 16, -0.45], [47, 12, -0.1], [59, 16, 0.35], [69, 23, 0.55], [44, 27, 0.15], [76, 30, 0.6], [56, 29, -0.2]]) {
      ellipse(c, x, y, 2.5, 1.0, cream, "#b87942", 0.5, a);
    }
  }

  function food_pizza(c) {
    plateShadow(c, 48, 72, 38, 11);
    // Round rustic wooden pizza peel
    ellipse(c, 48, 52, 41, 24, grad(c, 10, 30, 86, 74, [[0, "#deb074"], [1, "#8d5432"]]), fInk, 1.9);
    ellipse(c, 48, 50, 36, 20, grad(c, 14, 32, 82, 68, [[0, "#f2c683"], [1, "#b4723f"]]), "#754328", 1.1);
    // Blistered golden crust
    ellipse(c, 48, 48, 34, 18.5, grad(c, 18, 30, 78, 66, [[0, "#f8cb7e"], [0.6, "#da8b43"], [1, "#9f552b"]]), fInk, 1.8);
    // Tomato sauce + bubbling melted mozzarella
    ellipse(c, 48, 48, 28, 14.5, "#cf4c36", null);
    ellipse(c, 48, 47.5, 26.5, 13.5, grad(c, 24, 34, 72, 60, [[0, "#fff0a6"], [0.55, "#f7c459"], [1, "#df9638"]]), "#bd6b2d", 1.0);
    // Slice score lines
    line(c, 22, 48, 74, 48, "rgba(145,65,36,0.45)", 1.0);
    line(c, 48, 34, 48, 61, "rgba(145,65,36,0.45)", 1.0);
    line(c, 30, 38, 66, 58, "rgba(145,65,36,0.35)", 0.9);
    line(c, 66, 38, 30, 58, "rgba(145,65,36,0.35)", 0.9);
    // Glossy curled pepperoni cups
    for (const [x, y, rx] of [[34, 42, 6.2], [56, 40, 6.5], [47, 51, 6.8], [64, 51, 5.8], [32, 53, 5.6]]) {
      ellipse(c, x, y, rx, rx * 0.62, grad(c, x - 2, y - 2, x + 4, y + 4, [[0, "#e65e45"], [0.7, "#b6322b"], [1, "#7d2122"]]), "#6b2321", 1.1);
      ellipse(c, x - 1.5, y - 1, 1.8, 0.9, "#ffb08a");
    }
    // Fresh emerald basil leaves
    for (const [x, y, a] of [[45, 41, -0.4], [55, 55, 0.5], [39, 50, 0.3], [60, 44, -0.6]]) {
      ellipse(c, x, y, 4.2, 2.2, "#599c52", "#2f5734", 0.9, a);
    }
    steam(c, [[34, 24, 15], [52, 20, 17], [66, 25, 13]]);
  }

  function food_chicken(c) {
    plateShadow(c, 48, 78, 32, 8);
    // Drumstick bone sticking out top right
    paint(c, "M58 28 L71 15 Q69 10 73 8 Q78 6 80 11 Q84 8 87 12 Q89 18 82 20 L68 34 Z", cream, fInk, 1.6);
    // Crispy golden-amber fried chicken pile
    for (const [d, col] of [
      ["M46 43 C36 35 42 20 51 19 Q55 13 61 17 Q68 15 72 22 Q76 30 68 38 Q62 48 52 47 Z", "#d8873c"],
      ["M14 52 Q6 44 13 35 Q12 27 20 25 Q24 17 31 20 Q36 16 42 24 Q50 28 46 38 Q49 50 35 55 Z", "#e69a47"],
      ["M41 51 Q32 43 37 35 Q35 28 45 25 Q53 22 59 29 Q69 29 70 40 Q81 39 84 47 L79 57 Z", "#eba651"]
    ]) {
      paintTextured(c, d, grad(c, 20, 16, 75, 56, [[0, "#ffd078"], [0.45, col], [1, "#9a4f28"]]), fInk, 1.8);
    }
    // Crispy batter sunset highlights
    paint(c, "M18 35 Q21 28 28 29 M28 24 Q32 23 36 27 M47 34 Q50 30 54 31 M55 21 Q60 20 63 23 M61 28 L66 29", null, rimGold, 2.5);
    // Vintage cream & terracotta striped paper chicken bucket
    paintTextured(c, "M10 46 Q29 53 48 50 Q71 52 86 45 L79 69 C76 76 67 80 48 80 Q23 79 18 72 Z",
      grad(c, 12, 46, 84, 80, [[0, "#fff4d9"], [0.6, "#efd0a8"], [1, "#c89c74"]]), fInk, 1.95);
    paint(c, "M17 50 L25 52 L32 77 L26 75 Z M36 53 L45 53 L49 79 L41 78 Z M60 53 L69 51 L67 76 L58 78 Z", terracotta, null);
    paint(c, "M11 46 Q30 53 48 50 Q70 51 86 45", null, fInk, 2.5);
    ellipse(c, 48, 65, 9.5, 7.5, cream, brass, 1.1);
    leaves(c, 48, 64.8, 0.54, terracotta);
    steam(c, [[30, 15, 11], [48, 12, 12]]);
  }

  function food_noodles(c) {
    plateShadow(c, 48, 78, 32, 8);
    // Chopsticks resting across bowl
    pipe(c, 38, 43, 72, 7, warmWood, 2.2, rimGold);
    pipe(c, 50, 41, 84, 12, "#c68952", 2.2, rimGold);
    // Warm glazed stoneware noodle bowl
    paintTextured(c, "M8 40 Q15 27 48 28 Q78 27 89 39 L86 48 Q80 67 63 74 L60 79 Q49 82 35 79 L34 75 Q14 68 8 47 Z",
      grad(c, 10, 30, 88, 79, [[0, "#fff5db"], [0.55, "#e4cfb0"], [1, "#b4967c"]]), fInk, 2.0);
    // Golden anchovy broth
    ellipse(c, 48.5, 40, 39.5, 11.8, grad(c, 12, 30, 85, 50, [[0, "#eab05d"], [0.6, "#c67e3e"], [1, "#9a572c"]]), fInk, 1.6);
    c.save();
    c.clip(getPath("M10 40 Q15 30 48 30 Q77 29 87 40 Q83 49 48 50 Q15 49 10 40 Z"));
    // Silky swirling somyeon noodles
    for (const [x, y] of [[12, 37], [28, 34], [46, 34], [20, 43], [39, 41], [58, 39]]) {
      transform(c, x, y, 1.15, 0, () => paint(c, "M0 3 Q4 -2 9 1 T18 1 Q23 -1 24 2", null, "#fff0bd", 2.5));
    }
    // Egg jidan, zucchini, roasted gim, scallions
    paint(c, "M22 36 L34 39 L32 42 L20 39 Z", "#f7cc5c", "#b5852e", 0.7);
    paint(c, "M56 33 L68 38 L66 41 L54 36 Z", "#7bb569", "#477341", 0.7);
    paint(c, "M40 34 Q46 31 53 35 Q48 40 41 39 Z", "#352e31", null);
    for (const [x, y] of [[24, 43], [36, 46], [52, 43], [68, 42]]) ellipse(c, x, y, 2.8, 1.4, "#7cc073", jadeDark, 0.9, -0.3);
    c.restore();
    // Bowl rim & traditional jade ceramic stripe
    paint(c, "M9 40 Q19 50 48 51 Q76 51 88 40", null, cream, 2.3);
    paint(c, "M15 53 Q47 70 81 52", null, jade, 3.8);
    paint(c, "M22 60 Q48 73 74 61", null, brass, 1.6);
    steam(c, [[28, 22, 16], [44, 18, 18]]);
  }

  function food_sushi(c) {
    plateShadow(c, 48, 74, 40, 10);
    // Warm cypress wooden sushi geta board
    paintTextured(c, "M6 54 L31 32 Q35 29 41 30 L81 34 Q86 34 89 39 L92 49 Q92 53 87 57 L64 73 Q58 78 51 77 L14 71 Q8 69 7 65 Z",
      grad(c, 10, 32, 88, 76, [[0, "#f0c584"], [0.6, "#c78b50"], [1, "#87512f"]]), fInk, 1.85);
    paint(c, "M8 54 L34 34 Q38 32 43 33 L82 37 Q86 37 86 41 Q83 47 60 63 Q55 68 49 67 L13 61 Q7 59 8 54 Z",
      grad(c, 12, 34, 84, 66, [[0, "#fae0a8"], [1, "#d9a263"]]), "#8f5932", 1.15);

    // 3 pieces of nigiri: Salmon, Tuna, Tamago!
    const pieces = [
      { x: 46, y: 17, a: -0.07, top: ["#ff9d73", "#df5f43"], stripes: "#ffe3be", nori: false },
      { x: 16, y: 31, a: -0.1, top: ["#e3564c", "#9e292b"], stripes: "#ff9e8a", nori: false },
      { x: 43, y: 36, a: -0.08, top: ["#ffe078", "#e5a33c"], stripes: "#fff6c2", nori: true }
    ];
    for (const p of pieces) {
      transform(c, p.x, p.y, 0.96, p.a, () => {
        paint(c, "M0 12 Q1 4 9 4 Q14 1 23 6 Q28 9 29 16 Q28 23 20 25 Q13 27 3 22 Q-2 20 0 12 Z", cream, fInk, 1.6);
        paint(c, "M-2 12 Q1 4 9 1 Q15 -4 26 4 Q32 7 29 13 Q26 18 18 17 Q10 15 3 18 Q-0.4 19 -2 16 Z",
          grad(c, 0, -2, 28, 18, [[0, p.top[0]], [1, p.top[1]]]), fInk, 1.6);
        paint(c, "M4 8 Q11 8 17 15 M11 3 Q18 5 25 13", null, p.stripes, 2.0);
        if (p.nori) paint(c, "M10 1 L17 2 L16 25 L9 24 Z", "#2e3d35", fInk, 1.0);
      });
    }
    // Wasabi & pickled ginger
    paint(c, "M70 50 Q69 44 74 44 Q75 39 80 42 Q85 41 84 46 Q88 48 84 52 Q78 54 70 50 Z", "#98bf6a", "#567844", 1.1);
    ellipse(c, 22, 60, 6.5, 3.6, "#f7b5a1", "#b86b5c", 0.9, -0.2);
  }

  function food_tteokbokki(c) {
    plateShadow(c, 48, 78, 33, 8);
    pipe(c, 48, 48, 76, 8, warmWood, 2.3, rimGold);
    // Warm terracotta-cream ceramic bowl
    paintTextured(c, "M9 40 Q16 28 48 28 Q79 28 88 40 L83 56 Q77 73 64 78 Q46 83 28 74 Q15 69 10 50 Z",
      grad(c, 10, 30, 86, 80, [[0, "#ffe4c2"], [0.5, "#e69f7b"], [1, "#b45e4a"]]), fInk, 2.0);
    // Glossy spicy red gochujang sauce
    ellipse(c, 48, 40.5, 39, 12.5, grad(c, 14, 30, 82, 52, [[0, "#e64a33"], [0.6, "#b82d24"], [1, "#7d1d1c"]]), fInk, 1.6);
    // Plump chewy rice cakes + fish cakes + half boiled egg
    for (const [x, y, a] of [[18, 40, -0.4], [32, 35, -0.2], [43, 43, -0.45], [57, 33, -0.15], [64, 43, -0.5]]) {
      transform(c, x, y, 1.15, a, () => {
        paint(c, "M0 0 Q-1 -3.5 3 -4.5 L12 -4.5 Q16 -4.5 16 0 Q16 3.5 12 4.5 L3 4.5 Q0 4.5 0 0 Z",
          grad(c, 0, -4, 16, 4, [[0, "#ffd49e"], [1, "#e07b4f"]]), "#8c3529", 1.2);
        paint(c, "M3 -2.2 L11 -2.2", null, rimGold, 1.5);
      });
    }
    // Half boiled egg peeking out
    ellipse(c, 28, 44, 7.5, 5.2, cream, "#9c4b39", 1.1, -0.2);
    ellipse(c, 28.5, 44, 3.8, 2.7, "#f7b23e", null, 1, -0.2);
    for (const [x, y] of [[24, 36], [49, 36], [73, 39]]) ellipse(c, x, y, 3.2, 1.4, "#85c26f", jadeDark, 0.9, -0.4);
    paint(c, "M9 40 Q16 52 48 53 Q77 53 88 40", null, cream, 2.5);
    leaves(c, 48, 67, 0.55, cream);
    steam(c, [[30, 21, 15], [52, 17, 17]]);
  }

  function food_sandwich(c) {
    plateShadow(c, 48, 76, 38, 9);
    // Kraft parchment paper wrapper & warm plate
    paint(c, "M6 61 Q12 54 24 53 L78 47 Q84 47 87 52 L90 60 Q90 64 83 68 L45 81 Q40 82 33 79 L10 70 Q3 67 6 61 Z",
      grad(c, 8, 48, 88, 80, [[0, "#e8a082"], [1, "#b45e4f"]]), fInk, 1.6);
    // Back sandwich half
    transform(c, 18, -7, 1.12, -0.035, () => {
      paintTextured(c, "M7 43 L33 14 Q35 10 39 13 L61 37 Q65 40 62 45 L60 51 L16 58 L7 53 Z",
        grad(c, 10, 14, 62, 56, [[0, "#f5cf93"], [1, "#b87443"]]), fInk, 1.65);
      paint(c, "M11 44 L35 17 Q37 14 39 17 L59 38 Q61 41 58 43 L17 53 L11 50 Z", paper, "#c89e70", 1.0);
      paint(c, "M14 51 L58 40 L60 43 L55 46 L19 56 L13 55 Z", "#7bb468", "#4a7343", 0.9);
    });
    // Front lush milk-bread egg sando cross-section
    transform(c, 3, 2, 1.15, 0, () => {
      paintTextured(c, "M8 46 L34 16 Q37 12 41 15 L62 39 Q66 43 63 47 L59 55 L21 64 Q16 65 11 61 L6 56 Q3 51 8 46 Z",
        grad(c, 6, 15, 64, 64, [[0, "#f2c683"], [1, "#ae6a3d"]]), fInk, 1.7);
      paint(c, "M10 45 L35 18 Q37 16 39 18 L59 40 Q61 42 58 44 L20 58 Q16 59 14 56 L8.5 51 Q7 49 10 45 Z", paper, "#b89068", 1.0);
      paint(c, "M13 45 L35 20 Q37 18 39 20 L55 38 Q57 40 54 41 L20 53 Q17 54 15 51 L12 48 Z", "#f2bd52", null);
      paint(c, "M15 47 L23 38 Q29 31 34 29 Q42 26 49 34 Q52 37 51 41 L25 51 Q19 53 15 47 Z", "#fff8e0", "#d4b47c", 0.95);
      // Jammy golden-amber yolk
      ellipse(c, 35.4, 39.9, 8.8, 7.2, light(c, 32, 36, 13, [[0, "#ffea94"], [0.45, "#f7a836"], [1, "#d97626"]]), "#b86b28", 1.0, -0.35);
      ellipse(c, 32.8, 37.0, 2.6, 1.2, "#fff8d6", null, 1, -0.45);
      paint(c, "M10 51 Q14 58 20 57 L59 44 L62 46 L57 49 L21 62 Q16 64 11 58 Z", "#fff2cc", "#c49a6e", 1.0);
    });
  }

  function food_jjajang(c) {
    plateShadow(c, 48, 78, 33, 8);
    // Traditional cream-and-blue Chinese-Korean noodle bowl
    paintTextured(c, "M8 40 Q15 28 48 28 Q79 28 89 40 L85 55 Q79 72 63 78 Q48 83 32 78 Q16 72 10 54 Z",
      grad(c, 10, 30, 88, 80, [[0, "#fff8e6"], [0.6, "#dfd3be"], [1, "#afa08c"]]), fInk, 2.0);
    paint(c, "M14 52 Q48 67 82 52", null, "#3a6e82", 3.4);
    paint(c, "M18 59 Q48 72 78 59", null, terracotta, 1.8);
    // Golden noodles peeking around edges
    ellipse(c, 48, 40, 39, 12.5, "#f5d484", fInk, 1.6);
    // Glossy rich black-bean chunjang sauce mound
    paint(c, "M14 41 Q20 26 48 25 Q76 26 82 41 Q76 52 48 52 Q20 52 14 41 Z",
      light(c, 38, 33, 40, [[0, "#6e4c44"], [0.4, "#3b2324"], [1, "#211417"]]), fInk, 1.6);
    // Glossy sauce specular highlights
    paint(c, "M28 35 Q38 30 50 32 M56 36 Q64 34 70 38", null, "rgba(255,220,175,0.48)", 2.2);
    // Fresh green cucumber julienne + sunny fried egg
    for (const [x, y, a] of [[24, 41, 0.3], [29, 43, 0.2], [35, 40, 0.4], [62, 42, -0.3], [68, 40, -0.2]]) {
      ellipse(c, x, y, 7, 1.5, "#78be66", "#3d6b3c", 0.7, a);
    }
    ellipse(c, 49, 37, 12, 7.5, paper, "#c9b396", 1.1);
    ellipse(c, 49, 36.5, 5.8, 4.2, light(c, 47, 34.5, 7, [[0, "#ffea94"], [0.5, "#f7ab34"], [1, "#d97524"]]), "#b56924", 0.9);
    paint(c, "M9 40 Q18 52 48 53 Q78 53 88 40", null, paper, 2.3);
    steam(c, [[30, 19, 14], [62, 18, 15]]);
  }

  function food_ramen(c) {
    plateShadow(c, 48, 78, 33, 8);
    // Crisp dark nori sheets standing in back
    paint(c, "M14 14 L34 10 L38 38 L18 40 Z", "#27332d", fInk, 1.4);
    paint(c, "M25 11 L43 9 L46 36 L28 38 Z", "#314239", fInk, 1.4);
    // Deep glazed dark-indigo stoneware ramen donburi
    paintTextured(c, "M8 40 Q15 28 48 28 Q79 28 89 40 L85 57 Q78 73 63 79 Q48 83 32 79 Q16 73 10 56 Z",
      grad(c, 10, 30, 88, 80, [[0, "#4c5a69"], [0.55, "#2f3947"], [1, "#1e222e"]]), fInk, 2.0);
    // Creamy golden tonkotsu broth
    ellipse(c, 48, 40, 39, 12.5, grad(c, 12, 30, 84, 52, [[0, "#f9d68e"], [0.65, "#d89a52"], [1, "#a86834"]]), fInk, 1.6);
    // Seared rolled chashu pork slice
    ellipse(c, 33, 39, 13.5, 8.5, grad(c, 22, 32, 46, 46, [[0, "#e59a74"], [0.6, "#b45f46"], [1, "#7c372c"]]), fInk, 1.4, -0.15);
    paint(c, "M25 38 Q32 34 40 39 Q35 44 28 42", null, "#f8d4b2", 2.0);
    // Jammy ajitama soft-boiled egg
    ellipse(c, 64, 38, 10.5, 7.2, cream, "#b89068", 1.2, 0.2);
    ellipse(c, 64.5, 38.2, 5.5, 4.0, light(c, 62, 36, 7, [[0, "#ffdb78"], [0.55, "#f0862b"], [1, "#c45122"]]), null, 1, 0.2);
    // Pink-swirl narutomaki fishcake
    ellipse(c, 50, 44, 7.2, 5.0, paper, "#c9b3a0", 1.1);
    paint(c, "M47 44 Q50 41 53 44 Q50 47 48 45", null, "#ef7e88", 1.6);
    // Scallions & golden rim
    for (const [x, y] of [[42, 35], [49, 34], [55, 37], [38, 47]]) ellipse(c, x, y, 2.8, 1.3, "#7ac26b", jadeDark, 0.8, -0.3);
    paint(c, "M9 40 Q18 52 48 53 Q78 53 88 40", null, terracotta, 2.5);
    steam(c, [[46, 19, 15], [66, 17, 14]]);
  }

  function food_tonkatsu(c) {
    plateShadow(c, 48, 74, 41, 10);
    // Warm stoneware oval plate
    ellipse(c, 48, 52, 43, 25, grad(c, 10, 28, 86, 76, [[0, "#fff8e8"], [1, "#d9c8b0"]]), fInk, 1.9);
    ellipse(c, 48, 51, 37, 20, "#fcf1da", "#cbb496", 1.0);
    // Fluffy shredded cabbage mound + cherry tomato + lemon wedge
    paint(c, "M14 45 Q18 30 34 29 Q48 29 50 41 Q45 50 22 50 Z",
      grad(c, 16, 30, 48, 49, [[0, "#c8e69a"], [1, "#72a65a"]]), "#4a7341", 1.3);
    paint(c, "M20 38 Q29 33 41 37 M22 43 Q31 39 43 42", null, "#eef7cf", 1.2);
    ellipse(c, 22, 50, 5.2, 4.8, "#eb4f3e", fInk, 1.1);
    ellipse(c, 20.5, 48.5, 1.5, 1.2, "#ffb39e");
    paint(c, "M66 36 Q78 35 82 46 Q74 50 66 44 Z", "#ffe269", "#b58b28", 1.2);
    // Sliced crispy golden panko pork cutlet!
    for (let i = 0; i < 4; i++) {
      const ox = 25 + i * 12, oy = 52 - i * 1.5;
      paintTextured(c, `M${ox} ${oy} Q${ox + 5} ${oy - 15} ${ox + 13} ${oy - 13} Q${ox + 18} ${oy - 2} ${ox + 12} ${oy + 12} Q${ox + 4} ${oy + 14} ${ox} ${oy} Z`,
        grad(c, ox, oy - 14, ox + 16, oy + 12, [[0, "#ffd078"], [0.45, "#d9893d"], [1, "#9a4e26"]]), fInk, 1.65);
      // Inner tender meat cross section on front slice
      if (i === 0) ellipse(c, ox + 5.5, oy + 1, 3.8, 7.2, "#f7d4b8", "#b57452", 0.9, 0.25);
    }
    // Glossy dark tonkatsu sauce zigzag drizzle
    paint(c, "M30 47 Q38 43 45 49 T60 46 T74 44", null, "#542721", 3.0);
    paint(c, "M31 46 Q38 43 45 48", null, "rgba(255,214,158,0.45)", 1.0);
  }

  function food_gimbap(c) {
    plateShadow(c, 48, 74, 41, 10);
    // Glazed sage-cream ceramic plate
    ellipse(c, 48, 52, 43, 24, grad(c, 10, 30, 86, 75, [[0, "#f2f4e4"], [1, "#b8c7b4"]]), fInk, 1.9);
    // 5 neat sliced gimbap rolls in two staggered rows
    const rolls = [[30, 41], [48, 39], [66, 41], [38, 55], [58, 55]];
    for (const [x, y] of rolls) {
      // Dark roasted seaweed outer ring + cylindrical side
      paint(c, `M${x - 11} ${y} L${x - 11} ${y + 7} Q${x} ${y + 14} ${x + 11} ${y + 7} L${x + 11} ${y} Z`, "#25302a", fInk, 1.4);
      ellipse(c, x, y, 11.2, 8.2, "#2f3d35", fInk, 1.45);
      // Warm white rice ring
      ellipse(c, x, y, 9.2, 6.6, "#fff8e8", "#d6c8b0", 0.7);
      // Colorful Korean fillings: danmuji yellow, carrot orange, spinach green, ham pink!
      ellipse(c, x - 3.2, y - 1.2, 3.0, 2.2, "#ffd54f");
      ellipse(c, x + 3.2, y - 1.2, 2.8, 2.0, "#f07e46");
      ellipse(c, x - 2.6, y + 2.0, 2.8, 1.9, "#5aa357");
      ellipse(c, x + 2.8, y + 2.0, 2.8, 1.9, "#e8827a");
      ellipse(c, x, y, 2.0, 1.5, "#874a34");
      // Sesame oil sheen & sesame seeds
      ellipse(c, x - 5, y - 4, 1.3, 0.7, cream, null, 1, -0.3);
      ellipse(c, x + 4, y - 5, 1.1, 0.6, cream, null, 1, 0.4);
    }
  }

  function food_bibimbap(c) {
    plateShadow(c, 48, 78, 34, 9);
    // Sizzling dark stone dolsot pot
    paintTextured(c, "M10 42 Q16 28 48 28 Q79 28 86 42 L82 60 Q76 75 62 79 Q48 82 34 79 Q20 75 14 60 Z",
      grad(c, 12, 30, 84, 80, [[0, "#544c50"], [0.5, "#332c31"], [1, "#1e191e"]]), fInk, 2.0);
    // Warm rice base inside pot
    ellipse(c, 48, 41, 35, 14, cream, "#706666", 1.4);
    // Colorful radial namul vegetables!
    paint(c, "M16 40 Q22 30 38 31 L46 41 L20 46 Z", "#5ca356", "#356336", 1.0); // spinach
    paint(c, "M38 30 Q52 28 62 32 L50 41 L38 38 Z", "#f28c44", "#a85328", 1.0); // carrot
    paint(c, "M60 32 Q76 33 80 42 L54 44 L54 38 Z", "#8c533c", "#4d2a22", 1.0); // beef/shiitake
    paint(c, "M20 46 L46 42 L46 53 Q28 53 20 46 Z", "#f7dc84", "#b59648", 1.0); // bean sprouts
    paint(c, "M50 42 L78 44 Q72 53 50 53 Z", "#e0c29e", "#9a7652", 1.0); // radish
    // Red gochujang dollop + glossy sunny-side-up egg
    ellipse(c, 60, 44, 7.5, 4.6, "#cf382b", "#7d1f1c", 1.0);
    ellipse(c, 45, 41, 13.5, 8.2, paper, "#d4c2a8", 1.2);
    ellipse(c, 45.5, 40.5, 6.4, 4.5, light(c, 43, 38.5, 8, [[0, "#ffea94"], [0.5, "#f7a832"], [1, "#d97322"]]), "#b56522", 0.9);
    paint(c, "M11 42 Q20 55 48 56 Q76 56 85 42", null, "#73696d", 2.6);
    steam(c, [[28, 20, 15], [48, 16, 17], [68, 21, 14]]);
  }

  function food_kimchistew(c) {
    plateShadow(c, 48, 79, 35, 8);
    // Wooden trivet under pot
    ellipse(c, 48, 75, 34, 9, grad(c, 16, 68, 80, 82, [[0, "#d4985a"], [1, "#7c4728"]]), fInk, 1.6);
    // Black earthenware ttukbaegi pot
    paintTextured(c, "M11 42 Q17 29 48 29 Q79 29 85 42 L81 62 Q76 74 48 75 Q20 74 15 62 Z",
      grad(c, 12, 30, 84, 75, [[0, "#4f4346"], [0.55, "#2b2327"], [1, "#181317"]]), fInk, 2.0);
    // Bubbling crimson kimchi broth
    ellipse(c, 48, 41, 34, 12.5, grad(c, 16, 30, 80, 52, [[0, "#eb5234"], [0.6, "#ba2a22"], [1, "#781b1a"]]), fInk, 1.5);
    // Golden-lit tofu squares + pork + kimchi + green onion rings
    for (const [x, y, a] of [[24, 37, -0.2], [58, 36, 0.25], [40, 43, -0.1]]) {
      transform(c, x, y, 1, a, () => {
        paint(c, "M-7 -4 L7 -4 L8 4 L-6 4 Z", grad(c, -6, -4, 8, 4, [[0, "#fff8e2"], [1, "#ebd0a6"]]), "#9c4e39", 1.1);
      });
    }
    paint(c, "M36 33 Q46 31 52 36 Q46 40 37 38 Z", "#e66b46", "#8c2b22", 1.0);
    for (const [x, y] of [[32, 46], [52, 44], [69, 41], [46, 35]]) ellipse(c, x, y, 3.0, 1.4, "#7cc26b", jadeDark, 0.85, -0.25);
    // Broth bubbles
    ellipse(c, 22, 44, 2.2, 1.3, "#ff9e73"); ellipse(c, 64, 46, 2.6, 1.5, "#ff9e73");
    paint(c, "M12 42 Q21 54 48 55 Q75 55 84 42", null, "#6e5f64", 2.5);
    steam(c, [[30, 21, 16], [48, 17, 19], [66, 20, 15]]);
  }

  function food_jokbal(c) {
    plateShadow(c, 48, 75, 42, 10);
    // Warm rustic wooden platter
    ellipse(c, 48, 53, 44, 24, grad(c, 8, 30, 88, 76, [[0, "#e2b274"], [1, "#874e2c"]]), fInk, 1.9);
    // Crisp green lettuce bed on left
    paint(c, "M10 49 Q13 33 29 33 Q40 34 38 48 Q33 60 15 58 Z",
      grad(c, 12, 34, 38, 58, [[0, "#9fd16d"], [1, "#518a49"]]), "#355c35", 1.3);
    // Overlapping glossy soy-glazed jokbal slices!
    for (let i = 0; i < 6; i++) {
      const ox = 25 + (i % 3) * 16 + (i >= 3 ? 6 : 0), oy = 40 + Math.floor(i / 3) * 12;
      ellipse(c, ox, oy, 11.5, 6.8, grad(c, ox - 6, oy - 5, ox + 8, oy + 5, [[0, "#d88a5c"], [0.55, "#9c4e32"], [1, "#5c2b22"]]), fInk, 1.4, -0.18);
      ellipse(c, ox, oy + 0.5, 7.5, 3.8, "#efc09c", null, 1, -0.18);
      paint(c, `M${ox - 6} ${oy - 3} Q${ox} ${oy - 5} ${ox + 6} ${oy - 2}`, null, rimGold, 1.3);
    }
    // Small dipping bowl of pink saeujeot & garlic slices
    ellipse(c, 77, 56, 8.5, 5.8, paper, fInk, 1.2);
    ellipse(c, 77, 55.5, 6.2, 3.8, "#f29b8e", null);
    ellipse(c, 22, 57, 3.2, 2.2, cream, "#b89668", 0.8);
    ellipse(c, 28, 60, 2.8, 1.8, "#7cc26b", jadeDark, 0.8);
  }

  function food_malatang(c) {
    plateShadow(c, 48, 78, 34, 8);
    // Big rustic white-and-terracotta ceramic bowl
    paintTextured(c, "M7 40 Q15 27 48 27 Q80 27 89 40 L85 57 Q78 74 63 79 Q48 83 32 79 Q17 74 10 56 Z",
      grad(c, 10, 28, 88, 80, [[0, "#fff5e0"], [0.6, "#dfd0b4"], [1, "#b29c82"]]), fInk, 2.0);
    // Aromatic chili-oil malatang broth
    ellipse(c, 48, 40, 39.5, 13, grad(c, 12, 28, 84, 52, [[0, "#f07238"], [0.55, "#cc3a28"], [1, "#87221d"]]), fInk, 1.6);
    // Leafy green bok choy
    paint(c, "M16 39 Q18 24 31 25 Q39 27 36 39 Q28 45 16 39 Z", "#6ab35a", "#356137", 1.2);
    paint(c, "M22 38 Q26 30 31 28", null, "#e5f5c6", 1.8);
    // Sliced lotus root with holes!
    ellipse(c, 65, 36, 9.5, 6.5, "#f5dcab", "#a87a4e", 1.2, 0.2);
    for (const [dx, dy] of [[-3, -1], [3, -1], [0, 2.5], [0, -3]]) ellipse(c, 65 + dx, 36 + dy, 1.4, 1.0, "#a83c28");
    // Fish balls, mushroom & glossy noodles
    ellipse(c, 45, 35, 6.2, 4.8, "#fff2cf", "#b88a5c", 1.1);
    ellipse(c, 53, 44, 6.0, 4.4, "#f5be78", "#a8693c", 1.1);
    ellipse(c, 34, 44, 7.2, 4.6, "#8c523c", fInk, 1.1, -0.2);
    paint(c, "M18 45 Q30 48 44 46 M58 46 Q69 47 78 42", null, "#ffe29a", 2.0);
    paint(c, "M8 40 Q18 53 48 54 Q78 54 88 40", null, cream, 2.4);
    paint(c, "M15 55 Q48 69 81 55", null, terracotta, 3.2);
    steam(c, [[30, 18, 14], [54, 16, 16]]);
  }

  function food_pasta(c) {
    plateShadow(c, 48, 76, 40, 10);
    // Shallow cream stoneware pasta bowl
    ellipse(c, 48, 55, 43, 22, grad(c, 10, 34, 86, 76, [[0, "#fff8e8"], [1, "#d4c0a4"]]), fInk, 1.9);
    ellipse(c, 48, 53, 35, 16, "#f5e3c2", "#c4a882", 1.1);
    // Tall twirl of creamy golden carbonara fettuccine
    paintTextured(c, "M18 52 C19 32 34 23 48 23 C63 23 77 33 78 52 Q76 62 48 63 Q20 62 18 52 Z",
      grad(c, 22, 23, 74, 63, [[0, "#fff4be"], [0.5, "#f2cf7e"], [1, "#cfa052"]]), fInk, 1.7);
    // Ribbons of swirling pasta
    for (const d of [
      "M23 49 Q38 35 66 43", "M26 40 Q48 28 72 39", "M29 33 Q48 24 66 32",
      "M25 55 Q48 46 73 53", "M33 58 Q48 54 64 58"
    ]) {
      paint(c, d, null, "#b87c3c", 2.6);
      paint(c, d, null, "#fff3ba", 1.4);
    }
    // Crispy smoky bacon bits, cracked pepper & fresh parsley sprig
    for (const [x, y, a] of [[32, 42, -0.4], [58, 37, 0.3], [44, 49, 0.2], [64, 48, -0.3], [36, 53, 0.5]]) {
      transform(c, x, y, 1, a, () => paint(c, "M-4 -2 L4 -2 L5 2 L-3 2 Z", "#b84434", fInk, 0.8));
    }
    for (const [x, y] of [[42, 34], [52, 36], [47, 42], [55, 44], [38, 47]]) ellipse(c, x, y, 0.9, 0.9, fInk);
    paint(c, "M45 27 Q43 18 49 18 Q54 19 52 27 Z M49 26 Q55 20 58 24 Q56 29 50 28 Z", "#559c50", "#2f5734", 1.0);
    steam(c, [[34, 18, 12], [62, 19, 13]]);
  }

  function food_curry(c) {
    plateShadow(c, 48, 75, 42, 10);
    // Warm oval stoneware curry plate
    ellipse(c, 48, 53, 44, 24, grad(c, 8, 30, 88, 76, [[0, "#fff8e8"], [1, "#d9c6aa"]]), fInk, 1.9);
    // Rich velvety golden-brown Japanese curry pool on right
    paint(c, "M40 33 Q68 30 85 45 Q88 59 72 67 Q52 72 34 65 Q30 48 40 33 Z",
      grad(c, 36, 32, 84, 68, [[0, "#d98434"], [0.5, "#a65224"], [1, "#6e311c"]]), "#54271a", 1.3);
    // Fluffy domed steamed rice on left
    paintTextured(c, "M12 52 C12 34 26 26 42 29 C54 31 57 44 53 58 C46 66 15 66 12 52 Z",
      grad(c, 14, 28, 54, 64, [[0, "#ffffff"], [0.65, "#f5ead4"], [1, "#d9c8ae"]]), fInk, 1.65);
    // Tender carrot & potato chunks in curry
    ellipse(c, 61, 47, 6.2, 4.4, "#f27e38", "#8c3b20", 1.0, -0.3);
    ellipse(c, 74, 53, 6.8, 4.8, "#f7d484", "#9a6c34", 1.0, 0.2);
    ellipse(c, 58, 59, 5.8, 4.2, "#874228", "#4d231a", 1.0);
    // Creamy swirl + ruby fukujinzuke pickles
    paint(c, "M64 41 Q72 39 76 44", null, "#fff5d4", 1.6);
    ellipse(c, 22, 61, 5.2, 3.0, "#cf4134", "#78211d", 0.9, 0.25);
    ellipse(c, 32, 34, 2.5, 1.2, "#559c50");
    steam(c, [[56, 22, 14], [70, 25, 12]]);
  }

  function food_taco(c) {
    plateShadow(c, 48, 76, 40, 10);
    // Warm terracotta fiesta plate
    ellipse(c, 48, 57, 42, 20, grad(c, 10, 38, 86, 76, [[0, "#e88a68"], [1, "#a64538"]]), fInk, 1.9);
    // Two vibrant street tacos nestled side by side
    for (const [ox, oy] of [[34, 49], [56, 53]]) {
      transform(c, ox, oy, 1, -0.06, () => {
        // Back tortilla half
        paint(c, "M-22 2 C-20 -22 18 -22 22 2 Z", "#e2ad5c", fInk, 1.5);
        // Savory meat, lettuce, ruby salsa, creamy avocado!
        paint(c, "M-17 0 Q-12 -15 0 -15 Q12 -15 17 0 Z", "#7a3b29", null);
        paint(c, "M-16 -3 Q-10 -16 -3 -12 Q4 -17 11 -11 Q16 -14 17 -3 Z", "#73b558", "#3d6b38", 1.0);
        ellipse(c, -6, -8, 4.2, 2.8, "#eb4d3b");
        ellipse(c, 7, -9, 4.5, 2.6, "#a6d66b", "#51803c", 0.8, -0.2);
        ellipse(c, 1, -12, 3.8, 2.2, "#9c4b82"); // purple cabbage
        // Front toasted corn tortilla shell with char spots
        paintTextured(c, "M-23 6 C-21 -10 19 -10 23 6 Q22 15 0 15 Q-22 15 -23 6 Z",
          grad(c, -20, -8, 22, 15, [[0, "#ffde8a"], [0.55, "#e6a64c"], [1, "#b87432"]]), fInk, 1.8);
        ellipse(c, -8, 4, 2.2, 1.1, "#9c5c28"); ellipse(c, 9, 2, 2.0, 1.0, "#9c5c28");
        paint(c, "M-14 -1 Q0 -5 14 -1", null, rimGold, 1.5);
      });
    }
    // Fresh lime wedge
    paint(c, "M69 61 Q82 59 86 69 Q76 74 68 67 Z", "#8ed15e", "#3c6e34", 1.3);
  }

  function food_bakery(c) {
    plateShadow(c, 48, 76, 38, 10);
    // Cozy woven bakery basket
    paintTextured(c, "M10 47 L86 47 L78 73 Q48 81 18 73 Z",
      grad(c, 12, 47, 84, 78, [[0, "#e5b06c"], [1, "#945930"]]), fInk, 1.9);
    for (let y = 55; y <= 69; y += 7) line(c, 15, y, 81, y, "#754324", 1.3);
    for (let x = 24; x <= 74; x += 12) line(c, x, 48, x, 75, "#754324", 1.1);
    // Cream gingham cloth peeking over rim
    paint(c, "M12 47 Q24 38 48 40 Q72 38 84 47 Q72 52 48 51 Q24 52 12 47 Z", cream, "#c49e74", 1.1);
    // Strawberry danish pastry in back right
    ellipse(c, 65, 39, 16, 10, grad(c, 50, 29, 80, 49, [[0, "#f5c26b"], [1, "#b46832"]]), fInk, 1.6, 0.15);
    ellipse(c, 65, 38, 9, 5.5, "#fff4cf", "#c48a48", 0.8, 0.15);
    ellipse(c, 65, 36.5, 5.2, 3.8, "#e6413b", "#8a2224", 0.9);
    ellipse(c, 63.5, 35, 1.6, 1.0, "#ffb5a8");
    // Star flaky golden French butter croissant in front!
    paintTextured(c, "M13 48 C15 26 32 18 47 21 C62 24 72 36 69 50 Q62 56 54 48 Q46 53 36 49 Q26 55 18 52 Q13 51 13 48 Z",
      grad(c, 16, 18, 68, 54, [[0, "#ffea9e"], [0.42, "#eb9f44"], [0.85, "#b65e28"], [1, "#823c1e"]]), fInk, 1.9);
    // Layered crescent pleats & buttery sheen
    paint(c, "M27 28 Q31 38 28 49 M44 22 Q46 35 43 48 M58 29 Q56 39 54 47", null, "#7d3d1f", 1.5);
    paint(c, "M22 36 Q26 26 36 25 M48 26 Q55 28 60 35", null, "#fff5c8", 2.2);
  }

  function food_bingsu(c) {
    plateShadow(c, 48, 79, 28, 7);
    // Vintage footed stoneware dessert bowl
    paintTextured(c, "M14 52 L82 52 L73 70 Q66 76 58 76 L62 81 L34 81 L38 76 Q30 76 23 70 Z",
      grad(c, 16, 52, 80, 81, [[0, "#83c9b0"], [0.55, jade], [1, jadeDark]]), fInk, 1.9);
    paint(c, "M17 55 L79 55", null, rimGold, 1.8);
    // Tall fluffy snow-white milk-ice shaved mountain
    paintTextured(c, "M16 52 C16 32 29 17 48 16 C67 17 80 32 80 52 Q66 58 48 58 Q30 58 16 52 Z",
      light(c, 40, 26, 44, [[0, "#ffffff"], [0.65, "#fff8e8"], [1, "#e5d7be"]]), "#b8a48c", 1.5);
    // Glossy golden mango syrup drizzle + mango cubes!
    paint(c, "M24 38 Q36 27 48 28 Q62 27 72 39 Q65 45 58 40 Q48 47 38 40 Q30 46 24 38 Z", "#f7ae34", null);
    for (const [x, y, a] of [[28, 44, -0.2], [40, 47, 0.15], [55, 46, -0.1], [67, 43, 0.25], [35, 36, 0.2], [59, 36, -0.25]]) {
      transform(c, x, y, 1, a, () => {
        paint(c, "M-5 -4 L5 -4 L6 4 L-4 4 Z", grad(c, -5, -4, 6, 4, [[0, "#ffe46e"], [1, "#eb8b24"]]), "#9c4e1c", 1.0);
        paint(c, "M-3 -2 L2 -2", null, "#fff8cf", 1.1);
      });
    }
    // Creamy vanilla ice cream scoop on peak + fresh mint leaf
    ellipse(c, 48, 21, 11.5, 9.5, light(c, 44, 17, 14, [[0, "#ffffff"], [0.6, "#fff2cf"], [1, "#e2c28e"]]), "#b89668", 1.3);
    paint(c, "M52 14 Q59 7 65 11 Q62 17 53 16 Z", "#59a854", "#2f5734", 1.1);
    paint(c, "M45 14 Q41 8 36 12 Q39 17 45 16 Z", "#72be62", "#2f5734", 1.0);
  }

  const foods = {
    burger: food_burger, pizza: food_pizza, chicken: food_chicken, noodles: food_noodles,
    sushi: food_sushi, tteokbokki: food_tteokbokki, sandwich: food_sandwich, jjajang: food_jjajang,
    ramen: food_ramen, tonkatsu: food_tonkatsu, gimbap: food_gimbap, bibimbap: food_bibimbap,
    kimchistew: food_kimchistew, jokbal: food_jokbal, malatang: food_malatang, pasta: food_pasta,
    curry: food_curry, taco: food_taco, bakery: food_bakery, bingsu: food_bingsu
  };
  const foodAliases = { hamburger: "burger", udon: "noodles", noodle: "noodles", ricecake: "tteokbokki" };

  function cachedFood(id) {
    const key = foodAliases[id] || id;
    const fn = foods[key] || food_burger;
    if (!foodCache.has(key)) {
      const off = document.createElement("canvas");
      const c = surface(off, 96, 88, 3);
      if (!painted?.food(c, key)) fn(c);
      foodCache.set(key, off);
    }
    return foodCache.get(key);
  }

  function drawFood(canvas, id) {
    const c = surface(canvas, 96, 88, 3);
    c.drawImage(cachedFood(id), 0, 0, 96, 88);
  }

  // Painted circular wooden/brass wall emblem plaque for dynamic street storefronts!
  function drawFoodEmblem(canvas, id) {
    const c = surface(canvas, 84, 84, 2);
    // Soft cast shadow on building wall
    ellipse(c, 43, 45, 36, 36, "rgba(42,22,26,0.34)");
    // Hand-painted dark wood & brass circular medallion frame
    ellipse(c, 42, 42, 36, 36, grad(c, 12, 10, 72, 74, [[0, "#b87a46"], [0.5, "#6b3d26"], [1, "#3f221b"]]), ink, 2.2);
    ellipse(c, 42, 42, 31.5, 31.5, grad(c, 18, 14, 68, 70, [[0, "#fff8e0"], [0.65, "#f7e0b4"], [1, "#dfb884"]]), brass, 1.8);
    // Food painting centered cleanly inside plaque
    c.drawImage(cachedFood(id), 12, 14, 60, 55);
    // Warm sunset specular glint on upper left brass bezel
    c.beginPath(); c.arc(42, 42, 33.5, -Math.PI * 0.85, -Math.PI * 0.3);
    c.strokeStyle = "rgba(255,240,192,0.72)"; c.lineWidth = 1.8; c.stroke();
  }

  function drawTransport(canvas, id) {
    const c = surface(canvas, 180, 148, 3), v = aliases[id] || id;
    transform(c, 0, v === "walk" ? 0 : -14, 1, 0, () => {
      if (v === "car") car(c, false, 0, false, 0, false);
      else if (v === "rocket") rocket(c, false, 0, false, false);
      else if (v === "bike" || v === "ebike") bike(c, v === "ebike", -0.28, false);
      else if (v === "moto" || v === "sport") motorcycle(c, v === "sport", 0, false);
      else if (v === "kickboard") kickboard(c, 0, false);
      else if (!painted?.vehicle(c, "walk")) garageShoe(c);
    });
  }

  function drawRider(canvas, opts = {}) {
    const c = surface(canvas, 180, 148, 3), v = aliases[opts.vehicle] || opts.vehicle || "walk";
    const female = opts.gender === "female", moving = !!opts.moving, boost = !!opts.boost, t = Number(opts.time) || 0;
    if (v === "car") car(c, female, moving ? t / (boost ? 76 : 112) : 0, true, t, boost);
    else if (v === "rocket") transform(c, 0, Math.sin(t / 390) * (moving ? 2.0 : 1.0), 1, moving && boost ? -0.03 : 0, () => rocket(c, female, t, true, boost));
    else if (["bike", "kickboard", "ebike", "moto", "sport"].includes(v)) riding(c, female, v, moving, boost, t);
    else walker(c, female, moving, boost, t, opts.stride);
  }

  const ready = (painted?.ready || Promise.resolve()).then(() => {
    layers.clear(); foodCache.clear();
  });
  window.RiderArt = { drawRider, drawFood, drawTransport, drawFoodEmblem, ready };
})();
