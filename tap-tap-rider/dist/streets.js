(() => {
  "use strict";

  // Coordinates are fractions of the original 3:1 paintings, measured at the
  // shop signs and doorways. The camera and lettering use the same projection.
  const buildings={
    seongsu:{burger:[.365,.460,.210,.077],cafe:[.754,.474,.194,.075],doors:[.361,.766,.100]},
    nowon:{burger:[.404,.460,.168,.074],cafe:[.735,.465,.152,.072],doors:[.440,.724,.092]},
    hongdae:{burger:[.395,.510,.181,.073],cafe:[.785,.519,.148,.068],doors:[.462,.835,.092]}
  };
  const spriteWidth=180;
  const strideUnitsPerKm=2200;

  function project(place,order,phase,progress,terrain){
    const tileWidth=Math.max(terrain.w,terrain.h*3);
    const spriteScale=terrain.riderWidth/spriteWidth;
    const doors=buildings[place.id].doors;
    const door=order.food==="burger"?doors[0]:order.food==="sandwich"?doors[1]:doors[2];
    const pickupWorldX=door*tileWidth;
    const pickupLength=order.pick*strideUnitsPerKm;
    const deliveryLength=(order.dist-order.pick)*strideUnitsPerKm;
    const startScreenX=terrain.w*.23;
    const pickupScreenX=startScreenX+Math.min(terrain.w*.15,pickupLength*spriteScale*.22);
    const endScreenX=pickupScreenX+Math.min(terrain.w*.20,deliveryLength*spriteScale*.22);

    const delivery=phase==="toHome";
    const t=phase==="shopArrive"?1:phase==="toShop"||delivery?progress:0;
    const startX=delivery?pickupScreenX:startScreenX;
    const endX=delivery?endScreenX:pickupScreenX;
    const feetX=startX+(endX-startX)*t;
    const stride=t*(delivery?deliveryLength:pickupLength);
    const origin=delivery?pickupWorldX:pickupWorldX-pickupLength*spriteScale;
    const cameraX=feetX-(origin+stride*spriteScale);
    const targetWorldX=delivery?pickupWorldX+deliveryLength*spriteScale:pickupWorldX;
    return {tileWidth,cameraX,feetX,stride,markerX:targetWorldX+cameraX};
  }

  function makeSign(kind,text,box){
    const label=document.createElement("span");
    label.className="shop-lettering "+kind;
    label.textContent=text;
    const [x,y,w,h]=box;
    label.style.setProperty("--sign-x",x*100+"%");
    label.style.top=y*100+"%";
    label.style.width=w*100+"%";
    label.style.height=h*100+"%";
    label.style.fontSize="calc(var(--tile-width) * "+(h*.25)+")";
    return label;
  }

  function createStrip(element){
    let districtId="",tiles=[],tileSize=0;
    function show(place){
      element.hidden=false;
      if(place.id===districtId)return;
      districtId=place.id;
      element.setAttribute("aria-label",place.name+"버거와 "+place.name+"카페 간판");
      const building=buildings[place.id];
      tiles=[0,1].map(()=>{
        const tile=document.createElement("div");
        tile.className="street-tile";
        tile.setAttribute("aria-hidden","true");
        const art=document.createElement("div");
        art.className="street-painting";
        art.style.backgroundImage='url("assets/'+place.image+'.webp?v=3")';
        tile.append(art,makeSign("burger",place.name+"버거",building.burger),makeSign("cafe",place.name+"카페",building.cafe));
        return tile;
      });
      element.replaceChildren(...tiles);
    }
    function position({tileWidth,cameraX}){
      if(tileWidth!==tileSize){
        element.style.setProperty("--tile-width",tileWidth+"px");
        tileSize=tileWidth;
      }
      const firstTile=Math.floor(-cameraX/tileWidth);
      tiles.forEach((tile,i)=>{
        const index=firstTile+i;
        tile.classList.toggle("reflected",Math.abs(index)%2===1);
        tile.style.transform="translate3d("+(cameraX+index*tileWidth)+"px,0,0)";
      });
    }
    return {show,position};
  }
  window.RiderStreet={project,createStrip};
})();
