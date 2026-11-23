(() => {
  "use strict";
  const shapes = {
    pin:'<path d="M19 9c0 5-7 12-7 12S5 14 5 9a7 7 0 1 1 14 0Z"/><circle cx="12" cy="9" r="2.3"/>',
    settings:'<path d="m9 3 1-2h4l1 2 3 2 2-.1 2 3.5-1.5 2v3.2l1.5 2-2 3.5-2-.1-3 1.6-1 2h-4l-1-2-3-1.6-2 .1-2-3.5 1.5-2v-3.2l-1.5-2 2-3.5 2 .1Z" transform="translate(1 1) scale(.91)"/><circle cx="12" cy="12" r="3"/>',
    coin:'<circle cx="12.2" cy="12.5" r="9" fill="#f3be56" stroke="#c38b37" stroke-width="1.5"/><circle cx="11.6" cy="11.5" r="7.4" fill="#ffda80" stroke="#fff0b9" stroke-width="1.3"/><path d="m8.2 9.5 1.5 5 2-4 2 4 1.5-5" stroke="#ad752c" stroke-width="1.75"/>',
    star:'<path d="M10.8 3.6c.5-1 1.9-1 2.4 0l2.1 4.3 4.8.7c1.2.2 1.6 1.6.8 2.4l-3.5 3.4.8 4.7c.2 1.2-1 2.1-2 1.5L12 18.4l-4.2 2.2c-1 .6-2.2-.3-2-1.5l.8-4.7L3.1 11c-.8-.8-.4-2.2.8-2.4l4.8-.7Z" fill="#f6bd65" stroke="#d79a43" stroke-width="1.2"/>',
    bolt:'<path d="M13.8 2.8 4.9 13.1c-.5.7-.1 1.6.7 1.6l5.3-.2-1.2 6.3c-.1.8.7 1 1.2.4l8.9-11c.5-.7 0-1.4-.8-1.4l-5.4.1 1.4-5.7c.1-.8-.6-1-1.2-.4Z" fill="#fff2ab" stroke="currentColor" stroke-width="1.7"/>',
    sun:'<circle cx="12" cy="12" r="4" fill="currentColor"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M20 4l-2 2M6 18l-2 2"/>',
    moon:'<path d="M20 15A8 8 0 0 1 9 4 9 9 0 1 0 20 15Z" fill="currentColor"/>',
    rain:'<path d="M6 15a4 4 0 0 1 0-8 6 6 0 0 1 11 0 4 4 0 0 1 1 8M8 17l-2 4m7-4-2 4m7-4-2 4"/>',
    map:'<path d="m2 5 6-2 8 3 6-2v15l-6 2-8-3-6 2zm6-2v15m8-12v15"/>',
    expand:'<path d="M14 3h7v7m0-7-7 7M10 21H3v-7m0 7 7-7"/>',
    store:'<path d="M3 10 5 4h14l2 6v2H3zM5 13v7h14v-7M9 20v-5h4v5"/>',
    flag:'<path d="M4 21V3m1 1h15v11H5z" /><path d="M5 4h5v5H5zm10 0h5v5h-5zm-5 5h5v6h-5z" fill="currentColor" stroke="none"/>',
    radio:'<circle cx="12" cy="11" r="2" fill="currentColor"/><path d="m12 13-4 8m4-8 4 8M7.4 6.5a6.6 6.6 0 0 0 0 9M16.6 6.5a6.6 6.6 0 0 1 0 9M4.5 3.7a10.5 10.5 0 0 0 0 14.6m15-14.6a10.5 10.5 0 0 1 0 14.6"/>',
    pulse:'<path d="M2 12h5l3-8 4 16 3-8h5"/>',
    battery:'<path d="M2 7h17v10H2zM21 10v4"/><path d="M5 10h3v4H5zm5 0h3v4h-3z" fill="currentColor" stroke="none"/>',
    garage:'<path d="m2 9 10-6 10 6v12H2zm4 12V10h12v11m-12-7h12M6 17h12"/>',
    history:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2zm3 5h8m-8 4h8m-8 4h4"/>',
    volume:'<path d="M3 9h4l5-5v16l-5-5H3zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16"/>',
    muted:'<path d="M3 9h4l5-5v16l-5-5H3zm13 0 6 6m0-6-6 6"/>',
    fullscreen:'<path d="M3 9V3h6m6 0h6v6m0 6v6h-6m-6 0H3v-6"/>',
    x:'<path d="m5 5 14 14M19 5 5 19"/>',check:'<path d="m3 12 6 6L21 6"/>',
    arrow:'<path d="M3 12h17m-6-6 6 6-6 6"/>',refresh:'<path d="M20 8a8 8 0 1 0 1 7m0-12v6h-6"/>',
    bag:'<path d="M4 8h16l1 13H3zM8 8V6a4 4 0 0 1 8 0v2"/>',
    phone:'<path d="m5 3 4 1 2 5-3 2a12 12 0 0 0 5 5l2-3 5 2 1 4c-1 3-5 3-8 1C7 17 2 11 2 6Z"/>',
    timer:'<circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 1v3m0 4v5h4m2-9 2-2"/>',
    home:'<path d="m2 11 10-9 10 9m-3-2v12H5V9m5 12v-7h4v7"/>',
    steps:'<path d="M2 20h6v-6h6V8h7V3"/>',
    box:'<path d="m3 7 9-5 9 5v11l-9 5-9-5zm0 0 9 5 9-5m-9 5v11M7 5l9 5"/>'
  };
  const icon = name => '<span aria-hidden="true" class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[name] || '')+'</svg></span>';
  function hydrate(root=document) {
    root.querySelectorAll("i[data-icon]").forEach(node => { node.innerHTML=icon(node.dataset.icon); });
  }
  const route = [[26,66],[53,66],[53,43],[91,43],[91,22],[139,22],[139,39],[155,39]];
  function mapPoint(t) {
    const lengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1]));
    let distance=lengths.reduce((a,b)=>a+b,0)*Math.min(1,Math.max(0,t));
    for(let i=0;i<lengths.length;i++) {
      if(distance<=lengths[i]) return route[i].map((v,j)=>v+(route[i+1][j]-v)*distance/lengths[i]);
      distance-=lengths[i];
    }
    return route.at(-1);
  }
  function circle(ctx,x,y,r,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  function neighborhoodMap(width,height) {
    const layer=document.createElement("canvas");
    layer.width=width;layer.height=height;
    const ctx=layer.getContext("2d");
    ctx.scale(width/176,height/82);
    ctx.fillStyle="#d6e9ca";ctx.fillRect(0,0,176,82);
    ctx.lineJoin="round";ctx.lineCap="round";
    ctx.beginPath();ctx.moveTo(-4,0);ctx.bezierCurveTo(20,20,-2,43,13,63);ctx.quadraticCurveTo(19,75,15,90);
    ctx.strokeStyle="#b0dadd";ctx.lineWidth=13;ctx.stroke();
    const blocks=[[24,-4,22,20],[58,0,25,16],[97,4,15,11],[121,-3,11,21],[147,4,21,10],
      [22,28,13,16],[37,27,10,11],[59,29,21,8],[100,29,27,13],[145,24,19,8],
      [22,49,21,10],[64,52,15,13],[83,52,15,9],[105,51,13,13],[128,50,27,11],
      [38,73,17,11],[63,73,23,11],[94,74,23,10],[145,73,12,10]];
    const roofs=["#e9c9ac","#d1d4b9","#ecd7b5","#c7d4c3"];
    blocks.forEach(([x,y,w,h],i)=>{
      ctx.fillStyle="#a2b49d66";ctx.beginPath();ctx.roundRect(x+1,y+1.5,w,h,2.5);ctx.fill();
      ctx.fillStyle=roofs[i%roofs.length];ctx.beginPath();ctx.roundRect(x,y,w,h,2.5);ctx.fill();
    });
    for(const x of [16,53,91,139,173]) {ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,82);ctx.strokeStyle="#fff9e8";ctx.lineWidth=5;ctx.stroke()}
    for(const y of [22,43,66]) {ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(176,y);ctx.strokeStyle="#fff9e8";ctx.lineWidth=5;ctx.stroke()}
    for(const [x,y] of [[31,5],[42,53],[69,4],[85,72],[100,17],[121,61],[158,52],[163,71],[20,72]]){
      circle(ctx,x+1,y+1,3.1,"#b2c9a4");circle(ctx,x,y,3,"#a5c69c");circle(ctx,x-.7,y-.8,1.9,"#b4d4ab");
    }
    ctx.beginPath();route.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.strokeStyle="#fffef5";ctx.lineWidth=5.2;ctx.stroke();
    ctx.strokeStyle="#388e76";ctx.lineWidth=2.8;ctx.setLineDash([4,2.5]);ctx.stroke();ctx.setLineDash([]);
    for(const [x,y,color] of [[91,43,"#d79a34"],[155,39,"#d37361"]]){
      circle(ctx,x,y,4.8,"#fffff7");circle(ctx,x,y,3.5,color);
    }
    return layer;
  }
  const baseMaps=new Map();
  function drawMap(canvas,t=0) {
    if(!canvas) return;
    const key=canvas.width+"x"+canvas.height;
    if(!baseMaps.has(key))baseMaps.set(key,neighborhoodMap(canvas.width,canvas.height));
    const ctx=canvas.getContext("2d");
    ctx.drawImage(baseMaps.get(key),0,0);
    ctx.save();ctx.scale(canvas.width/176,canvas.height/82);
    const [x,y]=mapPoint(t);
    circle(ctx,x,y,7,"#267b6540");circle(ctx,x,y,4.5,"#fffdf4");circle(ctx,x,y,3.15,"#117b64");
    ctx.restore();
  }
  window.GameVisuals={icon,hydrate,drawMap};
})();
