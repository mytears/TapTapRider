/* Painted atlas renderer. The existing animation rig supplies all joint positions. */
(() => {
  "use strict";
  const base = new URL("assets/", document.currentScript.src);
  const sheets = {};
  const bounds = {
    backpack: [[218,154,762,969]],
    // Matching open/closed frames use identical crop dimensions to avoid blink jitter.
    heads: [[65,44,514,515],[657,46,538,542],[65,649,514,515],[657,651,538,542]],
    rider: [[52,15,284,328],[388,17,324,332],[793,11,242,337],[1152,27,235,315],[119,374,129,336],[478,373,128,335],[858,383,103,324],[1204,386,140,313],[105,738,164,334],[469,737,133,331],[739,820,326,177],[1102,748,324,308]],
    vehicles: [[14,199,353,186],[385,121,376,290],[795,105,308,302],[1152,145,382,257],[19,624,349,276],[391,648,366,251],[773,637,370,255],[1164,665,360,199]],
    foods: [[4,45,276,224],[290,48,270,221],[570,26,264,243],[848,13,264,254],[1126,36,272,226],[5,340,275,190],[298,319,246,211],[561,322,275,223],[843,290,268,259],[1122,316,277,223],[5,605,275,212],[287,584,270,242],[567,564,267,261],[844,584,265,240],[1122,565,276,257],[5,881,275,206],[286,882,274,198],[568,880,268,211],[845,868,266,228],[1142,848,232,257]]
  };
  const foodIds = ["burger","pizza","chicken","noodles","sushi","tteokbokki","sandwich","jjajang","ramen","tonkatsu","gimbap","bibimbap","kimchistew","jokbal","malatang","pasta","curry","taco","bakery","bingsu"];
  const ready = Promise.all(Object.entries({rider:"rider-parts-v5.png",heads:"rider-heads-v6.png",backpack:"courier-backpack-v9.png",vehicles:"vehicles-v5.png",foods:"foods-v5.png"}).map(([key,file]) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => { sheets[key] = img; resolve(true); };
    // Keep the original artwork available if an atlas cannot load.
    img.onerror = () => resolve(false);
    img.src = new URL(file, base).href;
  })));

  function sprite(c, sheet, index, x, y, w, h) {
    if (!sheets[sheet]) return false;
    c.drawImage(sheets[sheet], ...bounds[sheet][index], x, y, w, h);
    return true;
  }

  function bone(c, index, start, end, width, shade = false, overhang = 1.8) {
    const dx = end[0] - start[0], dy = end[1] - start[1];
    c.save(); c.translate(...start); c.rotate(Math.atan2(-dx, dy));
    if (shade) c.filter = "brightness(0.78) saturate(0.85)";
    sprite(c, "rider", index, -width / 2, -overhang, width, Math.hypot(dx,dy) + overhang * 2);
    c.restore();
  }

  function face(c, female, blink = 0) {
    const frame = (female ? 1 : 0) + (blink > 0.86 ? 2 : 0);
    return sprite(c, "heads", frame, female ? -27 : -25, -32, female ? 53 : 51, female ? 53.4 : 51.1);
  }
  function bag(c) {
    return sprite(c, "backpack", 0, -42, -46, 35, 44.5);
  }
  function straps(c) {
    if (!sheets.backpack) return false;
    c.save();
    c.lineCap = "round";
    c.lineJoin = "round";
    // Follow the shoulder and ribcage, joining the bag's top and lower tabs.
    c.beginPath();
    c.moveTo(-11, -41);
    c.bezierCurveTo(-5, -44, 2, -38, 1, -31);
    c.bezierCurveTo(0, -23, -4, -13, -11, -7);
    c.strokeStyle = "#263e32";
    c.lineWidth = 5.2;
    c.stroke();
    c.strokeStyle = "#668267";
    c.lineWidth = 3.5;
    c.stroke();
    c.strokeStyle = "#d2bd87";
    c.lineWidth = 0.7;
    c.stroke();
    c.fillStyle = "#caa16a";
    c.fillRect(-3.8, -23, 4.4, 4);
    c.fillStyle = "#354d3a";
    c.fillRect(-2.8, -22, 2.4, 2);
    c.restore();
    return true;
  }
  function jacket(c, female) {
    if (!sheets.rider) return false;
    // Hide the sheet's resting sleeve: the articulated sleeve is drawn separately.
    c.save(); c.beginPath();
    c.moveTo(-9,-45); c.lineTo(10,-44); c.lineTo(20,-30);
    c.lineTo(20,3); c.lineTo(-17,3); c.lineTo(-14,-24); c.closePath(); c.clip();
    sprite(c,"rider",female ? 3 : 2,-24,-46,46,50);
    c.restore(); return true;
  }
  function sneaker(c, x, y, scale, angle, far) {
    if (!sheets.rider) return false;
    c.save(); c.translate(x,y); c.rotate(angle); c.scale(scale,scale);
    if (far) c.filter = "brightness(0.78) saturate(0.85)";
    sprite(c,"rider",10,-8,-6.5,25,14); c.restore(); return true;
  }
  function limbs(c, hip, knee, ankle, far) {
    if (!sheets.rider) return false;
    bone(c,8,hip,knee,far ? 10.5 : 11.5,far,2.5);
    bone(c,9,knee,ankle,far ? 8 : 9,far,2.3);
    return true;
  }
  function arm(c, elbow, hand, female, far) {
    if (!sheets.rider) return false;
    bone(c,female ? 5 : 4,[far ? -1 : -9,far ? -30 : -32],elbow,far ? 9 : 12,far,2.8);
    bone(c,far ? 6 : 7,elbow,hand,far ? 5.5 : 6.5,far,1.6);
    return true;
  }

  const rides = {
    walk: {i:0,box:[38,69,103,55],wheels:[]},
    bike: {i:1,box:[12,49,155,94],wheels:[[467,333,65],[686,333,65]],seat:[68,79],grip:[101,56],axle:[85,121]},
    kickboard: {i:2,box:[35,50,111,93],wheels:[[833,369,25],[1066,369,25]],seat:[79,94],grip:[105,55]},
    ebike: {i:3,box:[10,49,159,94],wheels:[[1221,330,61],[1463,332,61]],seat:[70,81],grip:[127,57],axle:[85,119]},
    moto: {i:4,box:[9,47,163,96],wheels:[[83,854,34],[325,851,35]],seat:[78,87],grip:[116,73]},
    sport: {i:5,box:[8,47,165,96],wheels:[[463,845,47],[682,846,48]],seat:[67,82],grip:[112,70]},
    car: {i:6,box:[6,44,168,99],wheels:[[841,849,32],[1074,849,32]]},
    rocket: {i:7,box:[29,63,148,82],wheels:[]}
  };

  function wheel(c, ride, wheel, turn) {
    if (!turn) return;
    const [sx,sy,r] = wheel, [bx,by,bw,bh] = bounds.vehicles[ride.i];
    const [x,y,w,h] = ride.box, scaleX=w/bw, scaleY=h/bh;
    c.save(); c.translate(x+(sx-bx)*scaleX,y+(sy-by)*scaleY); c.scale(scaleX,scaleY);
    c.beginPath(); c.arc(0,0,r,0,Math.PI*2); c.clip(); c.rotate(turn);
    c.drawImage(sheets.vehicles,sx-r,sy-r,2*r,2*r,-r,-r,2*r,2*r); c.restore();
  }
  function vehicle(c, id, turn=0, female=false, occupied=false, time=0, boost=false) {
    if (!sheets.vehicles || (occupied && (!sheets.rider || !sheets.heads))) return false;
    const ride=rides[id]; if (!ride) return false;
    if (id === "rocket") {
      const pulse=0.8+Math.sin(time/65)*0.12, length=(boost ? 35 : 22)*pulse;
      const flame=c.createLinearGradient(34,0,34-length,0);
      flame.addColorStop(0,"#ffedbe"); flame.addColorStop(.5,"#f8ad67"); flame.addColorStop(1,"#ef915000");
      c.fillStyle=flame; c.beginPath(); c.moveTo(34,101); c.quadraticCurveTo(16,99,34-length,110);
      c.quadraticCurveTo(18,116,34,117); c.fill();
    }
    sprite(c,"vehicles",ride.i,...ride.box);
    ride.wheels.forEach(w=>wheel(c,ride,w,turn));
    if (occupied && (id === "car" || id === "rocket")) {
      c.save(); c.beginPath();
      if (id === "car") { c.moveTo(82,67); c.lineTo(106,68); c.lineTo(118,89); c.lineTo(83,89); }
      else { c.ellipse(116,82,26,14,0,Math.PI,Math.PI*2); c.lineTo(142,93); c.lineTo(90,93); }
      c.closePath(); c.clip();
      c.translate(id === "car" ? 99 : 117,id === "car" ? 81 : 83); c.scale(.43,.43);
      sprite(c,"rider",female?3:2,-22,8,38,36);
      const blink = Math.max(0, 1 - Math.abs(((time + 1400) % 4200) - 2070) / 370);
      face(c,female,blink); c.restore();
    }
    if (boost && id !== "walk" && id !== "rocket") {
      c.save(); c.strokeStyle="#fff0c4a8"; c.lineWidth=.8;
      c.beginPath(); c.moveTo(3,118); c.lineTo(22,118); c.moveTo(1,123); c.lineTo(15,123); c.stroke(); c.restore();
    }
    return true;
  }
  function food(c,id) {
    if (!sheets.foods) return false;
    const index=Math.max(0,foodIds.indexOf(id)), box=bounds.foods[index];
    const scale=Math.min(90/box[2],78/box[3]), w=box[2]*scale,h=box[3]*scale;
    return sprite(c,"foods",index,(96-w)/2,(88-h)/2,w,h);
  }
  window.PaintedSprites={ready,face,bag,straps,jacket,sneaker,limbs,arm,vehicle,food,rides};
})();
