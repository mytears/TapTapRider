/* Hand-illustrated, resolution-independent artwork for Tap Tap Rider. */
(() => {
  "use strict";

  const outline = "#514453", fine = "#745c61", darkHair = "#493a45";
  const trousers = "#47576b", farTrousers = "#41495a", jade = "#458c81";
  const mint = "#83c9b0", paleMint = "#c4e4ca", cream = "#fff0d5", paper = "#fff8e8";
  const apricot = "#efac87", blush = "#efaa96", skin = "#ffd5ad";
  const steel = "#8ca4a4", tire = "#454855", bronze = "#b77b57";
  const TAU = Math.PI * 2, paths = new Map();
  const aliases = {foot:"walk",walking:"walk",bicycle:"bike",scooter:"kickboard",kick:"kickboard",electric:"ebike",electricbike:"ebike",motorcycle:"moto",motorbike:"moto",superbike:"sport",sportbike:"sport"};

  function surface(canvas,w,h) {
    const scale=3;
    if (canvas.width!==w*scale) canvas.width=w*scale;
    if (canvas.height!==h*scale) canvas.height=h*scale;
    canvas.style.imageRendering="auto";
    const c=canvas.getContext("2d");
    c.setTransform(scale,0,0,scale,0,0);
    c.clearRect(0,0,w,h);
    c.lineJoin="round"; c.lineCap="round";
    return c;
  }

  function paint(c,path,fill,stroke=outline,width=1.7) {
    if (typeof path==="string") {
      let stored=paths.get(path);
      if (!stored) { stored=new Path2D(path); paths.set(path,stored); }
      path=stored;
    }
    if (fill) { c.fillStyle=fill; c.fill(path); }
    if (stroke) { c.strokeStyle=stroke; c.lineWidth=width; c.stroke(path); }
  }

  function ellipse(c,x,y,rx,ry,fill,stroke=null,width=1.5,angle=0) {
    c.beginPath(); c.ellipse(x,y,rx,ry,angle,0,TAU);
    if (fill) { c.fillStyle=fill; c.fill(); }
    if (stroke) { c.lineWidth=width; c.strokeStyle=stroke; c.stroke(); }
  }
  function line(c,x,y,x2,y2,color,width=1.6) {
    c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function transform(c,x,y,scale,angle,draw) {
    c.save(); c.translate(x,y); c.rotate(angle); c.scale(scale,scale); draw(); c.restore();
  }
  function wash(c,top,bottom,a,b) {
    const g=c.createLinearGradient(0,top,0,bottom);
    g.addColorStop(0,a);g.addColorStop(1,b);return g;
  }
  function light(c,x,y,r,colors) {
    const g=c.createRadialGradient(x,y,0,x,y,r);
    for(const [at,color] of colors) g.addColorStop(at,color);
    return g;
  }
  function stitches(c,path,color,width=.8) {
    c.save();c.setLineDash([1.65,1.7]);paint(c,path,null,color,width);c.restore();
  }
  // Bake the painted gradients and fine stitching once, then pose the artwork at frame rate.
  const layers=new Map();
  function layer(c,id,x,y,w,h,draw) {
    let image=layers.get(id);
    if(!image) {
      const density=4;
      image=document.createElement("canvas");image.width=w*density;image.height=h*density;
      const b=image.getContext("2d");
      b.setTransform(density,0,0,density,-x*density,-y*density);b.lineCap="round";b.lineJoin="round";
      draw(b);layers.set(id,image);
    }
    c.drawImage(image,x,y,w,h);
  }
  function pipe(c,x,y,ex,ey,color,width) {
    line(c,x,y,ex,ey,outline,width+2.6);line(c,x,y,ex,ey,color,width);
  }

  // A pair of leaves appears on the cap, backpack, vehicles, and delivery box.
  function leaves(c,x,y,scale,color=paper) {
    transform(c,x,y,scale,0,() => {
      paint(c,"M0 3 Q-8 3 -9 -5 Q-1 -6 1 1 Q2 -7 11 -9 Q12 0 3 3 L1 7 Q0 8 -1 7 Z",color,null);
    });
  }

  function face(c,female,blink) {
    const closed=blink>.86;
    layer(c,'portrait-'+female+'-'+closed,-44,-38,82,68,b=>paintFace(b,female,closed));
  }

  function paintFace(c,female,closed) {
    if (female) {
      paint(c,"M-19 -4 C-31 -12 -40 -3 -38 5 Q-33 13 -41 20 Q-34 22 -30 18 Q-32 21 -34 22 C-23 24 -14 14 -17 7 Z",wash(c,-4,23,"#59424b","#654b57"));
      paint(c,"M-26 -2 C-37 -3 -36 4 -33 8 Q-30 14 -36 18 M-23 1 Q-28 4 -27 11 T-30 18",null,"#947074",1.45);
      ellipse(c,-25,3,3.3,5.3,"#ecad91",outline,1.2,-.4);
      paint(c,"M-28 3 Q-31 -2 -32 -1 Q-33 4 -29 7 L-31 10 L-26 8",apricot,"#b17b75",.8);
    }
    const faceShape="M-22 -11 Q-21 -24 0 -25 Q23 -25 27 -9 Q30 -.5 27 5 Q29.6 7.6 30 9 Q30 11 27 11.9 Q27 15 25 17 C21.5 25.2 7 29 -7 25 Q-25 21 -26 7 Z";
    paint(c,faceShape,light(c,11,-4,45,[[0,"#ffedcf"],[.53,"#ffdbb2"],[.83,"#f3bf9f"],[1,"#dba08c"]]),"#654854",1.65);
    paint(c,"M-20 9 C-19 23 -1 28 13 24 Q1 29 -11 23 Q-18 20 -20 14 Z","#d99a89",null);
    paint(c,"M-8 -7 Q6 -13 22 -10 L25 -7 Q11 -8 -6 -3 Z","#e8b397",null);
    // Hair and ear frame a three-quarter face with room for both eyes.
    paint(c,female
      ? "M-24 -13 Q-10 -29 12 -21 Q24 -17 25 -8 Q17 -13 13 -13 Q12 -7 5 -5 Q7 -9 6 -11 Q-1 -6 -5 -3 Q-4 -8 -6 -9 Q-12 -6 -13 2 Q-15 12 -20 12 Q-28 9 -27 1 Z"
      : "M-25 -13 Q-14 -27 9 -23 Q23 -19 26 -8 Q19 -10 14 -13 Q15 -8 9 -5 L8 -11 Q2 -5 -5 -4 L-5 -10 Q-12 -4 -14 3 Q-15 12 -21 11 Q-28 5 -26 -1 Z",light(c,-10,-18,36,[[0,"#986b61"],[.42,"#704e50"],[1,"#493b47"]]),"#473844",1.55);
    paint(c,"M-23 -8 Q-17 -15 -8 -16 Q-16 -13 -20 -7 Z M-15 -6 Q-11 -12 -7 -12 Q-11 -8 -13 -4 Z M-3 -8 L3 -13 L1 -10Z","#926961",null);
    paint(c,"M-22 -4 Q-21 1 -18 2 M-11 -9 Q-7 -14 -.8 -15 M12 -14 Q16 -14 20 -11",null,"#a37b70",.8);
    ellipse(c,-17,7,5.5,6.2,light(c,-19,4,10,[[0,"#ffdfb7"],[1,"#e5a18b"]]),fine,1.2,-.2);
    paint(c,"M-20 7.7 Q-19.6 3.6 -16.6 5.3 Q-14.5 6.9 -16.6 8.6",null,"#bd8678",1);
    if (female) {
      ellipse(c,-17,12.4,1.65,1.65,"#f8cb76",fine,.75);
      paint(c,"M-13 0 Q-13 9 -8 12 Q-15 13 -17 5",darkHair,null);
    }
    paint(c,"M1.6 -3.2 Q4.7 -6.3 8.8 -3.7 Q6.3 -3.8 2.1 -2.4 Z M18 -3.8 Q20.3 -6.1 23.9 -3.8 Q20.9 -4.2 18 -3 Z","#795458",null);
    if (closed) {
      paint(c,"M2.5 4 Q5 6 8 3.8 M18 4 Q20.7 6 23 3.5",null,outline,1.7);
    } else {
      ellipse(c,5.8,3.45,2.65,3.85,"#fff2d7");ellipse(c,20.7,3,2.45,3.55,"#fff2d7");
      ellipse(c,6.3,3.45,2.3,3.55,wash(c,0,7,"#48323a","#a46c53"));ellipse(c,21,2.9,2.05,3.3,wash(c,0,7,"#493840","#97654e"));
      ellipse(c,6.7,2.1,.8,.85,paper);ellipse(c,21.35,1.6,.7,.8,paper);
      paint(c,"M3.15 2.4 Q4.5 -.8 7.6 .6 M18.5 1.9 Q20 -.9 22.2 .1",null,"#584049",1.1);
      if(female) paint(c,"M3.2 2 Q2.1 1.6 1.8 .7 M18.7 1.4 Q17.6 1.2 17.3 .35",null,outline,.9);
    }
    ellipse(c,-1,10,5.7,3.5,light(c,-1,10,5.7,[[0,"#edaa97"],[1,"#edaa9700"]]),null,1,.08);
    ellipse(c,23,9.5,3.4,2.4,light(c,23,9.5,3.5,[[0,blush],[1,"#efaa9600"]]));
    ellipse(c,-2,8.75,1.8,.6,"#ffe9c9",null,1,-.15);
    paint(c,"M14.2 4.8 Q15.2 6.3 16.9 7.7 Q16.8 9.8 13.6 9.1",null,"#c88b78",.95);
    ellipse(c,16.7,7.1,1.3,.64,"#fff0cb",null,1,.16);
    paint(c,"M8.8 14.8 Q12.9 18.5 17.7 13.8 Q15.1 20 11.4 17.9 Z","#b87a78",null);
    paint(c,"M8.7 14.7 Q12.7 18.7 17.4 13.9",null,"#8b5960",1.35);
    paint(c,"M12.3 20.1 Q14 20.5 15.7 19.6",null,"#ffe8c8",1);
    // Soft six-panel courier cap and curved visor.
    paint(c,"M-27 -8 C-28 -23 -17 -34 -.5 -34 C11 -35 21 -28 24 -18 Q26 -13 23 -10 Q8 -13 -6 -8 Q-19 -2 -27 -8 Z",light(c,-8,-31,42,[[0,"#d4e7c7"],[.43,"#a2cdb1"],[.72,"#82b6a0"],[1,"#5b928b"]]));
    paint(c,"M-26 -12 Q-16 -16 -17 -23 Q-16 -29 -9 -31 Q-14 -25 -12 -19 Q-11 -15 -5 -13 Q-15 -9 -25 -8 Z","#79a995",null);
    paint(c,"M9 -31 Q22 -24 24 -16 L15 -16 Q18 -22 9 -31Z","#77a493",null);
    paint(c,"M-23 -14 Q-21 -27 -10 -30 M-4 -32 Q4 -29 8 -17",null,"#568b80",1.2);
    paint(c,"M-24 -10 Q-9 -10 3 -15 Q14 -19 25 -18 Q33 -19 35 -15 Q35 -12 29 -11 C21 -9 11 -11 2 -9 Q-14 -3 -23 -5 Q-26 -6 -24 -10 Z","#689e8c",outline,1.6);
    paint(c,"M-20 -8 Q-8 -8 3 -12 Q17 -17 29 -16",null,"#c2e0bd",1.2);
    stitches(c,"M-21 -12 Q-9 -13 0 -16 Q13 -21 23 -19","#e0e8c7",.75);
    paint(c,"M-18 -22 Q-15 -27 -11 -28",null,"#e1ecd1",1.45);
    ellipse(c,-3,-34,3,1.7,jade,fine,1);
    leaves(c,10,-23,.39,cream);
  }

  function bag(c) {
    paint(c,"M-40 -35 Q-41 -40 -34 -42 L-15 -44 Q-10 -43 -9 -37 L-7 -6 Q-7 0 -12 1 L-36 3 Q-43 3 -44 -4 L-46 -27 Q-47 -34 -40 -35 Z",light(c,-38,-37,54,[[0,"#a8d8ba"],[.52,"#73ae99"],[1,"#417e79"]]),outline,1.9);
    paint(c,"M-20 -40 Q-14 -45 -10 -40 Q-8 -36 -8 -29 L-7 -4 Q-8 1 -14 1 L-18 1 Z",wash(c,-40,0,"#6fa594","#457b76"),outline,1.15);
    paint(c,"M-19 -37 Q-15 -38 -12 -35 L-10 -11 L-14 -7 Z","#5b9081",null);
    paint(c,"M-42 -36 L-36 -42 L-16 -45 Q-12 -45 -10 -40 L-18 -36Z","#b4d5b5",fine,1.05);
    paint(c,"M-46 -32 Q-46 -37 -39 -38 L-20 -40 Q-16 -40 -16 -35 L-16 -28 Q-16 -25 -20 -25 L-40 -22 Q-44 -22 -45 -26 Z",light(c,-38,-36,32,[[0,"#c2e1c4"],[.55,"#a1cdb4"],[1,"#76a493"]]),outline,1.45);
    paint(c,"M-44 -25 Q-38 -23 -18 -27 L-17 -25 Q-24 -21 -41 -21 Q-43 -21 -44 -25Z","#5c9583",null);
    paint(c,"M-41 -33 L-24 -35 M-41 -5 Q-31 -4 -23 -6",null,"#c9e5c9",1.45);
    paint(c,"M-42 -16 Q-33 -18 -20 -18 L-19 -7 Q-19 -4 -23 -4 L-37 -2 Q-41 -2 -41 -6 Z",wash(c,-18,-2,"#94c7ac","#69a994"),"#4d8377",1);
    stitches(c,"M-43 -32 L-42 -26 Q-40 -25 -37 -25 L-21 -27 M-39 -13 L-38 -6 Q-37 -4 -34 -5 L-23 -6","#d2e1bb",.78);
    paint(c,"M-42 -2 Q-32 0 -19 -3 L-17 1 L-36 3 Q-40 3 -42 -2Z","#4d7b70",null);
    ellipse(c,-28.5,-12.2,6.6,6.6,"#5e917b");ellipse(c,-28.5,-12.9,6.25,6.25,"#eeecc9","#c5d1ad",.75);
    leaves(c,-28.5,-12.2,.45,jade);
    paint(c,"M-22.2 -30 L-19.2 -30.5 L-18.8 -22 Q-19.8 -20.8 -21.3 -21 Z","#4b716a","#52736a",.65);
    paint(c,"M-22 -27 L-18.8 -27.4 L-18.6 -24 L-21.8 -23.5Z","#cab58b","#6b7267",.8);
    paint(c,"M-14 -30 Q-11.6 -25 -11 -19",null,"#d1cf99",.9);
    paint(c,"M-12.5 -21 Q-9 -20 -10.2 -17.3 L-12.8 -15.2 Q-15 -16 -13.9 -18.5Z","#e0a16f","#846c60",.72);
    paint(c,"M-32 -40 Q-33 -46 -24 -47 Q-20 -47 -19 -43",null,outline,2.6);
    paint(c,"M-30.7 -43 Q-28 -46 -24 -45.8",null,"#bfbe96",.82);
  }

  function jacket(c,female) {
    paint(c,"M-8 -39 Q0 -43 9 -38 Q16 -33 17 -19 L19 -5 Q18 .5 11 2 L-8 3 Q-16 3 -17 -2 L-18 -24 Q-18 -34 -8 -39 Z",light(c,-1,-32,46,[[0,female?"#ffe9d0":"#fff4d9"],[.56,female?"#f9c9ab":"#efdbb9"],[1,female?"#d99c90":"#ceb7a1"]]),outline,1.9);
    paint(c,"M-16 -29 Q-12 -24 -13 -16 Q-13 -9 -8 -5 Q-15 -5 -16 -3Z",female?"#dda194":"#c9b6a1",null);
    paint(c,"M14 -25 Q14 -15 16 -11 L12 -8 L17 -9 L16 -5 Q9 -1 9 -7Z",female?"#e5ab99":"#d3bda4",null);
    // Shoulder yoke, high collar and a contrasting jersey peeking through the open zip.
    paint(c,"M-17 -29 Q-16 -36 -8 -39 Q-.5 -41 6 -37 L10 -32 Q5 -28 -3 -29 L-10 -27Z",female?"#e1a592":"#9cb7a3","#998b7b",.72);
    stitches(c,"M-14 -29 Q-9 -31 -4 -30 Q2 -29 6 -31",female?"#ffe1c4":"#e3e7c8",.8);
    paint(c,"M-12 -38 Q-16 -42 -7 -45 Q2 -46 8 -40 Q10 -36 7 -34 Q-4 -32 -12 -38 Z",female?"#f3c1a8":"#edd4b1",outline,1.4);
    paint(c,"M1 -40 L7 -42 L9 -37 Q6 -33 2 -35 Z",apricot,outline,1);
    paint(c,"M0 -36 L5 -34 L8 -35 L8 -26 Q5 -29 2 -29Z","#b97869",fine,.75);
    paint(c,"M0 -35 L3 -31 L7 -33 L8 -36Z","#f3b389",null);
    paint(c,"M-13 -38 Q-6 -38 -7 -31 Q-11 -19 -11 -8",null,"#547e79",4.3);
    paint(c,"M-13 -37 Q-9 -37 -9 -34",null,paleMint,1.3);
    paint(c,"M6 -33 Q9 -22 10 -6 M-11 -2 Q1 0 13 -4",null,"#b69a88",1.05);
    paint(c,"M7 -32 Q10 -22 11 -9",null,"#fff0d3",.8);
    paint(c,"M-8 -12 Q-5 -15 -1 -16 L3 -12 L1 -7 L-4 -6 Z",female?"#efb59c":"#e5cbac",null);
    stitches(c,"M-8 -11 L-2 -15 M-10 0 Q1 1 13 -3",female?"#ca988b":"#b99e8a",.7);
    paint(c,"M-16 -2 Q-3 .2 16 -4 L16 -.7 Q4 3 -7 3.8 Q-13 4 -16 1Z",female?"#c99485":"#97a899","#827e75",.7);
    paint(c,"M-12 .3 L-10.8 1.9 M-9 .7 L-8 2.2 M11 -1.3 L12 .2",null,female?"#e6b6a0":"#c0c7ad",.7);
    paint(c,"M-14 -19 L-7 -17 L-8 -13 L-14 -15Z","#91a296",fine,.85);
    paint(c,"M-4 -31 Q-3 -26 -3 -23 M2 -32 L3 -26",null,"#a48674",.95);
    ellipse(c,-3,-22.8,.7,1.2,cream);ellipse(c,3,-26,.65,1,cream);
  }

  function sneaker(c,x,y,scale,angle,far) {
    transform(c,x,y,scale,angle,() => {
      paint(c,"M-5 -6 Q-2 -3 1 -5 Q3 -6 5 -3 L8 -1 Q14 0 15 3 Q15 6 11 7 L-4 7 Q-8 7 -8 3 L-7 -3 Q-7 -6 -5 -6 Z",far?"#c3c5b9":cream,outline,1.55);
      paint(c,"M-5 -4 L-2 -2 L1 -3 Q1 0 4 1 L1 3 L-7 3 Z",far?"#799992":mint,null);
      paint(c,"M-7 -1.6 Q-5 -3 -3 -2.5 L-1 .6 L-4 2.1 L-6.5 1.8Z",far?"#69857e":"#6ca591",null);
      paint(c,"M6 -1 Q11 -.3 13 2 L7 2.4 Q5 1.2 6 -1Z",far?"#b3b5a7":"#f0dabc",null);
      paint(c,"M-7 3 Q3 4 12 2.5 Q15 2 15 4 Q14 6 10 6.4 L-5 6.4 Q-7 6 -7 3Z",far?"#adb3af":paper,outline,.8);
      paint(c,"M2 -2 L5 -3 M4 -.4 L7 -1.3",null,"#8c8c86",.9);
      paint(c,"M-4 5 L-2 5 M2 5.4 L5 5.3 M10 5 L11.2 4.6",null,far?"#909891":"#c6b8a8",.6);
    });
  }

  function limbs(c,h,k,a,far) {
    const path=new Path2D();
    path.moveTo(h[0]-5.2,h[1]-2);
    path.quadraticCurveTo(h[0]-5,h[1]+5,k[0]-5.1,k[1]-1);
    path.quadraticCurveTo(k[0]-4.4,k[1]+6,a[0]-3.3,a[1]-2.1);
    path.quadraticCurveTo(a[0]+.3,a[1],a[0]+3.5,a[1]-2.1);
    path.quadraticCurveTo(a[0]+2.9,a[1]-6,k[0]+4.5,k[1]+2);
    path.quadraticCurveTo(k[0]+6.6,k[1]-.5,k[0]+4.6,k[1]-3.4);
    path.lineTo(h[0]+5.5,h[1]-2);path.closePath();
    paint(c,path,wash(c,h[1],a[1],far?farTrousers:"#596a78",far?"#454655":trousers),outline,1.65);
    line(c,h[0]-2.3,h[1]+3,k[0]-2.7,k[1]-2,far?"#5e616b":"#768591",1.6);
    line(c,k[0]+2.8,k[1]-.2,k[0]-.5,k[1]+2.2,far?"#363a46":"#354350",1.2);
    line(c,k[0]+.4,k[1]+4,a[0]-.9,a[1]-5.8,far?"#50515c":"#61707a",1.25);
    line(c,a[0]-2.6,a[1]-4,a[0]+2.8,a[1]-3.7,far?"#a9afa4":"#c3cbbd",2.4);
  }

  function kneeFor(hip,foot,reach) {
    const dx=foot[0]-hip[0],dy=foot[1]-hip[1],d=Math.max(1,Math.hypot(dx,dy));
    const bend=Math.sqrt(Math.max(0,reach*reach-d*d/4));
    return [(hip[0]+foot[0])/2+dy/d*bend,(hip[1]+foot[1])/2-dx/d*bend];
  }

  function arm(c,elbow,hand,female,far) {
    const sx=far?-1:6,sy=far?-28:-30;
    const sleeve=far?"#d3b499":female?"#f5c2a7":"#f4dfba";
    pipe(c,elbow[0],elbow[1],hand[0],hand[1],far?apricot:skin,5.2);
    pipe(c,sx,sy,elbow[0],elbow[1],sleeve,8.6);
    line(c,sx-1.35,sy,elbow[0]-1.5,elbow[1]-2,far?"#dfc3aa":female?"#fdd8b9":"#fff0cd",2.15);
    if(!far) {
      const dx=elbow[0]-sx,dy=elbow[1]-sy,d=Math.max(1,Math.hypot(dx,dy));
      const px=-dy/d*3,py=dx/d*3,cx=elbow[0]-dx/d*1.75,cy=elbow[1]-dy/d*1.75;
      line(c,cx-px,cy-py,cx+px,cy+py,female?"#cc9c8e":"#a6b4a6",1.65);
    }
    line(c,elbow[0],elbow[1]+.8,(elbow[0]+hand[0])*.5,(elbow[1]+hand[1])*.5,far?"#d9987f":"#e9b295",1.25);
    ellipse(c,hand[0],hand[1],3.4,3.9,far?apricot:skin,outline,1.15,-.45);
    line(c,elbow[0]-1.8,elbow[1]+1,elbow[0]+1.8,elbow[1]+1.5,far?"#bd9d8b":"#d6ad92",1.2);
  }

  function torso(c,female,elbow,hand,headTilt,t,bagSwing=0) {
    transform(c,0,0,1,bagSwing,()=>layer(c,'canvas-delivery-bag',-49,-50,45,57,bag));
    layer(c,'courier-jacket-'+female,-21,-48,42,55,b=>jacket(b,female));
    arm(c,elbow,hand,female,false);
    transform(c,4,-57,1,headTilt,() => {
      // A short blink every few seconds with a fixed open-eyed pose at t=0.
      const blink=Math.max(0,1-Math.abs(((t+1400)%4200)-2070)/370);
      face(c,female,blink);
    });
  }

  const cycleDistance=64, stanceFraction=.56, walkers=new WeakMap();
  const smooth=u=>u*u*(3-2*u);

  // Advance in native ground coordinates. One stride is one complete two-step cycle.
  // The time-driven fallback is used for indoor scenes without a measured floor offset.
  function gaitClock(canvas,t,stride,moving,boost) {
    let state=walkers.get(canvas);
    const target=boost?1:0;
    if(!state || t<state.time) {
      state={time:t,mix:target,distance:t*cycleDistance/(boost?640:950)};
      walkers.set(canvas,state);
    }
    const dt=Math.min(160,t-state.time);
    state.mix+=(target-state.mix)*(1-Math.exp(-dt/110));
    if(Number.isFinite(stride)) state.distance=stride;
    else if(moving) state.distance+=dt*cycleDistance/(950-310*state.mix);
    state.time=t;
    return state;
  }

  function footAt(p,center,scale,energy) {
    const travel=cycleDistance*stanceFraction;
    let contactX=center+travel*.5-cycleDistance*p, lift=0, angle;
    if(p<stanceFraction) {
      const s=p/stanceFraction;
      const heel=Math.max(0,1-s/.24),toe=Math.max(0,(s-.73)/.27);
      angle=-.19*smooth(heel)+.34*smooth(toe);
    } else {
      const u=(p-stanceFraction)/(1-stanceFraction);
      // In world space the swing foot travels one cycle forward and eases to rest.
      contactX+=cycleDistance*smooth(u);
      lift=(13+energy*5)*Math.pow(Math.sin(Math.PI*u),1.45);
      angle=.34*(1-smooth(u))-.19*smooth(u)-.12*Math.sin(Math.PI*u);
    }
    // Rotate about the heel at touchdown, flatten the sole, then pivot about the toe.
    // Cancelling the rotated pivot keeps that material point on the same paving stone.
    const pivotX=angle<0?-4.5:10.5,soleY=6.5;
    const cos=Math.cos(angle),sin=Math.sin(angle);
    const ankle=[contactX+scale*(pivotX-pivotX*cos+soleY*sin),143-lift-scale*(pivotX*sin+soleY*cos)];
    return {ankle,angle,swing:(contactX-center)/(travel*.5)};
  }

  function walker(c,female,moving,boost,t,stride) {
    const {distance,mix}=gaitClock(c.canvas,t,stride,moving,boost);
    const p=((distance/cycleDistance)%1+1)%1,hx=88;
    const hy=moving?98.7-2.7*(.5-.5*Math.cos(2*TAU*p)):96.8+Math.sin(t/820)*.55;
    const far=moving?footAt((p+.5)%1,hx-2,.89,mix):{ankle:[81.5,137.2],angle:0,swing:0};
    const near=moving?footAt(p,hx+1,.92,mix):{ankle:[94,137],angle:0,swing:0};
    const hipFar=[hx-4,hy-.5], hipNear=[hx+2,hy];
    limbs(c,hipFar,kneeFor(hipFar,far.ankle,moving?21.8:20.8),far.ankle,true);
    sneaker(c,...far.ankle,.89,far.angle,true);
    limbs(c,hipNear,kneeFor(hipNear,near.ankle,moving?22:20.7),near.ankle,false);
    sneaker(c,...near.ankle,.92,near.angle,false);
    const swing=moving?near.swing:0;
    const lean=moving?.038+.046*mix-.016*swing:.014;
    transform(c,hx,hy,1,lean,() => {
      arm(c,[6+swing*7,-18],[10+swing*14,-9-Math.max(0,swing)*7],female,true);
      const elbow=moving?[5-swing*9,-17-Math.abs(swing)*1.5]:[6,-16];
      const hand=moving?[9-swing*16,-7-Math.max(0,-swing)*(12+mix*3)]:[8,-4];
      const recoil=moving?Math.sin(2*TAU*p-.7)*(.012+.008*mix):0;
      torso(c,female,elbow,hand,moving?-.03-.018*Math.sin(p*TAU):-.035,t,recoil);
    });
  }

  function wheels(c,x,y,r,turn,motor=false) {
    ellipse(c,x,y,r,r,tire,outline,1.8);
    ellipse(c,x,y,r-2.4,r-2.4,null,"#646870",1);
    ellipse(c,x,y,r-(motor?5.1:4.2),r-(motor?5.1:4.2),motor?"#b3c0b9":"#e0e3cc",outline,1.25);
    const inside=r-(motor?6.7:5.75);
    if(!motor) {
      c.save(); c.globalCompositeOperation="destination-out";ellipse(c,x,y,inside,inside,"#000");c.restore();
    } else ellipse(c,x,y,inside,inside,"#637978",outline,.8);
    const n=motor?5:9;
    for(let i=0;i<n;i++) {
      const a=i*TAU/n+turn;
      line(c,x,y,x+Math.cos(a)*inside,y+Math.sin(a)*inside,motor?"#bdcbc0":"#acbbb2",motor?2.4:.85);
    }
    ellipse(c,x,y,motor?4.4:2.9,motor?4.4:2.9,steel,outline,1.2);
    if(!motor) {
      const a=turn+.65;
      line(c,x+Math.cos(a)*inside*.58,y+Math.sin(a)*inside*.58,x+Math.cos(a)*inside*.82,y+Math.sin(a)*inside*.82,"#e5b572",2.2);
    }
  }

  function bike(c,electric,turn) {
    const body=electric?jade:"#dcab77", shining=electric?mint:"#f6d29a";
    wheels(c,39,119,24,turn);wheels(c,138,119,24,turn);
    // A gently curved chain guard, comfortable step-through frame and real pedal.
    paint(c,"M38 118 Q59 114 79 112 Q87 113 87 120 Q86 126 77 126 L40 123 Q35 123 38 118Z","#9cae9f",outline,1.4);
    pipe(c,39,118,73,85,body,3);
    pipe(c,77,119,71,83,body,4.5);
    paint(c,"M77 118 Q103 113 120 79",null,outline,8);
    paint(c,"M77 118 Q103 113 120 79",null,body,5.5);
    paint(c,"M73 92 Q93 99 116 86",null,outline,5.4);
    paint(c,"M73 92 Q93 99 116 86",null,shining,3.3);
    pipe(c,118,77,138,119,steel,3.2);
    pipe(c,121,85,115,66,body,3.1);
    paint(c,"M115 67 Q117 60 125 62 L130 62",null,outline,3.3);
    line(c,124,62,131,62,"#916f63",3);
    paint(c,"M127 63 Q140 73 125 85",null,fine,1);
    pipe(c,71,83,69,78,steel,2.5);
    paint(c,"M59 77 Q60 73 68 74 Q74 76 81 76 Q86 77 82 80 Q72 83 63 81 Q59 81 59 77Z","#966d60",outline,1.5);
    if(electric) {
      paint(c,"M86 110 Q98 103 107 94 Q110 92 113 95 Q116 98 113 101 Q102 114 90 118 Q86 119 84 115Z","#54877f",outline,1.4);
      line(c,90,111,101,103,paleMint,2);
      ellipse(c,121,73,4,3,cream,outline,1.1);
    }
    ellipse(c,78,118,6.2,6.2,"#91a49f",outline,1.2);
    const px=78+Math.cos(turn)*10,py=118+Math.sin(turn)*9;
    line(c,78,118,px,py,outline,3);line(c,px-4,py+1,px+4,py+1,steel,2.4);
  }

  function kickboard(c,turn) {
    wheels(c,44,132,10.5,turn,true);wheels(c,130,132,10.5,turn,true);
    paint(c,"M41 120 Q44 118 50 120 L99 120 Q106 120 111 111 L117 110 Q111 127 103 128 L50 128 Q43 127 41 124Z",mint,outline,2);
    paint(c,"M52 120 Q71 121 98 120",null,paper,1.7);
    pipe(c,130,131,115,56,steel,4);
    pipe(c,120,82,115,56,"#ca927c",5);
    paint(c,"M104 56 Q112 53 124 55",null,outline,5.4);
    line(c,106,55,112,54.5,"#8d766f",2);
    paint(c,"M44 119 Q32 119 32 127",null,outline,3.8);
    ellipse(c,118,65,3.5,2.3,paper,outline,1);
  }

  function motorcycle(c,sport,turn) {
    wheels(c,37,120,22.5,turn,true);wheels(c,141,120,22.5,turn,true);
    pipe(c,36,120,79,107,steel,7);pipe(c,127,78,141,120,steel,6);
    paint(c,"M117 108 Q138 89 157 110 Q159 113 156 114 Q139 104 121 113 Z",sport?"#db8877":mint,outline,1.7);
    if(sport) {
      paint(c,"M16 85 Q27 80 48 83 L67 85 Q73 77 85 77 Q97 75 107 81 Q116 79 122 67 Q136 69 144 79 Q144 88 129 94 L110 118 Q96 128 78 121 L49 99 Q30 91 17 91Z",wash(c,70,124,"#f8b59a","#db8377"),outline,2);
      paint(c,"M93 106 Q110 94 132 87 Q126 97 115 105 L104 118 Q96 122 83 115Z","#ba706d",outline,1.4);
      paint(c,"M105 101 Q118 94 126 94 L116 101 L106 106 Z",cream,null);
      paint(c,"M65 99 Q84 98 96 106 L89 118 Q74 119 65 111Z","#667479",outline,1.5);
      paint(c,"M115 76 Q126 67 122 55 Q132 57 139 72 L136 76Z","#b6d4ce",outline,1.65);
      paint(c,"M121 65 L125 69 M127 60 L131 68",null,paper,1.1);
      paint(c,"M135 77 L143 78 L139 84 L129 85Z",paper,outline,1.2);
    } else {
      paint(c,"M14 104 C16 89 28 80 49 80 Q62 80 72 86 Q76 96 80 105 Q83 108 97 107 Q104 103 111 79 L115 66 Q121 59 129 67 Q134 72 131 80 Q124 94 122 109 Q119 117 108 119 L76 118 Q66 116 58 105 Q45 95 27 102 L19 107 Q15 109 14 104Z",wash(c,63,120,"#b3d6b7","#77ad9a"),outline,2);
      paint(c,"M21 99 Q29 87 46 87 Q58 87 62 94 Q58 100 51 103 Q36 98 24 104Z","#a6cbb2",outline,1.2);
      paint(c,"M28 95 Q36 90 44 91 M29 98 Q36 94 42 94",null,"#779e8e",1.2);
      paint(c,"M105 105 Q112 94 116 75",null,"#e0e7cd",2.8);
      paint(c,"M72 109 Q87 114 102 111",null,outline,2.4);
      ellipse(c,128,68,6.5,5.4,cream,outline,1.6);
      ellipse(c,130,67,3.2,2.8,"#fffce9",null);
    }
    paint(c,"M41 80 Q44 76 52 77 L73 77 Q78 78 76 82 Q67 86 56 84 L43 84 Q38 84 41 80Z","#8a695e",outline,1.65);
    paint(c,"M18 108 L49 114 Q55 116 52 120 L47 122 L18 116 Q14 114 18 108Z","#b7bfb3",outline,1.6);
    line(c,119,70,111,65,outline,3.2);line(c,109,65,115,66,"#8a746a",2.2);
    ellipse(c,21,87,3.8,2.5,"#ef9984",outline,1);
    if(!sport) {
      paint(c,"M16 64 Q16 61 19 61 L40 61 Q44 61 44 65 L44 79 L16 79Z",mint,outline,1.65);
      paint(c,"M16 66 L44 66",null,jade,1.2);leaves(c,30,72,.42,cream);
    }
  }

  function riding(c,female,v,moving,boost,t) {
    const motor=v==="moto"||v==="sport",kick=v==="kickboard";
    const turn=moving?t/(boost?85:145):-.28;
    const bump=moving?Math.sin(t/175)*.8:Math.sin(t/830)*.28;
    if(kick) kickboard(c,turn);
    else if(motor) motorcycle(c,v==="sport",turn);
    else bike(c,v==="ebike",turn);
    const hx=kick?79:76,hy=(kick?93:85)+bump;
    const sc=kick?.94:.86,lean=kick?.025:v==="sport"?.24:motor?.12:.15;
    const hFar=[hx-4,hy],hNear=[hx+2,hy+1];
    const axle=[78,118],pedal=[Math.cos(turn)*10,Math.sin(turn)*9];
    const farFoot=kick?[56,118]:motor?[82,106]:[axle[0]-pedal[0]-3,axle[1]-pedal[1]-3];
    const nearFoot=kick?[83,118]:motor?[94,109]:[axle[0]+pedal[0]-3,axle[1]+pedal[1]-3];
    limbs(c,hFar,kneeFor(hFar,farFoot,kick?21:23),farFoot,true);
    sneaker(c,...farFoot,.77,-.06,true);
    limbs(c,hNear,kneeFor(hNear,nearFoot,kick?20:23),nearFoot,false);
    sneaker(c,...nearFoot,.83,-.04,false);
    const grip=kick?[117,55]:motor?[113,66]:[128,62];
    const dx=(grip[0]-hx)/sc,dy=(grip[1]-hy)/sc;
    const hand=[dx*Math.cos(lean)+dy*Math.sin(lean),-dx*Math.sin(lean)+dy*Math.cos(lean)];
    transform(c,hx,hy,sc,lean,() => torso(c,female,[hand[0]*.49+3,hand[1]*.44-9],hand,-lean*.65,t));
  }
  function car(c,female,turn,occupied,t) {
    wheels(c,43,121,18.5,turn,true);wheels(c,136,121,18.5,turn,true);
    paint(c,"M8 99 Q8 90 21 85 L31 73 Q41 54 54 50 Q65 46 90 47 Q108 47 121 61 L137 79 Q160 81 169 91 Q174 98 171 111 L167 118 Q162 123 156 122 Q153 103 138 102 Q120 100 116 123 L63 123 Q60 103 45 101 Q28 101 23 120 Q10 120 8 113Z",wash(c,48,122,"#eebca1","#d99689"),outline,2.2);
    paint(c,"M30 75 Q40 55 55 51 Q70 46 91 49 Q109 50 120 63 L135 80 L29 81Z","#e9d8ba",outline,1.45);
    paint(c,"M33 77 Q41 59 55 55 Q63 52 71 53 L70 77Z",wash(c,54,78,"#d4e7dd","#9abfb6"),outline,1.55);
    paint(c,"M76 53 Q94 51 105 57 Q116 63 128 78 L76 77Z",wash(c,53,79,"#cfe5d9","#a3c1b5"),outline,1.55);
    c.save();
    const glass=new Path2D("M76 53 Q94 51 105 57 Q116 63 128 78 L76 77Z");c.clip(glass);
    if(occupied) {
      paint(c,"M88 82 Q89 69 99 70 Q110 69 113 81Z",cream,outline,1.3);
      transform(c,99,65,.44,-.035,()=>face(c,female,0));
    }
    paint(c,"M112 60 L122 76 M116 64 L124 74",null,"#e8ede0",1.4);
    c.restore();
    paint(c,"M39 72 Q47 59 54 58",null,"#f0f1db",2);
    paint(c,"M41 70 Q41 68 45 68 L61 68 Q64 68 64 71 L64 76 L40 76Z",mint,outline,1.1);
    paint(c,"M39 71 L64 71",null,jade,.9);
    paint(c,"M11 96 Q41 82 76 84 Q113 84 153 85",null,"#f8d7b8",2.1);
    paint(c,"M73 84 L72 107 Q72 114 79 114 L107 114 Q113 110 116 100",null,"#b3837a",1.2);
    paint(c,"M64 119 Q91 121 116 118",null,"#b9837d",2.2);
    paint(c,"M23 111 Q31 98 43 98 Q54 98 61 107 M119 108 Q125 99 137 99 Q150 100 156 110",null,"#b77e75",1.3);
    paint(c,"M160 90 Q170 92 169 98 Q163 101 155 98 Q153 94 160 90Z",cream,outline,1.35);
    paint(c,"M10 95 Q13 93 17 93 L16 102 L10 104Z","#d57d72",outline,1.2);
    paint(c,"M156 111 Q164 112 172 108 L171 115 Q168 118 158 118Z","#d8d5c1",outline,1.2);
    line(c,78,88,85,88,"#936f68",2.6);ellipse(c,124,78,4.9,2.9,"#d69a87",outline,1.1);
    ellipse(c,94,101,8,8,"#f3d8ac");leaves(c,94,100.8,.57,jade);
  }

  function rocket(c,female,t,occupied,boost) {
    const pulse=Math.sin(t/95)*.5+.5, flame=boost?1.16:.77;
    transform(c,44,99,1,0,() => {
      c.save();c.scale(flame*(.87+.13*pulse),1);
      paint(c,"M0 -9 Q-10 -12 -20 -7 Q-13 -4 -17 -3 Q-30 -2 -39 2 Q-25 2 -19 6 Q-13 10 -2 8Z","#f3a171","#ac7164",1.45);
      paint(c,"M-1 -4 Q-9 -6 -15 -3 Q-9 -2 -20 2 Q-8 1 -3 5Z","#ffdc88",null);
      c.restore();
    });
    paint(c,"M58 86 Q50 72 42 64 Q44 54 53 58 Q70 61 84 80Z",mint,outline,1.9);
    paint(c,"M45 61 Q56 64 66 73",null,paleMint,1.4);
    paint(c,"M44 87 C75 70 132 70 165 88 Q176 94 176 99 Q172 107 151 112 Q124 120 68 114 L45 108 Q41 101 44 87Z",wash(c,78,116,"#fff3d9","#e4c9ad"),outline,2.1);
    paint(c,"M139 79 Q160 83 173 93 Q178 97 174 102 Q168 108 152 111 Q159 94 139 79Z","#87bca7",outline,1.4);
    paint(c,"M151 84 Q161 88 166 93",null,"#c5dcc0",2);
    paint(c,"M52 104 Q77 114 109 112 Q130 112 146 109",null,"#c2a993",1.7);
    paint(c,"M43 87 Q48 84 53 85 Q50 98 55 110 Q49 112 43 108 Q38 98 43 87Z","#839f99",outline,1.55);
    paint(c,"M51 86 Q51 96 53 103",null,paleMint,1.2);
    paint(c,"M76 107 Q68 119 56 129 Q68 133 76 129 Q91 122 99 110Z","#85b5a1",outline,1.7);
    paint(c,"M68 125 Q81 119 88 112",null,paleMint,1.5);
    paint(c,"M73 79 Q77 65 89 57 Q100 51 111 58 Q120 64 126 78 Q101 84 73 82Z",wash(c,55,83,"#d8e8db","#9ac1bc"),outline,1.8);
    c.save();c.clip(new Path2D("M76 80 Q79 66 91 59 Q102 54 110 60 Q120 66 123 78 Q101 82 76 80Z"));
    if(occupied) {
      paint(c,"M88 86 Q87 72 99 71 Q108 72 111 84Z",cream,outline,1.25);
      transform(c,99,71,.54,0,()=>face(c,female,0));
    }
    c.restore();
    paint(c,"M79 73 Q82 66 88 63 M82 74 L84 71",null,"#eff4e1",1.7);
    paint(c,"M72 81 Q101 84 126 78",null,outline,2.5);
    ellipse(c,109,97,8.5,8.5,mint,outline,1);leaves(c,109,96.5,.62,paper);
    ellipse(c,64,99,2.2,2.2,"#eab695",fine,.9);
    ellipse(c,72,100,1.4,1.4,"#c4b2a1");
  }

  function garageShoe(c) {
    transform(c,80,85,1.06,-.08,()=>{
      paint(c,"M-40 -4 Q-34 -13 -32 -25 Q-28 -32 -21 -24 Q-12 -16 -3 -20 L9 -28 Q14 -31 18 -25 Q19 -17 29 -11 Q37 -6 45 -4 Q56 0 57 7 Q57 16 45 17 L-34 17 Q-46 16 -46 8 Q-46 0 -40 -4Z",wash(c,-28,17,"#fff2d6","#e4cbb0"),outline,2.2);
      paint(c,"M-34 -16 Q-35 -7 -43 1 L-44 7 Q-27 10 -17 6 L-8 1 Q-22 -1 -25 -13Z",mint,outline,1.45);
      paint(c,"M-18 -9 Q-7 -5 -1 -10 L7 -19 Q9 -20 12 -16 Q7 -8 -1 -2 Q-9 4 -17 3Z",jade,null);
      paint(c,"M15 -17 Q26 -5 41 -3 Q33 0 29 7",null,"#c4a48f",1.3);
      paint(c,"M-45 7 Q-12 11 19 8 Q44 7 55 4 Q60 11 52 15 Q37 19 -31 18 Q-46 18 -45 7Z",paper,outline,1.6);
      paint(c,"M-34 14 Q-4 16 25 13",null,"#d6c8b4",1.35);
      paint(c,"M4 -18 L13 -20 M9 -14 L18 -16 M14 -10 L23 -12",null,"#a8988d",2);
    });
  }

  const foodLine="#765247";
  function burger(c) {
    paint(c,"M8 48 Q7 53 12 59 Q16 66 40 66 Q62 66 68 59 Q72 54 70 48Z",wash(c,47,65,"#f3bf75","#d89753"),foodLine,1.8);
    paint(c,"M14 59 Q29 64 52 62",null,"#ffd593",1.7);
    paint(c,"M9 42 C12 37 22 38 27 39 Q44 35 58 39 Q70 38 72 45 C75 51 68 55 61 54 Q49 58 37 55 Q23 58 13 54 Q5 53 7 47Z",wash(c,37,56,"#99624b","#765044"),foodLine,2);
    paint(c,"M13 47 Q16 44 20 45 M26 50 L29 49 M55 48 Q58 46 61 47 M38 43 L41 43",null,"#b6825c",1.55);
    paint(c,"M8 40 Q26 36 42 38 L68 39 L66 44 Q57 45 52 49 Q50 51 47 48 L42 46 L28 50 Q26 51 24 48 L20 45 L10 45Z","#f6bb57",foodLine,1.35);
    paint(c,"M10 38 Q11 34 18 34 L62 34 Q69 34 70 38 Q70 42 64 43 L17 43 Q10 42 10 38Z","#d97558",foodLine,1.3);
    paint(c,"M8 33 Q14 29 20 32 Q26 28 32 31 Q40 28 45 31 Q51 28 57 31 Q65 28 72 33 Q76 37 71 39 Q67 42 61 38 Q56 37 53 40 Q48 43 44 39 Q40 36 36 39 Q29 43 24 39 Q20 36 17 39 Q13 42 9 39 Q5 38 8 33Z","#87b174","#608361",1.5);
    paint(c,"M8 31 C9 17 20 7 37 5 Q58 3 69 21 Q72 26 72 32 Q70 36 61 36 Q35 39 11 34 Q7 34 8 31Z",wash(c,4,37,"#f7ce84","#e5a35f"),foodLine,1.9);
    paint(c,"M13 25 Q19 12 32 10 M12 29 L13 27",null,"#ffe0a1",2.5);
    for(const [x,y,a] of [[22,23,-.55],[29,15,-.5],[39,11,-.1],[49,15,.4],[57,21,.55],[36,24,.18],[65,27,.65],[46,26,-.2]]) ellipse(c,x,y,2.15,.85,cream,null,1,a);
  }

  function pizza(c) {
    paint(c,"M9 20 Q7 15 13 11 Q28 2 45 6 Q59 8 70 18 Q73 22 67 26 L27 64 Q24 69 21 62 Q18 53 17 47 Q14 46 14 42 Q14 38 15 36Z",wash(c,15,63,"#ffd478","#ecac59"),foodLine,1.9);
    paint(c,"M10 22 Q25 11 45 14 Q59 16 67 25 L61 30 Q47 21 31 23 Q22 22 14 29Z","#d97a50",foodLine,1.15);
    paint(c,"M9 20 Q7 15 15 10 C32 1 56 6 69 17 Q74 22 70 26 Q68 30 62 26 C49 15 29 12 15 22 Q11 24 9 20Z","#e7ad69",foodLine,1.75);
    paint(c,"M14 15 Q29 7 43 10 M50 12 Q57 14 63 18",null,"#ffe0a0",2.3);
    for(const [x,y,r] of [[25,31,5.9],[47,28,6.7],[28,47,5.9]]) {
      ellipse(c,x,y,r,r*.85,"#d77d5f","#a4624e",1.15,-.25);
      ellipse(c,x-1.6,y-1.3,1.5,1.05,"#eea582");ellipse(c,x+2,y+1,1.1,.7,"#aa634e");
    }
    paint(c,"M37 32 Q40 28 43 31 Q41 35 37 34Z M32 39 Q37 36 38 38 Q36 42 33 42Z","#7e9c65",null);
    paint(c,"M21 51 Q23 54 23 58 M53 31 L56 30",null,"#ffe5a2",1.55);
  }

  function chicken(c) {
    paint(c,"M49 24 L59 14 Q57 10 60 8 Q64 6 66 10 Q69 7 72 11 Q75 16 69 18 L57 29Z",cream,foodLine,1.45);
    paint(c,"M39 37 C31 31 36 18 43 17 Q46 12 51 15 Q56 14 59 20 Q62 26 56 32 Q51 41 44 40Z","#d49a58",foodLine,1.65);
    paint(c,"M12 45 Q5 39 11 31 Q10 25 16 23 Q19 16 25 19 Q29 16 33 22 Q40 25 37 33 Q40 43 29 48Z","#e0a45d",foodLine,1.7);
    paint(c,"M34 44 Q27 38 31 31 Q29 25 37 23 Q43 20 48 26 Q56 26 57 35 Q66 34 69 40 L65 49Z","#e5ad67",foodLine,1.6);
    paint(c,"M13 31 Q15 25 20 26 M21 22 Q24 21 27 24 M38 30 Q40 27 43 28 M44 18 Q48 17 50 19 M50 23 L53 24 M17 36 L21 34",null,"#f7c77e",2.3);
    paint(c,"M6 37 Q21 44 38 41 Q58 43 72 36 L66 56 C64 62 56 66 39 66 Q17 65 13 60Z",wash(c,39,65,"#ffe7c3","#e9bd95"),foodLine,1.8);
    paint(c,"M12 41 L19 43 L26 64 L21 62Z M29 44 L36 44 L40 65 L33 64Z M50 44 L57 42 L56 63 L48 65Z M65 40 L70 37 L66 53 L62 59Z","#dc927a",null);
    paint(c,"M7 37 Q23 43 39 41 Q57 42 72 36",null,foodLine,2.3);
    ellipse(c,40,54,7.8,6.2,cream,null);
    leaves(c,40,53.8,.46,"#ba7965");
  }

  function noodles(c) {
    paint(c,"M26 15 Q22 12 26 9 Q28 7 25 4 M36 13 Q32 10 36 7",null,"#d9b99a",1.45);
    pipe(c,31,37,58,5,"#c1976e",1.85);pipe(c,41,35,69,9,"#d2a77d",1.85);
    paint(c,"M6 34 Q11 23 39 24 Q63 23 73 33 L71 40 Q66 55 52 61 L49 65 Q41 68 29 65 L28 62 Q11 56 6 39Z",wash(c,26,66,"#fff2d7","#d9c6ab"),foodLine,1.85);
    ellipse(c,39.5,34,32.8,9.55,"#ce976a",foodLine,1.5);
    c.save();c.clip(new Path2D("M8 34 Q12 26 38 26 Q62 25 71 34 Q68 41 40 42 Q12 41 8 34Z"));
    for(const [x,y] of [[8,32],[22,29],[39,29],[15,36],[32,34],[49,33]]) {
      transform(c,x,y,1,0,()=>paint(c,"M0 3 Q4 -2 9 1 T18 1 Q23 -1 24 2 Q24 4 21 6",null,"#f6d48d",2.1));
    }
    ellipse(c,52,30,8.7,5.5,cream,"#bd976e",1.1,-.24);
    ellipse(c,53,30,4.3,2.9,"#f2b65f",null,1,-.24);
    for(const [x,y] of [[18,32],[27,37],[43,32],[60,35]]) ellipse(c,x,y,2.4,1.2,mint,"#608968",1.1,-.3);
    c.restore();
    paint(c,"M7 34 Q15 42 40 43 Q63 43 72 34",null,cream,2);
    paint(c,"M12 44 Q38 59 67 43",null,jade,3);
    paint(c,"M18 50 Q40 61 60 51",null,"#a6c2ac",1.4);
    paint(c,"M31 63 Q40 66 48 63",null,"#b59c8a",1.1);
  }

  function sushi(c) {
    paint(c,"M4 46 L26 28 Q29 25 34 26 L67 29 Q71 29 74 33 L77 42 Q77 45 73 48 L53 61 Q48 65 43 64 L11 59 Q6 58 5 55Z","#d0a77f",foodLine,1.6);
    paint(c,"M5 46 L29 29 Q32 27 36 28 L69 32 Q72 32 72 35 Q70 40 50 53 Q46 57 41 56 L10 51 Q5 50 5 46Z","#e4bf8c",foodLine,1.1);
    for(const [x,y,a] of [[42,15,-.08],[13,26,-.1]]) {
      transform(c,x,y,1,a,()=>{
        paint(c,"M0 12 Q1 4 9 4 Q14 1 23 6 Q28 9 29 16 Q28 23 20 25 Q13 27 3 22 Q-2 20 0 12Z",cream,foodLine,1.55);
        paint(c,"M3 18 Q4 21 6 20 M10 22 L12 23 M19 22 Q23 22 24 19",null,"#d4bea4",1.1);
        paint(c,"M-2 12 Q1 4 9 1 Q15 -4 26 4 Q32 7 29 13 Q26 18 18 17 Q10 15 3 18 Q-.4 19 -2 16Z",wash(c,0,18,"#f5b49a","#e29a80"),foodLine,1.5);
        paint(c,"M3 8 Q10 8 16 15 M10 3 Q17 5 24 13 M17 2 Q23 4 27 8",null,"#ffe0bd",2.15);
      });
    }
    paint(c,"M47 52 Q46 48 50 48 Q50 43 54 45 Q58 44 58 48 Q61 49 58 52 Q54 54 47 52Z","#a0b684","#78936a",1);
  }

  function tteokbokki(c) {
    pipe(c,40,40,62,6,"#d2a579",2);
    paint(c,"M7 33 Q13 23 39 23 Q65 23 73 33 L69 46 Q64 60 53 64 Q38 69 23 61 Q12 57 8 41Z",wash(c,31,65,"#f7c7a7","#df9d88"),foodLine,1.8);
    ellipse(c,40,33.5,32.4,10.4,"#c86f54",foodLine,1.45);
    for(const [x,y,a] of [[14,33,-.42],[26,29,-.2],[34,35,-.45],[47,27,-.15],[51,36,-.5]]) {
      transform(c,x,y,1,a,()=>{
        paint(c,"M0 0 Q-1 -3 3 -4 L12 -4 Q16 -4 16 0 Q16 3 12 4 L3 4 Q0 4 0 0Z","#edac7c","#ac7058",1.15);
        paint(c,"M3 -2 L10 -2",null,"#ffd3a0",1.3);
      });
    }
    for(const [x,y] of [[19,37],[40,30],[61,32]]) ellipse(c,x,y,2.6,1.15,"#9fb878","#729364",.8,-.4);
    paint(c,"M7 33 Q13 43 39 44 Q63 44 73 33",null,cream,2.2);
    paint(c,"M14 47 Q36 57 64 46 M18 53 Q39 62 60 53",null,"#f6d7b4",1.7);
    leaves(c,40,57,.49,"#be816e");
  }

  function sandwich(c) {
    // Two halves of a soft milk-bread sandwich with a cross section of ajitama and egg salad.
    paint(c,"M5 51 Q10 45 20 44 L65 39 Q70 39 72 43 L75 50 Q75 53 69 57 L37 68 Q33 69 27 66 L8 59 Q2 56 5 51Z","#d99888","#916d67",1.4);
    paint(c,"M8 51 L18 49 M17 55 L30 58 M44 62 L64 55",null,"#f8d2b6",1.3);
    transform(c,15,-6,.92,-.035,()=>{
      paint(c,"M7 43 L33 14 Q35 10 39 13 L61 37 Q65 40 62 45 L60 51 L16 58 L7 53Z",wash(c,14,54,"#f9e0b0","#d49e70"),foodLine,1.65);
      paint(c,"M11 44 L35 17 Q37 14 39 17 L59 38 Q61 41 58 43 L17 53 L11 50Z","#fff3d4","#d0ac82",.95);
      paint(c,"M14 51 L58 40 L60 43 L55 46 L19 56 L13 55Z","#95af77","#80936c",.9);
    });
    paint(c,"M8 46 L34 16 Q37 12 41 15 L62 39 Q66 43 63 47 L59 55 L21 64 Q16 65 11 61 L6 56 Q3 51 8 46Z",wash(c,15,64,"#efd09a","#bf8c60"),foodLine,1.75);
    paint(c,"M10 45 L35 18 Q37 16 39 18 L59 40 Q61 42 58 44 L20 58 Q16 59 14 56 L8.5 51 Q7 49 10 45Z",wash(c,17,57,"#fff4d6","#eacc9d"),"#b79670",1.05);
    paint(c,"M13 45 L35 20 Q37 18 39 20 L55 38 Q57 40 54 41 L20 53 Q17 54 15 51 L12 48Z","#e7b956",null);
    paint(c,"M15 47 L23 38 Q29 31 34 29 Q42 26 49 34 Q52 37 51 41 L25 51 Q19 53 15 47Z","#fff5d7","#d9bc83",.95);
    ellipse(c,35.4,39.9,8.6,7.1,light(c,32.4,36.3,13,[[0,"#ffe497"],[.47,"#f7c357"],[1,"#e5a146"]]),"#dca446",.95,-.35);
    ellipse(c,33,37.4,2.3,1.1,"#ffe298",null,1,-.49);
    paint(c,"M10 51 Q14 58 20 57 L59 44 L62 46 L57 49 L21 62 Q16 64 11 58Z","#fff0c7","#c6a178",1);
    for(const [x,y,r] of [[21,39,1.1],[43,29,.85],[18,46,.85],[41,44,.65],[45,35,.6]]) ellipse(c,x,y,r,r*.53,"#91a374",null,1,-.4);
    paint(c,"M10 53 Q12 57 16 59 M27 57 L36 54",null,"#fff5db",1.1);
  }

  const foods={burger,pizza,chicken,noodles,sushi,tteokbokki,sandwich};
  const foodAliases={hamburger:"burger",ramen:"noodles",udon:"noodles",noodle:"noodles",ricecake:"tteokbokki"};
  function drawFood(canvas,id) {
    const c=surface(canvas,80,72);
    (foods[foodAliases[id]||id]||burger)(c);
  }
  function drawTransport(canvas,id) {
    const c=surface(canvas,180,148),v=aliases[id]||id;
    transform(c,0,v==="walk"?0:-16,1,0,()=>{
      if(v==="car") car(c,false,0,false,0);
      else if(v==="rocket") rocket(c,false,0,false,false);
      else if(v==="bike"||v==="ebike") bike(c,v==="ebike",-.28);
      else if(v==="moto"||v==="sport") motorcycle(c,v==="sport",0);
      else if(v==="kickboard") kickboard(c,0);
      else garageShoe(c);
    });
  }
  function drawRider(canvas,opts={}) {
    const c=surface(canvas,180,148),v=aliases[opts.vehicle]||opts.vehicle||"walk";
    const female=opts.gender==="female",moving=!!opts.moving,boost=!!opts.boost,t=Number(opts.time)||0;
    if(v==="car") car(c,female,moving?t/(boost?80:115):0,true,t);
    else if(v==="rocket") transform(c,0,Math.sin(t/405)*(moving?1.8:1),1,0,()=>rocket(c,female,t,true,boost));
    else if(["bike","kickboard","ebike","moto","sport"].includes(v)) riding(c,female,v,moving,boost,t);
    else walker(c,female,moving,boost,t,opts.stride);
  }
  window.RiderArt={drawRider,drawFood,drawTransport};
})();
