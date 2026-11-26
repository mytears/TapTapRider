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
    // Only the vest/front panel belongs to the torso. The source sheet also
    // contains a resting arm, which must never remain behind the moving sleeve.
    const crop = female ? [1254,27,133,315] : [900,11,135,337];
    c.save();
    c.beginPath(); c.moveTo(-8,-44); c.quadraticCurveTo(7,-46,13,-34);
    c.quadraticCurveTo(18,-22,18,1); c.quadraticCurveTo(4,5,-14,2);
    c.lineTo(-14,-29); c.closePath(); c.clip();
    c.drawImage(sheets.rider,...crop,-15,-46,34,50);
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
    // The cutout trouser pieces taper at their ends. A cloth joint under both
    // pieces closes the wedge that otherwise opens during a deep pedal bend.
    c.save();
    const cloth=c.createLinearGradient(knee[0]-4,knee[1]-4,knee[0]+4,knee[1]+4);
    cloth.addColorStop(0,far ? "#4a4848" : "#696163");
    cloth.addColorStop(1,far ? "#292b31" : "#3d3b43");
    c.fillStyle=cloth; c.beginPath(); c.arc(...knee,far ? 3.8 : 4.4,0,Math.PI*2); c.fill(); c.restore();
    bone(c,8,hip,knee,far ? 10.5 : 11.5,far,2.5);
    bone(c,9,knee,ankle,far ? 8 : 9,far,2.3);
    return true;
  }
  function arm(c, elbow, hand, female, far) {
    if (!sheets.rider) return false;
    const shoulder = [far ? 2 : -8, far ? -32 : -33];
    const dx = hand[0]-elbow[0], dy = hand[1]-elbow[1], length = Math.max(1,Math.hypot(dx,dy));
    const wrist = [hand[0]-dx/length*3,hand[1]-dy/length*3];
    const [sx,sy,sw,sh] = bounds.rider[female ? 5 : 4];
    function sleeve(start,end,top,height,width,overlap) {
      c.save(); c.translate(...start); c.rotate(Math.atan2(-(end[0]-start[0]),end[1]-start[1]));
      c.drawImage(sheets.rider,sx,sy+top,sw,height,-width/2,-overlap,width,Math.hypot(end[0]-start[0],end[1]-start[1])+overlap*2);
      c.restore();
    }
    c.save();
    if (far) c.filter = "brightness(0.78) saturate(0.85)";
    // One full-length sleeve, articulated at its fabric elbow. Its ribbed cuff
    // ends at the wrist; no bare forearm is stretched out of a long-sleeve jacket.
    sleeve(shoulder,elbow,0,sh*.56,far ? 8.5 : 10.5,1.5);
    sleeve(elbow,wrist,sh*.48,sh*.52,far ? 7.5 : 9,1.3);
    c.translate(...hand); c.rotate(Math.atan2(-dx,dy));
    // Crop only the hand and short wrist, preserving their proportions.
    c.drawImage(sheets.rider,far ? 863 : 1210,far ? 618 : 610,far ? 99 : 134,far ? 89 : 89,
      far ? -2.6 : -3.5,-3.5,far ? 5.2 : 7,4.7);
    c.restore();
    return true;
  }

  const rides = {
    walk: {i:0,box:[38,69,103,55],wheels:[]},
    bike: {i:1,box:[12,49,155,94],wheels:[[467,333,65],[686,333,65]],seat:[68,79],grip:[101,56],axle:[85,121]},
    kickboard: {i:2,box:[35,50,111,93],wheels:[[833,369,25],[1066,369,25]],seat:[76,79],grip:[105,55]},
    // Wheel interiors follow the painted rim ellipses (cx, cy, rx, ry),
    // rather than approximate circles that cut through one side of the tire.
    ebike: {i:3,box:[10,49,159,94],wheels:[[1230,330,55,58],[1470,330,55,58]],seat:[70,81],grip:[127,57],axle:[85,119]},
    moto: {i:4,box:[9,47,163,96],wheels:[[83,854,34],[325,851,35]],seat:[78,87],grip:[116,73]},
    sport: {i:5,box:[8,47,165,96],wheels:[[450,833,43,47],[690,834,48,50]],seat:[67,82],grip:[112,70]},
    car: {i:6,box:[6,44,168,99],wheels:[[841,849,32],[1074,849,32]]},
    rocket: {i:7,box:[29,63,148,82],wheels:[]}
  };
  // Preserve the illustration's aspect ratio: independently stretching width
  // and height flattened every tire. Move all attachment points with the art.
  for (const [id,ride] of Object.entries(rides)) {
    if (!ride.wheels.length) continue;
    const [x,y,w,h]=ride.box, crop=bounds.vehicles[ride.i], width=h*crop[2]/crop[3];
    const left=x+(w-width)/2, mapX=value=>left+(value-x)*width/w;
    ride.feet=id === "kickboard" ? [[64,118],[83,118]] : [[82,106],[94,109]];
    for (const point of [ride.seat,ride.grip,ride.axle,...ride.feet]) if (point) point[0]=mapX(point[0]);
    ride.box=[left,y,width,h];
    if (id === "bike" || id === "ebike") {
      const hub=id === "bike" ? [559,341] : [1328,330];
      ride.axle=[left+(hub[0]-crop[0])*h/crop[3],y+(hub[1]-crop[1])*h/crop[3]];
    }
  }

  // These masks contain ONLY fixed parts crossing wheel interiors. All points
  // are atlas coordinates, so a fork, chain stay or muffler cannot rotate.
  const wheelHardware = {
    bike: "M421 232 L441 232 L470 331 L460 336 Z M487 232 L500 233 L472 335 L459 335 Z M461 326 L516 256 L525 265 L473 336 Z M454 324 L568 329 L570 351 L461 343 Z M641 244 L656 242 L691 333 L679 339 Z M610 326 L683 325 L684 333 L609 334 Z",
    ebike: "M1173 247 L1185 245 L1235 330 L1222 337 Z M1254 247 L1267 252 L1236 337 L1220 335 Z M1225 324 L1288 269 L1295 278 L1237 338 Z M1220 321 L1338 318 L1341 343 L1224 341 Z M1441 259 L1460 257 L1481 335 L1466 342 Z",
    kickboard: "M818 352 L883 355 L887 381 L831 385 L817 375 Z M1044 327 L1068 323 L1080 374 L1068 384 L1054 376 Z",
    moto: "M33 797 L143 802 L170 845 L145 864 L49 865 Z M54 843 Q98 835 146 851 L145 873 L63 875 Z M304 803 L324 803 L336 859 L318 868 Z",
    sport: "M437 818 L518 775 L534 793 L456 848 Z M460 804 L534 841 L533 866 L451 830 Z M655 759 L677 755 L700 821 L683 843 L673 828 Z",
    car: ""
  };
  const vehicleBodies = new Map();
  function vehicleBody(ride,id) {
    if (vehicleBodies.has(id)) return vehicleBodies.get(id);
    const [bx,by,bw,bh] = bounds.vehicles[ride.i];
    const body = document.createElement("canvas"); body.width=bw; body.height=bh;
    const b = body.getContext("2d");
    b.drawImage(sheets.vehicles,bx,by,bw,bh,0,0,bw,bh);
    b.save(); b.translate(-bx,-by);
    b.globalCompositeOperation="destination-out";
    b.beginPath();
    for (const [x,y,rx,ry=rx] of ride.wheels) { b.moveTo(x+rx,y); b.ellipse(x,y,rx,ry,0,0,Math.PI*2); }
    b.fill(); b.globalCompositeOperation="source-over";
    // Restore the stationary original artwork only inside the cleared circles.
    b.clip(); b.clip(new Path2D(wheelHardware[id] || ""));
    b.drawImage(sheets.vehicles,0,0); b.restore();
    if (id === "bike" || id === "ebike") {
      b.save(); b.translate(-bx,-by); b.globalCompositeOperation="destination-out";
      const pedal=id === "bike"
        ? "M555 349 L566 347 L579 370 L589 372 L589 387 L563 387 L563 374 Z"
        : "M1324 342 L1336 339 L1351 353 L1372 353 L1372 390 L1337 390 L1337 363 Z";
      b.fill(new Path2D(pedal)); b.restore();
    }
    vehicleBodies.set(id,body); return body;
  }
  function wheel(c, ride, wheel, turn, id) {
    const [sx,sy,r,ry=r] = wheel, [bx,by,bw,bh] = bounds.vehicles[ride.i];
    const [x,y,w,h] = ride.box, scaleX=w/bw, scaleY=h/bh;
    c.save(); c.translate(x+(sx-bx)*scaleX,y+(sy-by)*scaleY); c.scale(scaleX,scaleY*ry/r);
    const bicycle = id === "bike" || id === "ebike", inner=r-4;
    const rim = c.createLinearGradient(0,-r,0,r);
    rim.addColorStop(0,"#f8e4b9"); rim.addColorStop(.45,"#b59a6e"); rim.addColorStop(1,"#e6c38e");
    c.beginPath(); c.arc(0,0,r-1,0,Math.PI*2); c.strokeStyle="#685448"; c.lineWidth=3; c.stroke();
    c.beginPath(); c.arc(0,0,inner,0,Math.PI*2); c.strokeStyle=rim; c.lineWidth=3; c.stroke();
    if (!bicycle) {
      const metal=c.createLinearGradient(-inner,-inner,inner,inner);
      metal.addColorStop(0,"#6d7770"); metal.addColorStop(.5,"#303b38"); metal.addColorStop(1,"#1e2827");
      c.fillStyle=metal; c.fill();
      c.beginPath(); c.arc(0,0,inner*.7,0,Math.PI*2); c.strokeStyle="#a39b83"; c.lineWidth=2; c.stroke();
    }
    c.save(); c.rotate(turn);
    const count=bicycle ? 20 : id === "sport" ? 7 : 6;
    c.strokeStyle=bicycle ? "#a89069" : rim; c.lineWidth=bicycle ? 1.2 : 4;
    for (let i=0;i<count;i++) {
      const a=i*Math.PI*2/count;
      c.beginPath(); c.moveTo(Math.cos(a+.3)*4,Math.sin(a+.3)*4);
      c.lineTo(Math.cos(a)*inner,Math.sin(a)*inner); c.stroke();
    }
    c.fillStyle="#efc470"; c.fillRect(inner-7,-2,5,4); c.restore();
    if (!bicycle) {
      c.beginPath(); c.arc(0,0,inner*.42,0,Math.PI*2);
      c.fillStyle=rim; c.fill(); c.strokeStyle="#8e8673"; c.lineWidth=2; c.stroke();
      for (let i=0;i<8;i++) {
        const a=i*Math.PI/4+turn;
        c.beginPath(); c.arc(Math.cos(a)*inner*.3,Math.sin(a)*inner*.3,1.3,0,Math.PI*2);
        c.fillStyle="#665e50"; c.fill();
      }
    }
    c.beginPath(); c.arc(0,0,bicycle ? 5 : 7,0,Math.PI*2);
    c.fillStyle=rim; c.fill(); c.strokeStyle="#69533e"; c.lineWidth=2; c.stroke();
    c.restore();
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
    if (ride.wheels.length) {
      ride.wheels.forEach(w=>wheel(c,ride,w,turn,id));
      c.drawImage(vehicleBody(ride,id),...ride.box);
    } else sprite(c,"vehicles",ride.i,...ride.box);
    if (id === "bike" || id === "ebike") {
      const [ax,ay]=ride.axle, px=Math.cos(turn)*10, py=Math.sin(turn)*9;
      c.save(); c.lineCap="round";
      c.beginPath(); c.moveTo(ax-px,ay-py); c.lineTo(ax+px,ay+py);
      c.strokeStyle="#594b38"; c.lineWidth=2.4; c.stroke();
      c.strokeStyle="#e3ce9f"; c.lineWidth=1; c.stroke();
      for (const side of [-1,1]) {
        c.beginPath(); c.moveTo(ax+side*px-3.5,ay+side*py); c.lineTo(ax+side*px+3.5,ay+side*py);
        c.strokeStyle="#463c30"; c.lineWidth=2.4; c.stroke();
      }
      c.restore();
    }
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
