(() => {
  "use strict";
  let ctx, master, beat = 0, timer, settings;
  const notes = [0, 7, 12, 7, 4, 7, 12, 7, 0, 7, 11, 7, 3, 7, 10, 7];
  const roots = [48, 45, 41, 43];
  const hz = m => 440 * 2 ** ((m - 69) / 12);
  const patterns = {
    tap: 8, turbo: 12, fever: 16,
    pickup: [12, 28, 16], complete: [16, 36, 24],
    achievement: [18, 36, 18, 36, 28], phone: [32, 48, 32]
  };

  function tone(freq, len, type, vol, at = 0, end = freq) {
    if (!ctx || ctx.state !== "running") return;
    const now = ctx.currentTime + at, osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), now + len);
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.exponentialRampToValueAtTime(vol, now + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + len);
    osc.connect(amp); amp.connect(master);
    osc.start(now); osc.stop(now + len + 0.015);
    osc.onended = () => { osc.disconnect(); amp.disconnect(); };
  }

  function musicTick() {
    if (!settings?.music || settings.muted || document.hidden || ctx?.state !== "running") return;
    const step = beat % 16, root = roots[Math.floor(beat / 16) % roots.length];
    tone(hz(root + 12 + notes[step]), 0.24, "triangle", 0.055);
    if (step % 4 === 0) tone(hz(root - 12 + (step === 12 ? 7 : 0)), 0.49, "sine", 0.11);
    if (step % 8 === 4) tone(178, 0.07, "triangle", 0.045, 0, 60);
    beat++;
  }

  function unlock(s) {
    settings = s;
    try {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (!C) return;
        ctx = new C();
        master = ctx.createGain();
        master.gain.value = 0.60;
        master.connect(ctx.destination);
        timer = setInterval(musicTick, 210);
      }
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch {}
  }

  function haptic(kind) {
    if (settings?.haptics === false || document.hidden) return;
    const pattern = patterns[kind];
    if (!pattern) return;
    try { if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(pattern); } catch {}
  }

  function effect(name, tier = 0) {
    if (!settings?.sfx || settings.muted || document.hidden) return;
    let seq;
    if (name === "boost") {
      seq = tier >= 3 ? [69, 76, 81] : tier === 2 ? [64, 76] : [60, 71];
    } else {
      seq = {
        click: [72], lock: [55, 45, 38], accept: [67, 71, 74], arrive: [72, 76],
        pickup: [72, 76, 79], complete: [67, 71, 74, 79, 83],
        combo: [72, 76, 79, 84], achievement: [69, 73, 76, 81], phone: [84, 79, 84, 79]
      }[name] || [71];
    }
    const len = name === "boost" ? 0.065 : 0.13;
    const gap = name === "boost" ? 0.052 : 0.077;
    seq.forEach((n, i) => tone(hz(n), len, "square", name === "boost" && tier >= 3 ? 0.042 : 0.037, i * gap));
  }

  window.RiderSound = { unlock, effect, haptic };
})();
