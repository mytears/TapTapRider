/* Serve tap-tap-rider on port 4190. Requires playwright; set ART_BROWSER to a Chromium executable. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
async function main() {
  const browser = await chromium.launch({headless:true, ...(process.env.ART_BROWSER ? {executablePath:process.env.ART_BROWSER} : {})});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:4190/qa/art-preview.html');
    await page.waitForFunction(()=>document.getElementById('result').textContent.includes('256'));
    const result=await page.evaluate(async()=>{
      await RiderArt.ready;
      const fixed={bike:[[490,336],[662,285]],ebike:[[1237,327],[1460,300]],kickboard:[[842,369],[1065,360]],moto:[[90,857],[320,832]],sport:[[485,829],[682,809]]};
      const crops={bike:[385,121,376,290],ebike:[1152,145,382,257],kickboard:[795,105,308,302],moto:[19,624,349,276],sport:[391,648,366,251],car:[773,637,370,255]};
      // These visible tire edges were erased by the old off-center wheel masks.
      // Compare to the original painting, independently of the rig's wheel data.
      const tireEdges={sport:[[450,883],[637,846]],ebike:[[1165,330],[1407,332]]};
      const atlas=new Image(); atlas.src='../dist/assets/vehicles-v5.png'; await atlas.decode();
      const issues=[]; let fixedSamples=0, movingWheels=0, alignedTires=0;
      for (const [id,crop] of Object.entries(crops)) {
        const ride=PaintedSprites.rides[id], [x,y,w,h]=ride.box;
        if (Math.abs(w/crop[2]-h/crop[3])>1e-9) issues.push(id+' has stretched wheels');
        const frames=[0,.8,2.1].map(turn=>{
          const canvas=document.createElement('canvas');canvas.width=720;canvas.height=592;
          const c=canvas.getContext('2d');c.scale(4,4);PaintedSprites.vehicle(c,id,turn);
          return c.getImageData(0,0,720,592).data;
        });
        if(tireEdges[id]) {
          const reference=document.createElement('canvas');reference.width=720;reference.height=592;
          const ctx=reference.getContext('2d');ctx.scale(4,4);ctx.drawImage(atlas,...crop,x,y,w,h);
          const original=ctx.getImageData(0,0,720,592).data;
          for(const [sx,sy] of tireEdges[id]) {
            const px=Math.round((x+(sx-crop[0])*w/crop[2])*4), py=Math.round((y+(sy-crop[1])*h/crop[3])*4);
            for(let dx=-1;dx<=1;dx++) for(let dy=-1;dy<=1;dy++) for(let channel=0;channel<4;channel++) {
              const at=((py+dy)*720+px+dx)*4+channel;
              if(frames.some(frame=>Math.abs(frame[at]-original[at])>4)) issues.push(`${id}: wheel overlaps painted tire at ${sx},${sy}`);
            }
            alignedTires++;
          }
        }
        for (const [sx,sy] of fixed[id] || []) {
          const px=Math.round((x+(sx-crop[0])*w/crop[2])*4), py=Math.round((y+(sy-crop[1])*h/crop[3])*4);
          for (let dx=-1;dx<=1;dx++) for (let dy=-1;dy<=1;dy++) for (let channel=0;channel<4;channel++) {
            const at=((py+dy)*720+px+dx)*4+channel;
            // The painted atlas is slightly translucent (alpha ~245/255).
            if (frames.slice(1).some(frame=>Math.abs(frame[at]-frames[0][at])>12)) issues.push(`${id}: fixed hardware moved at ${sx},${sy}`);
          }
          fixedSamples++;
        }
        for (const [sx,sy,r,ry=r] of ride.wheels) {
          let changed=0;
          const cx=(x+(sx-crop[0])*w/crop[2])*4, cy=(y+(sy-crop[1])*h/crop[3])*4, radius=r*w/crop[2]*4, radiusY=ry*h/crop[3]*4;
          for(let py=Math.floor(cy-radiusY);py<=cy+radiusY;py++) for(let px=Math.floor(cx-radius);px<=cx+radius;px++) {
            if(Math.hypot((px-cx)/radius,(py-cy)/radiusY)>.9) continue;
            const at=(py*720+px)*4;
            if(Math.abs(frames[0][at]-frames[1][at])>12 || Math.abs(frames[0][at+3]-frames[1][at+3])>12) changed++;
          }
          if(changed<15) issues.push(id+' wheel did not spin'); else movingWheels++;
        }
      }
      return {issues:[...new Set(issues)],fixedSamples,movingWheels,alignedTires};
    });
    assert.deepEqual(result.issues,[]);
    await page.locator('#motion').click();
    await page.locator('#boost').click();
    if(process.env.ART_SCREENSHOT) await page.screenshot({path:process.env.ART_SCREENSHOT,fullPage:true});
    await page.goto('http://127.0.0.1:4190/dist/');
    await page.evaluate(()=>RiderArt.ready);
    assert.deepEqual(errors,[]);
    console.log(`Passed browser render: 256 poses, ${result.fixedSamples} fixed hardware samples, ${result.movingWheels} rotating wheels, ${result.alignedTires} painted tire edges preserved, correct aspect ratios, game startup.`);
  } finally { await browser.close(); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
