(() => {
  "use strict";
  let ctx,master,beat=0,timer,settings;
  const notes=[0,7,12,7,4,7,12,7,0,7,11,7,3,7,10,7];
  const roots=[48,45,41,43];
  const hz=m=>440*2**((m-69)/12);
  function tone(freq,len,type,vol,at=0,end=freq) {
    if(!ctx||ctx.state!=="running")return;
    const now=ctx.currentTime+at,osc=ctx.createOscillator(),amp=ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),now+len);
    amp.gain.setValueAtTime(.0001,now);amp.gain.exponentialRampToValueAtTime(vol,now+.012);amp.gain.exponentialRampToValueAtTime(.0001,now+len);
    osc.connect(amp);amp.connect(master);osc.start(now);osc.stop(now+len+.015);osc.onended=()=>{osc.disconnect();amp.disconnect()};
  }
  function musicTick(){
    if(!settings?.music||settings.muted||document.hidden||ctx?.state!=="running")return;
    const step=beat%16,root=roots[Math.floor(beat/16)%roots.length];
    tone(hz(root+12+notes[step]),.24,"triangle",.055);
    if(step%4===0)tone(hz(root-12+(step===12?7:0)),.49,"sine",.11);
    if(step%8===4)tone(178,.07,"triangle",.045,0,60);
    beat++;
  }
  function unlock(s){
    settings=s;
    try {
      if(!ctx){const C=window.AudioContext||window.webkitAudioContext;if(!C)return;ctx=new C();master=ctx.createGain();master.gain.value=.60;master.connect(ctx.destination);timer=setInterval(musicTick,210)}
      if(ctx.state==="suspended")ctx.resume().catch(()=>{});
    }catch{}
  }
  function effect(name){
    if(!settings?.sfx||settings.muted||document.hidden)return;
    const seq={click:[72],boost:[60,71],lock:[55,45,38],accept:[67,71,74],arrive:[72,76],pickup:[72,76,79],complete:[67,71,74,79,83],phone:[84,79,84,79]}[name]||[71];
    seq.forEach((n,i)=>tone(hz(n),name==="boost"?.07:.13,"square",.037,i*.077));
  }
  window.RiderSound={unlock,effect};
})();
