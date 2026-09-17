(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const canvas = $('#canvas'), ctx = canvas.getContext('2d'), stage = $('#stage');
  const ink = '#42503c', colors = ['#f6aa8a','#e5c968','#a2b891','#96bcd0','#c0a6d3','#edacbc'];
  const state = { scene:'desktop', tool:'hammer', intensity:2, sound:true, gentle:matchMedia('(prefers-reduced-motion: reduce)').matches, hits:0, uses:{}, totalPops:0, layer:0, layerDamage:0 };
  let W=1000, H=480, dpr=1, tiles=[], bubbles=[], particles=[], marks=[], effects=[], glassShards=[], imported=null, snapshot=null, capturing=false, grenades=[], swarm=[], squishes=[], bugSprites=[];
  let pointer={x:500,y:240,down:false,inside:false,vx:0,vy:0,lastX:500,lastY:240}, lastAction=0, lastFrame=0, audio=null, shake=0, flash=0, toastTimer, resizeTimer;
  let paintColor=0, lastSound=0, audioBus=null, audioRoom=null, noiseBuffer=null;
  let originals=[], bugs=[];
  let buddy={name:'Bop',skin:'#8b5d3b',shirt:'#7f9d62',hair:'crop',face:'brave',x:0,y:0,vx:0,vy:0,rot:0,vrot:0,squash:0,hit:0}, buddyCreated=false, buddyChase={active:false,hidden:false,lastUse:0,message:0}, punchCombo=0;
  let buddyPhoto=null,slapPhoto=null,hammerPhoto=null,laserPhoto=null,paintballPhoto=null;const buddySource=new Image(),slapSource=new Image(),hammerSource=new Image(),laserSource=new Image(),paintballSource=new Image();buddySource.src='assets/vent-buddy-realistic.png';slapSource.src='assets/slap-hand-realistic.png';hammerSource.src='assets/electric-hammer.png';laserSource.src='assets/laser-pistol.png';paintballSource.src='assets/paintball-marker.png';
  let grenadePhoto=null,glovesPhoto=null,washerPhoto=null,stampPhoto=null,flamePhoto=null,gunPhoto=null;
  const grenadeSource=new Image(),glovesSource=new Image(),washerSource=new Image(),stampSource=new Image(),flameSource=new Image(),gunSource=new Image();
  grenadeSource.src='assets/grenade-realistic.png';glovesSource.src='assets/boxing-gloves-realistic.png';washerSource.src='assets/washer-blaster.png';stampSource.src='assets/stamp-realistic.png';flameSource.src='assets/flamethrower-realistic.png';gunSource.src='assets/machine-gun-realistic.png';
  const toolOrder=['hammer','laser','paint','vortex','chainsaw','gun','flame','stamp','termites','washer','bat','grenade','slap','punch'];
  $('.help-grid').append($('#classic-help').content.cloneNode(true));
  const rand=(a,b)=>a+Math.random()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const toolNames={hammer:'Hammer',laser:'Laser',paint:'Paintball',vortex:'Gravity',chainsaw:'Chainsaw',gun:'Machine gun',flame:'Flamethrower',stamp:'Stamp',termites:'Termites',washer:'Restore Potion',bat:'Baseball bat',grenade:'Grenade',slap:'Slap',punch:'Punch'};
  function updateUseCounter(){const uses=state.uses[state.tool]||0;$('#use-count').textContent=`${toolNames[state.tool]} · ${uses.toLocaleString()} ${uses===1?'use':'uses'}${state.totalPops?` · ${state.totalPops.toLocaleString()} pops`:''}`;}
  function recordUse(){state.uses[state.tool]=(state.uses[state.tool]||0)+1;updateUseCounter();}
  function rr(c,x,y,w,h,r,fill,stroke) { c.beginPath(); c.roundRect(x,y,w,h,r); if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();} }
  function text(c,t,x,y,size=14,color=ink,weight='400',font='Arial') {c.fillStyle=color;c.font=`${weight} ${size}px ${font}`;c.fillText(t,x,y);}
  function line(c,x,y,x2,y2,color,width=1) {c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function surface(w,h,draw) {const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);draw(c.getContext('2d'));return c;}
  function removeConnectedLightBackground(image){const scale=Math.min(1,900/image.naturalHeight),c=surface(image.naturalWidth*scale,image.naturalHeight*scale,x=>x.drawImage(image,0,0,image.naturalWidth*scale,image.naturalHeight*scale)),x=c.getContext('2d'),data=x.getImageData(0,0,c.width,c.height),p=data.data;for(let o=0;o<p.length;o+=4){const r=p[o],g=p[o+1],b=p[o+2],lo=Math.min(r,g,b),hi=Math.max(r,g,b);if(lo>178&&hi-lo<25)p[o+3]=0;else if(lo>165&&hi-lo<20)p[o+3]=Math.min(p[o+3],80);}x.putImageData(data,0,0);return c;}
  buddySource.addEventListener('load',()=>buddyPhoto=removeConnectedLightBackground(buddySource));slapSource.addEventListener('load',()=>slapPhoto=removeConnectedLightBackground(slapSource));hammerSource.addEventListener('load',()=>hammerPhoto=removeConnectedLightBackground(hammerSource));laserSource.addEventListener('load',()=>laserPhoto=removeConnectedLightBackground(laserSource));paintballSource.addEventListener('load',()=>paintballPhoto=removeConnectedLightBackground(paintballSource));
  grenadeSource.addEventListener('load',()=>grenadePhoto=grenadeSource);glovesSource.addEventListener('load',()=>glovesPhoto=removeConnectedLightBackground(glovesSource));washerSource.addEventListener('load',()=>washerPhoto=washerSource);stampSource.addEventListener('load',()=>stampPhoto=stampSource);flameSource.addEventListener('load',()=>flamePhoto=flameSource);gunSource.addEventListener('load',()=>gunPhoto=gunSource);
  let batPhoto=null,termiteBoxPhoto=null;const batSource=new Image(),termiteBoxSource=new Image();batSource.src='assets/baseball-bat-realistic.png';termiteBoxSource.src='assets/termite-box-realistic.png';batSource.addEventListener('load',()=>batPhoto=batSource);termiteBoxSource.addEventListener('load',()=>termiteBoxPhoto=termiteBoxSource);
  let chainsawPhoto=null;const chainsawSource=new Image();chainsawSource.src='assets/chainsaw-realistic.png';chainsawSource.addEventListener('load',()=>chainsawPhoto=chainsawSource);
  let gravityPhoto=null;const gravitySource=new Image();gravitySource.src='assets/gravity-orb.png';gravitySource.addEventListener('load',()=>gravityPhoto=removeConnectedLightBackground(gravitySource));
  function addObject(image,x,y,scale=1) {
    const size=Math.max(20,Math.ceil(Math.max(image.width,image.height)/80));
    for(let sy=0;sy<image.height;sy+=size) for(let sx=0;sx<image.width;sx+=size) {
      tiles.push({image,sx,sy,sw:Math.min(size,image.width-sx),sh:Math.min(size,image.height-sy),x:x+sx*scale,y:y+sy*scale,scale,vx:0,vy:0,a:0,va:0,loose:false,life:1});
    }
  }
  function windowChrome(c,w,h,label,bg='#f9faf5') {
    rr(c,1,1,w-2,h-2,11,bg,'#b9c3b0');
    line(c,1,32,w-1,32,'#dce2d5');
    ['#d7a694','#d9ca8b','#b0c194'].forEach((v,i)=>{c.beginPath();c.arc(15+i*13,17,3.2,0,Math.PI*2);c.fillStyle=v;c.fill();});
    text(c,label,65,20,9,'#8f9987');
  }
  function makeDesktop() {
    const scale=Math.min((W-70)/920,(H-100)/330,1.32), ox=(W-920*scale)/2, oy=(H-330*scale)/2-8;
    const place=(im,x,y)=>addObject(im,ox+x*scale,oy+y*scale,scale);
    place(surface(335,240,c=>{
      windowChrome(c,335,240,'Inbox / definitely all urgent');
      text(c,'Inbox',20,65,22,ink,'500');rr(c,270,48,43,24,12,'#e4eaca');text(c,'99+',280,64,11,'#697b46','600');
      ['Quick question…','Following up on my follow-up','Can we hop on a call?','Just circling back'].forEach((t,i)=>{
        const y=92+i*36;line(c,15,y+27,320,y+27,'#e7ebdf');
        rr(c,18,y,22,22,7,['#dce5ca','#e9ddc5','#d1e0dc','#e7d7cf'][i]);text(c,['M','A','J','S'][i],25,y+15,9,'#849276');
        text(c,t,51,y+10,11,'#6a765f');text(c,'A moment ago. Of course.',51,y+22,8,'#a7af9e');
      });
    }),45,20);
    place(surface(165,172,c=>{
      rr(c,0,0,165,172,2,'#f1e5a6');rr(c,51,0,60,13,1,'#e2d496');
      text(c,'tiny to-do list',17,39,17,'#8f8050','400','Georgia');
      ['do the thing','the other thing','one more thing','remember to breathe'].forEach((t,i)=>{rr(c,18,55+i*24,9,9,2,null,'#b9ad70');text(c,t,35,64+i*24,10,'#9e905b');});
    }),697,10);
    place(surface(345,215,c=>{
      windowChrome(c,345,215,'Today / a very full calendar');
      text(c,'Monday, again.',18,62,20,ink,'400','Georgia');
      text(c,'09:00',18,95,9,'#a0aa94');rr(c,64,79,259,33,5,'#dde5cf');text(c,'Meeting about the meeting',77,100,11,'#7a8965');
      text(c,'10:00',18,137,9,'#a0aa94');rr(c,64,120,259,33,5,'#e9e0cb');text(c,'Quick sync (60 minutes)',77,141,11,'#9c8b65');
      text(c,'11:00',18,179,9,'#a0aa94');rr(c,64,161,259,33,5,'#e3d9df');text(c,'Another quick sync',77,182,11,'#998594');
    }),310,99);
    place(surface(173,92,c=>{
      rr(c,1,1,171,90,10,'#f8f9f1','#bcc7af');text(c,'Storage almost full',17,27,12,'#718160','600');text(c,'A familiar feeling.',17,45,10,'#9ca88e');
      rr(c,17,60,139,7,4,'#e6ebdc');rr(c,17,60,126,7,4,'#b9ca8f');
    }),667,210);
    place(surface(97,107,c=>{
      rr(c,12,3,75,58,5,'#b9c999');rr(c,12,0,32,15,4,'#afbf8e');
      text(c,'final_final',10,79,10,'#7e8e6c');text(c,'_FINAL_v7',8,94,10,'#7e8e6c');
    }),183,262);
  }
  function makeGlass() {
    const n=W<600?5:8, size=Math.min(100,(W-100)/(n+0.3));
    for(let row=0;row<3;row++) for(let col=0;col<n;col++) {
      const s=size*.82, colr=colors[(row+col)%colors.length];
      addObject(surface(s,s,c=>{
        rr(c,1,1,s-2,s-2,7,colr+'ba','#ffffff');
        line(c,10,s-13,s-13,10,'#ffffff88',3);line(c,20,s-10,s-10,20,'#ffffff44',1);
        rr(c,5,5,s-10,s-10,5,null,'#ffffff33');
      }), (W-n*size)/2+col*size+size*.09,(H-3*size)/2+row*size+size*.09);
    }
  }
  function makeBubbles() {
    const gap=W<600?39:48, cols=Math.floor((W-95)/gap), rows=Math.max(3,Math.floor((H-120)/gap));
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++) bubbles.push({x:(W-(cols-1)*gap)/2+col*gap,y:(H-(rows-1)*gap)/2+row*gap,r:gap*.36,popped:false,tint:colors[(row+col)%colors.length]});
  }
  function makeSwarm(){
    if(!bugSprites.length)bugSprites=['#5b2d20','#82651f','#294a2c','#70352b'].map((base,type)=>surface(28,22,c=>{c.translate(14,11);c.strokeStyle='#201711';c.lineWidth=1.2;for(let i=-1;i<=1;i++){line(c,i*4,-2,i*6-5,-8,'#211914',1.1);line(c,i*4,2,i*6-5,8,'#211914',1.1);}const g=c.createRadialGradient(-3,-3,1,0,0,10);g.addColorStop(0,type===1?'#ddc05b':'#b27a55');g.addColorStop(.35,base);g.addColorStop(1,'#16130f');c.fillStyle=g;c.beginPath();c.ellipse(0,0,10,5.5,0,0,6.283);c.fill();c.strokeStyle='#0f100d';c.stroke();line(c,0,-5,0,5,'#ffffff28',.7);c.fillStyle='#17130f';c.beginPath();c.arc(-9,0,3.5,0,6.283);c.fill();c.strokeStyle='#9d8057';c.beginPath();c.moveTo(-11,-2);c.lineTo(-15,-6);c.moveTo(-11,2);c.lineTo(-15,6);c.stroke();}));
    swarm=Array.from({length:1000},()=>({x:rand(8,W-8),y:rand(8,H-8),vx:rand(-18,18),vy:rand(-18,18),a:rand(0,6.283),s:rand(1.2,3.2),type:Math.floor(rand(0,4))}));
  }
  function reset(showToast=false) {
    tiles=[];bubbles=[];particles=[];marks=[];effects=[];glassShards=[];bugs=[];grenades=[];swarm=[];squishes=[];shake=0;flash=0;state.hits=0;state.layer=0;state.layerDamage=0;buddyChase={active:false,hidden:false,lastUse:0,message:0};
    $('#session-note').textContent='Nothing to win. Everything to let go.';$('#stage-caption').classList.remove('hidden');
    const currentImage=state.scene==='desktop'?snapshot:state.scene==='image'?imported:null;
    $('#capture-empty').hidden=state.scene!=='desktop'||Boolean(snapshot);
    $('.capture-actions').hidden=state.scene!=='desktop';
    $('#edit-buddy').hidden=state.scene!=='buddy';
    $('.safe-label').textContent=state.scene==='desktop'?'A snapshot only. Your real files stay safe.':'100% pretend. 0 real files harmed.';
    $('#forget').hidden=!snapshot&&!imported;
    stage.classList.toggle('has-snapshot',Boolean(currentImage));
    if(currentImage) {
      const s=Math.min(W/currentImage.width,H/currentImage.height);
      addObject(currentImage,(W-currentImage.width*s)/2,(H-currentImage.height*s)/2,s);
    } else if(state.scene==='bubbles')makeBubbles();else if(state.scene==='glass')makeGlass();else if(state.scene==='swarm')makeSwarm();
    if(state.scene==='buddy')Object.assign(buddy,{x:0,y:0,vx:0,vy:0,rot:0,vrot:0,squash:0,hit:0});
    originals=tiles.map((t,id)=>{t.id=id;return {...t};});
    if(showToast) toast('A fresh start. As many as you need.');
  }
  function resize() {
    const rect=stage.getBoundingClientRect();W=rect.width;H=rect.height;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);reset();
  }
  function initAudio() {
    if(!audio){try{
      audio=new (window.AudioContext||window.webkitAudioContext)();
      const compressor=audio.createDynamicsCompressor();compressor.threshold.value=-16;compressor.knee.value=12;compressor.ratio.value=6;compressor.attack.value=.003;compressor.release.value=.15;
      audioBus=audio.createGain();audioBus.gain.value=.5;audioBus.connect(compressor);compressor.connect(audio.destination);
      audioRoom=audio.createConvolver();const impulse=audio.createBuffer(2,Math.floor(audio.sampleRate*.42),audio.sampleRate);
      for(let ch=0;ch<2;ch++){const room=impulse.getChannelData(ch);for(let i=0;i<room.length;i++)room[i]=(Math.random()*2-1)*Math.pow(1-i/room.length,3.6);}
      audioRoom.buffer=impulse;const roomGain=audio.createGain();roomGain.gain.value=.11;audioBus.connect(audioRoom);audioRoom.connect(roomGain);roomGain.connect(compressor);
      noiseBuffer=audio.createBuffer(1,audio.sampleRate,audio.sampleRate);
      const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
    }catch{return;}}
    if(audio.state==='suspended')audio.resume().catch(()=>{});
  }
  function sound(kind) {
    const interval=kind==='vortex'?140:kind==='laser'?75:kind==='paint'?90:kind==='grenade'?300:kind==='explosion'?40:55;
    if(!state.sound||!audio||!audioBus||audio.state!=='running'||performance.now()-lastSound<interval)return;lastSound=performance.now();
    const now=audio.currentTime, strength=(state.gentle?.22:.65)*(.7+state.intensity*.15), pitch=rand(.91,1.09);
    // Each hit combines transient, body, and decay; short voice lifetimes bound audio work.
    function voice(type,freq,end,duration,level,delay=0,filterType='lowpass',q=.7){
      const start=now+delay, gain=audio.createGain(), pan=audio.createStereoPanner();
      pan.pan.value=clamp((pointer.x/W-.5)*1.2,-.65,.65);
      gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,level*strength),start+.003);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
      gain.connect(pan);pan.connect(audioBus);
      let source,filter;
      if(type==='noise'){
        source=audio.createBufferSource();source.buffer=noiseBuffer;
        filter=audio.createBiquadFilter();filter.type=filterType;filter.Q.value=q;
        filter.frequency.setValueAtTime(freq*pitch,start);filter.frequency.exponentialRampToValueAtTime(Math.max(30,end*pitch),start+duration);
        source.connect(filter);filter.connect(gain);source.start(start,rand(0,.2));
      }else{source=audio.createOscillator();source.type=type;source.frequency.setValueAtTime(freq*pitch,start);source.frequency.exponentialRampToValueAtTime(Math.max(20,end*pitch),start+duration);source.connect(gain);source.start(start);}
      source.stop(start+duration+.02);source.onended=()=>{source.disconnect();filter?.disconnect();gain.disconnect();pan.disconnect();};
    }
    if(kind==='slap'){
      voice('noise',4200,850,.075,.72,0,'bandpass',1.8);voice('triangle',230,75,.12,.3);voice('noise',7600,2400,.025,.22,.025,'highpass');
    }else if(kind==='punch'){
      voice('sine',115,38,.2,.9);voice('noise',1200,180,.11,.58,0,'lowpass',.8);voice('triangle',260,62,.1,.28,.018);
    }else if(kind==='bat'){
      voice('noise',1250,240,.11,.5,0,'bandpass',1.1);voice('sine',190,58,.19,.72);voice('triangle',420,95,.08,.18,.018);
      voice('noise',3200,650,.035,.2,.055,'highpass');
    }else if(kind==='grenade'){
      voice('sine',1150,720,.08,.13);voice('noise',5200,1700,.035,.2,0,'highpass');voice('triangle',330,160,.13,.12,.055);
    }else if(kind==='explosion'){
      voice('noise',2200,55,.82,1);voice('sine',92,24,.72,1);voice('triangle',185,38,.35,.65);
      voice('noise',7800,850,.09,.7,0,'highpass');voice('noise',900,120,.95,.36,.08,'bandpass',.55);
      for(let i=0;i<5;i++)voice('noise',rand(1800,5200),rand(250,700),rand(.05,.16),.12,rand(.05,.32),'bandpass',2);
    }else if(kind==='chainsaw'){
      voice('sawtooth',92,72,.13,.17);voice('sawtooth',187,146,.12,.065);voice('noise',2800,800,.11,.28,0,'bandpass',1.2);
    }else if(kind==='gun'){
      voice('noise',5800,1000,.055,.48);voice('sine',185,48,.105,.55);voice('noise',2200,900,.04,.12,.065,'bandpass',3);
    }else if(kind==='flame'){
      voice('noise',1150,480,.2,.4);voice('sine',80,45,.17,.15);voice('noise',3300,900,.035,.14,.045,'highpass');
    }else if(kind==='stamp'){
      voice('sine',160,55,.11,.5);voice('noise',850,220,.065,.32);
    }else if(kind==='termites'){
      voice('noise',1900,700,.035,.11,0,'bandpass',3);voice('noise',2200,900,.025,.07,.04,'bandpass',2);
    }else if(kind==='washer'){
      voice('noise',4500,1800,.14,.2,0,'highpass');voice('noise',1700,600,.13,.12,0,'bandpass',.8);
    }else if(kind==='pop'){
      voice('sine',rand(520,850),75,.055,.7);voice('noise',2800,650,.035,.5,0,'bandpass',1.2);voice('noise',1000,250,.08,.12,.014);
    }else if(kind==='hammer'){
      voice('sine',150,42,.22,.95);voice('triangle',290,95,.075,.22);voice('noise',2200,280,.12,.65);
      voice('noise',6500,1700,.032,.46,0,'highpass');
      // A sharp electric crack followed by a delayed, rolling thunder body.
      voice('noise',9000,900,.09,.82,0,'highpass',.5);voice('sine',72,24,.9,.92,.055);voice('noise',520,38,1.15,.72,.075,'lowpass',.45);
      for(let i=0;i<(state.gentle?1:4);i++)voice('noise',rand(170,420),35,rand(.28,.7),.22,rand(.12,.48),'lowpass',.7);
      const glass=state.scene==='glass';
      for(let i=0;i<(state.gentle?2:5);i++){
        const delay=.025+i*rand(.022,.045), f=rand(glass?2200:850,glass?6200:2800);
        voice('sine',f,f*.86,rand(.05,.16),glass?.15:.045,delay);
        voice('noise',glass?6800:2700,glass?2400:700,.045,glass?.16:.09,delay,'bandpass',2);
      }
    }else if(kind==='paint'){
      voice('noise',1800,450,.16,.22,0,'bandpass',.8);voice('sine',280,55,.09,.35);voice('noise',900,160,.06,.25);
      voice('sine',430,110,.045,.12,.035);
    }else if(kind==='laser'){
      voice('sawtooth',170,125,.1,.055);voice('noise',4200,2100,.09,.13,0,'bandpass',2.5);voice('triangle',1100,750,.055,.035);
    }else if(kind==='vortex'){
      voice('noise',420,1000,.28,.18,0,'bandpass',1.5);voice('sine',65,90,.3,.24);voice('triangle',130,95,.24,.055);
    }
  }
  function burst(x,y,color,count=12,force=1) {
    const n=state.gentle?Math.min(count,5):count;
    for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-170,170)*force,vy:rand(-230,30)*force,r:rand(1.5,4),color,life:rand(.4,.9),max:1});
    if(particles.length>2400)particles.splice(0,particles.length-2400);
  }
  function shatterGlass(x,y,power=1) {
    const count=state.gentle?5:10+power*4;
    for(let i=0;i<count;i++){
      const a=rand(0,6.283),size=rand(9,27)*(.75+power*.18),points=[];
      const sides=Math.floor(rand(3,6));for(let j=0;j<sides;j++){const q=j/sides*6.283+rand(-.25,.25),r=size*rand(.55,1);points.push([Math.cos(q)*r,Math.sin(q)*r]);}
      const speed=rand(55,210)*(state.gentle?.35:1);
      glassShards.push({x:x+Math.cos(a)*rand(2,15),y:y+Math.sin(a)*rand(2,15),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-rand(45,155),a:rand(0,6.283),va:rand(-8,8),points,life:rand(1.3,2.7),max:2.7,tint:['#e9ffff','#b9e8ee','#dff4d2','#d7d4ff'][state.layer%4]});
    }
    if(glassShards.length>420)glassShards.splice(0,glassShards.length-420);
    state.layerDamage+=power;
    if(state.layerDamage>=12){state.layer=(state.layer+1)%5;state.layerDamage=0;flash=.14;$('#session-note').textContent=`Glass layer released — ${['calm meadow','aurora glow','midnight bloom','sunset haze','crystal ocean'][state.layer]} revealed.`;}
  }
  function act(now) {
    if(capturing||(state.scene==='desktop'&&!snapshot))return;
    const rate=({hammer:160,paint:105,chainsaw:60,gun:85,flame:70,stamp:400,termites:250,washer:65,bat:310,grenade:750,slap:340,punch:145})[state.tool]||35;
    if(now-lastAction<rate)return;lastAction=now;
    recordUse();
    let {x,y}=pointer;const power=state.intensity;
    if(state.scene==='buddy'){
      if(!['slap','punch'].includes(state.tool)){buddyChase.active=true;buddyChase.hidden=false;buddyChase.lastUse=now;buddyChase.message=0;$('#stage-caption').classList.add('hidden');$('#session-note').textContent=`${buddy.name} is too quick — catch the playful dummy!`;return;}
      const cx=W/2+buddy.x,cy=H*.48+buddy.y,hit=Math.hypot((x-cx)*.78,y-cy)<Math.min(150,H*.35);
      if(!hit){effects.push({x,y,r:18,life:.45,color:'#ffffff'});return;}
      const punch=state.tool==='punch',dir=x<cx?1:-1,f=state.gentle?.38:1;if(punch)punchCombo++;
      buddy.vx+=dir*(punch?150:230)*power*f;buddy.vy-=punch?55*power*f:20;buddy.vrot+=dir*(punch?1.8:3.5)*f;buddy.squash=punch?.24:.13;buddy.hit=1;
      state.hits++;sound(state.tool);burst(cx+dir*-45,cy-35,punch?'#f3c95e':'#f6aa8a',punch?20:13,punch?1.25:.85);
      effects.push({x:cx+dir*-42,y:cy-35,r:punch?42:30,life:1,color:punch?'#ffd966':'#ffc3a8'});marks.push({type:'buddy-word',x:cx+dir*-82,y:cy-86,label:punch?'POW!':'SMACK!',life:1});
      if(!state.gentle)shake=punch?7:4;$('#stage-caption').classList.add('hidden');$('#session-note').textContent=punch?`${buddy.name} takes combo ${punchCombo}: ${punchCombo%2?'left jab':'right cross'}!`:`${buddy.name} bounces right back. ${state.hits} playful ${state.hits===1?'hit':'hits'} released.`;return;
    }
    if(state.scene==='swarm'){
      const radius=state.tool==='bat'?100:state.tool==='flame'||state.tool==='washer'?75:42+power*13;let killed=0;
      swarm=swarm.filter(b=>{if(Math.hypot(b.x-x,b.y-y)>radius)return true;killed++;if(killed<35)particles.push({x:b.x,y:b.y,vx:rand(-100,100),vy:rand(-150,-20),r:rand(1,3),color:'#5d442d',life:rand(.2,.55)});if((killed<65||Math.random()<.08)&&squishes.length<180)squishes.push({x:b.x,y:b.y,a:b.a,r:rand(4,9),life:5,max:5,color:['#4b241c','#6c501d','#243d25','#5d2924'][b.type]});return false;});
      if(killed){state.hits+=killed;sound(state.tool==='paint'?'paint':state.tool==='punch'?'punch':state.tool==='slap'?'slap':'hammer');effects.push({x,y,r:radius*.5,life:.6,color:'#f2d36b'});$('#session-note').textContent=`${state.hits} bugs cleared. More are crawling in — keep going!`;}
      return;
    }
    if(state.tool==='gun'){x+=rand(-7,7)*power;y+=rand(-7,7)*power;}
    const radius=state.tool==='laser'?11+power*5:state.tool==='gun'?9+power*4:state.tool==='chainsaw'?24+power*9:state.tool==='bat'?62+power*16:state.tool==='vortex'?90+power*23:30+power*14;
    $('#stage-caption').classList.add('hidden');
    if(state.tool==='grenade'){
      if(grenades.length<8){grenades.push({x,y:y-18,vx:rand(85,155)*(pointer.x<W*.5?1:-1),vy:rand(-230,-170),timer:1.45,a:0,va:rand(-9,9)});sound('grenade');$('#session-note').textContent='Pin out. Give it a moment.';}return;
    }else if(state.tool==='washer'){
      const nearby=t=>Math.hypot(t.x+t.sw*t.scale/2-x,t.y+t.sh*t.scale/2-y)<radius;
      const restore=originals.filter(nearby),ids=new Set(restore.map(t=>t.id));
      tiles=tiles.filter(t=>!ids.has(t.id));tiles.push(...restore.map(t=>({...t})));
      bubbles.forEach(b=>{if(Math.hypot(b.x-x,b.y-y)<radius)b.popped=false;});
      marks=marks.filter(m=>{const hit=Math.hypot(m.x-x,m.y-y)<=radius+(m.r||0)*.3;if(!hit)return true;if(m.type==='paint'){m.wet=Math.min(1,(m.wet||0)+.34);m.vx=(m.x-x)*.055;m.vy=rand(18,42);m.alpha=(m.alpha??.86)-.12;for(let j=0;j<4;j++)particles.push({x:m.x+rand(-m.r,m.r),y:m.y+rand(0,m.r),vx:rand(-16,16)+m.vx*8,vy:rand(35,95),r:rand(2,5),color:m.color,life:rand(.35,.85),water:true});return m.alpha>.08;}return false;});
      bugs=bugs.filter(b=>Math.hypot(b.x-x,b.y-y)>radius);
      for(let i=0;i<(state.gentle?5:13);i++){const a=rand(-.85,.85),speed=rand(130,280);particles.push({x:x+Math.cos(a)*18,y:y+Math.sin(a)*10,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed-rand(20,70),r:rand(2,5),color:i%2?'#9fe4f1':'#e8fbff',life:rand(.25,.55),water:true});}
      effects.push({x,y,r:radius*.45,life:.55,color:'#a8eafa'});sound('washer');
      $('#session-note').textContent='The Restore Potion clears a little room to start again.';return;
    }else if(state.tool==='stamp'){
      marks.push({type:'stamp',x,y,r:48,angle:rand(-.25,.25),label:['DONE','NOPE','NOT TODAY','LET IT GO'][paintColor%4]});sound('stamp');
      if(marks.length>1200)marks.splice(0,marks.length-1200);$('#session-note').textContent='Consider that officially stamped.';return;
    }else if(state.tool==='termites'){
      for(let i=0;i<power+1&&bugs.length<36;i++)bugs.push({x:x+rand(-15,15),y:y+rand(-15,15),angle:rand(0,6.28),life:14,timer:0});
      sound('termites');$('#session-note').textContent='Tiny termites, taking care of the clutter.';return;
    }else if(state.tool==='paint') {
      const color=colors[paintColor%colors.length];marks.push({type:'paint',x,y,r:radius*.42,color,alpha:.86,wet:0,vx:0,vy:0,spots:Array.from({length:10},()=>({x:rand(-radius,radius),y:rand(-radius,radius),r:rand(2,9)}))});
      burst(x,y,color,7,.45);sound('paint');
    }else {
      let count=0;
      if(state.scene==='bubbles') {
        bubbles.forEach(b=>{if(!b.popped&&Math.hypot(b.x-x,b.y-y)<radius+b.r*.35){b.popped=true;b.respawn=rand(1.2,3.2);count++;burst(b.x,b.y,'#ffffff',8,.4);effects.push({x:b.x,y:b.y,r:b.r,life:1,color:'#f8fff0'});}});
        if(count){state.totalPops+=count;updateUseCounter();sound('pop');}
      }else {
        for(const t of tiles) {
          const cx=t.x+t.sw*t.scale/2,cy=t.y+t.sh*t.scale/2,dx=cx-x,dy=cy-y,dist=Math.hypot(dx,dy);
          if(state.tool==='chainsaw'){const a=-.78,lineDistance=Math.abs(-Math.sin(a)*dx+Math.cos(a)*dy);if(lineDistance>12+power*3)continue;}else if(dist>radius)continue;
          if(state.tool==='flame'){t.heat=(t.heat||0)+1;if(t.heat<3)continue;}
          if(!t.loose){t.loose=true;count++;t.life=1;}
          if(state.tool==='vortex') {
            t.vx=(-dx*4-dy*3)*.8;t.vy=(-dy*4+dx*3)*.8;t.va=rand(-5,5);
          }else {const f=state.gentle?.25:1,bat=state.tool==='bat'?2.5:1;t.vx=(dx/(dist||1)*rand(90,250)*bat+rand(-60,60))*f;t.vy=(dy/(dist||1)*100-rand(state.tool==='bat'?180:60,state.tool==='bat'?390:190))*f;t.va=rand(-8,8)*f*bat;}
        }
        if(count>0||state.tool==='laser')sound(state.tool);
      }
      if(state.tool==='hammer') {
        effects.push({x,y,r:radius*.8,life:1,color:'#8ed8ff'},{x,y,r:radius*.45,life:.8,color:'#d9f4ff'});burst(x,y,'#87d7ff',22,power*.6);
        const bolt=[];let bx=x+rand(-W*.22,W*.22),by=-12;bolt.push([bx,by]);
        const segments=state.gentle?5:9;for(let i=1;i<=segments;i++){const t=i/segments;bx+=(x-bx)/(segments-i+1)+rand(-32,32)*(1-t);by=(y+8)*t;bolt.push([bx,by]);}
        effects.push({type:'thunder',points:bolt,x,y,life:1,max:1});
        if(!state.gentle){shake=7+power;flash=.22;}
        marks.push({type:'crack',x,y,r:radius*.72,angle:rand(0,6.28)});
      }else if(state.tool==='laser'){burst(x,y,'#5de7ff',7,.5);effects.push({x,y,r:13,life:.7,color:'#baf7ff'},{x,y,r:7,life:.9,color:'#35d8ff'});if(!state.gentle)flash=Math.max(flash,.035);}
      else if(state.tool==='chainsaw'){burst(x,y,'#d2b879',12,.8);for(let i=0;i<(state.gentle?5:16);i++){const a=rand(-2.8,-.35),s=rand(160,440);particles.push({x:x+rand(-8,8),y:y+rand(-5,5),vx:Math.cos(a)*s,vy:Math.sin(a)*s,r:rand(1.2,2.8),color:i%3?'#ffc44f':'#fff3b0',life:rand(.18,.52),spark:true});}marks.push({type:'cut',x,y,r:Math.hypot(W,H),angle:-.78});sound('chainsaw');if(!state.gentle){shake=5;flash=Math.max(flash,.025);}}
      else if(state.tool==='gun'){marks.push({type:'bullet',x,y,r:9});burst(x,y,'#ffc870',8,.8);sound('gun');if(!state.gentle)shake=2;}
      else if(state.tool==='bat'){marks.push({type:'bat',x,y,r:radius,angle:rand(-.45,.45)});burst(x,y,'#d8bd8c',18,1.35);sound('bat');if(!state.gentle)shake=7;}
      else if(state.tool==='flame'){
        marks.push({type:'burn',x,y,r:radius*.6});
        for(let i=0;i<(state.gentle?5:14);i++)particles.push({x:x+rand(-22,22),y:y+rand(-10,15),vx:rand(-45,45),vy:rand(-160,-65),r:rand(5,16),color:['#fff19a','#f8c34d','#ee803a','#d65328'][i%4],life:rand(.28,.72),fire:true});
        sound('flame');
      }else {effects.push({x,y,r:radius*.6,life:.5,color:'#a6b9d0'});if(count)sound('vortex');}
      if(count)state.hits+=count;
      if(['hammer','chainsaw','gun','bat','grenade','laser'].includes(state.tool)&&['desktop','glass','image'].includes(state.scene))shatterGlass(x,y,power);
    }
    if(marks.length>1200)marks.splice(0,marks.length-1200);if(effects.length>220)effects.splice(0,effects.length-220);
    if(state.hits>0)$('#session-note').textContent=state.scene==='bubbles'?`${state.hits} little pops. One little pause.`:'A little less clutter. A little more space.';
  }
  function drawBackground() {
    if(stage.classList.contains('has-snapshot')){ctx.fillStyle='#1c2420';ctx.fillRect(0,0,W,H);return;}
    const layers=[['#f2f4e6','#d7e4cb','#87a263'],['#dff8f1','#6db9b4','#74e0bf'],['#25274f','#775aa8','#d382d5'],['#ffe4c2','#d98280','#ffbd79'],['#dff8ff','#397f9a','#8de8ff']],palette=layers[state.layer%layers.length];
    ctx.fillStyle=palette[1];ctx.fillRect(0,0,W,H);
    const g=ctx.createRadialGradient(W*.52,H*.4,20,W*.5,H*.5,W*.72);g.addColorStop(0,palette[0]);g.addColorStop(1,palette[1]);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.globalAlpha=.18;ctx.strokeStyle=palette[2];ctx.lineWidth=28;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(W*(.25+i*.28),H*(.35+i*.12),W*.22,H*.12,-.35+i*.2,0,6.283);ctx.stroke();}ctx.restore();
    ctx.fillStyle='#748c5120';for(let x=20;x<W;x+=22)for(let y=20;y<H;y+=22){ctx.beginPath();ctx.arc(x,y,.65,0,Math.PI*2);ctx.fill();}
    if(state.scene==='buddy'){
      const floor=H*.79,wall=ctx.createLinearGradient(0,0,0,floor);wall.addColorStop(0,'#27352f');wall.addColorStop(1,'#445747');ctx.fillStyle=wall;ctx.fillRect(0,0,W,floor);ctx.fillStyle='#c7b68c';ctx.fillRect(0,floor,W,H-floor);
      for(let x=0;x<W;x+=48)line(ctx,x,0,x,floor,'#ffffff0c');ctx.fillStyle='#f4df9a';ctx.globalAlpha=.12;ctx.beginPath();ctx.ellipse(W*.5,H*.35,W*.32,H*.42,0,0,6.283);ctx.fill();ctx.globalAlpha=1;
      text(ctx,'VENT STUDIO',24,35,11,'#dfe8d5','700');text(ctx,'PLAYFUL DUMMY • ALWAYS BOUNCES BACK',24,53,9,'#aebdaa','600');return;
    }
    if(state.scene==='swarm'){ctx.fillStyle='#242920';ctx.fillRect(0,0,W,H);ctx.fillStyle='#353c2e';for(let x=0;x<W;x+=70)for(let y=0;y<H;y+=70)rr(ctx,x+5,y+5,58,58,8,'#30372b','#46503e');text(ctx,'BUG SWARM • ABOUT 1,000 ACTIVE',24,34,10,'#d8dfbb','800');return;}
    if(state.scene==='desktop') {
      ctx.save();ctx.globalAlpha=.09;ctx.translate(W*.53,H*.52);ctx.rotate(-.28);ctx.strokeStyle='#87a263';ctx.lineWidth=35;
      ctx.beginPath();ctx.ellipse(0,0,W*.35,H*.24,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
  }
  function drawBuddy(dt){
    const chaseAge=performance.now()-buddyChase.lastUse;
    if(buddyChase.active&&chaseAge>750)buddyChase.hidden=true;
    if(buddyChase.active&&chaseAge>1900){buddyChase.active=false;buddyChase.hidden=false;buddyChase.message=1;buddy.x=0;buddy.y=0;$('#session-note').textContent=`${buddy.name}: Hope you are feeling better now. I’m glad I could help.`;}
    if(buddyChase.active&&!buddyChase.hidden){const target=Math.sin(performance.now()*.008)>0?W*.38:-W*.38;buddy.vx+=(target-buddy.x)*dt*16;buddy.y=Math.abs(Math.sin(performance.now()*.025))*-18;}
    if(buddyChase.hidden)return;
    if(buddyPhoto){const s=clamp(H/520,.72,1.05),cx=W/2+buddy.x,cy=H*.49+buddy.y,h=355*s,w=h*(buddyPhoto.width/buddyPhoto.height);ctx.save();ctx.translate(cx,cy);ctx.rotate(buddy.rot);ctx.scale(1+buddy.squash*.35,1-buddy.squash*.3);ctx.globalAlpha=.25;ctx.fillStyle='#101b15';ctx.beginPath();ctx.ellipse(0,h*.49,w*.48,12*s,0,0,6.283);ctx.fill();ctx.globalAlpha=1;if(buddy.hit>0){ctx.shadowColor='#ffd26d';ctx.shadowBlur=buddy.hit*25;}ctx.drawImage(buddyPhoto,-w/2,-h/2,w,h);ctx.shadowBlur=0;ctx.textAlign='center';rr(ctx,-62*s,h*.42,124*s,31*s,16*s,'#19271fdd','#ffffff33');text(ctx,buddy.name,0,h*.42+21*s,13*s,'#f5f3df','700');if(buddyChase.message){rr(ctx,-155*s,-h*.64,310*s,46*s,17*s,'#fffdf2','#bcc9b2');text(ctx,'Hope you are feeling better now — glad I could help!',0,-h*.64+28*s,11*s,'#42503c','700');}ctx.restore();return;}
    buddy.vx+=-buddy.x*15*dt;buddy.vy+=-buddy.y*18*dt;buddy.vrot+=-buddy.rot*20*dt;buddy.vx*=Math.pow(.78,dt*8);buddy.vy*=Math.pow(.76,dt*8);buddy.vrot*=Math.pow(.7,dt*8);buddy.x+=buddy.vx*dt;buddy.y+=buddy.vy*dt;buddy.rot+=buddy.vrot*dt;buddy.squash=Math.max(0,buddy.squash-dt*2.6);buddy.hit=Math.max(0,buddy.hit-dt*2.4);
    const s=clamp(H/520,.72,1.05),cx=W/2+buddy.x,cy=H*.49+buddy.y;ctx.save();ctx.translate(cx,cy);ctx.rotate(buddy.rot);ctx.scale(1+buddy.squash,1-buddy.squash*.7);
    ctx.globalAlpha=.3;ctx.fillStyle='#132019';ctx.beginPath();ctx.ellipse(0,151*s,93*s,18*s,0,0,6.283);ctx.fill();ctx.globalAlpha=1;
    const limb=(x,y,w,h,a)=>{ctx.save();ctx.translate(x*s,y*s);ctx.rotate(a);const g=ctx.createLinearGradient(-w*s/2,0,w*s/2,0);g.addColorStop(0,'#26372c');g.addColorStop(.48,'#72866b');g.addColorStop(1,'#28392e');rr(ctx,-w*s/2,0,w*s,h*s,w*s/2,g,'#1f3026');ctx.restore();};
    limb(-38,73,27,79,.18);limb(14,73,27,79,-.18);limb(-72,-10,25,92,.35+buddy.rot*.4);limb(48,-10,25,92,-.35+buddy.rot*.4);
    const shirt=ctx.createLinearGradient(-70*s,-40*s,70*s,80*s);shirt.addColorStop(0,'#ffffff55');shirt.addColorStop(.25,buddy.shirt);shirt.addColorStop(1,'#253529');rr(ctx,-65*s,-39*s,130*s,127*s,42*s,shirt,'#203128');ctx.fillStyle='#ffffff22';ctx.beginPath();ctx.ellipse(-23*s,-17*s,29*s,10*s,-.25,0,6.283);ctx.fill();
    const skin=ctx.createRadialGradient(-25*s,-73*s,4,0,-57*s,76*s);skin.addColorStop(0,'#ffe7d066');skin.addColorStop(.26,buddy.skin);skin.addColorStop(1,'#4b2c2499');ctx.fillStyle=skin;ctx.beginPath();ctx.ellipse(0,-67*s,70*s,72*s,0,0,6.283);ctx.fill();ctx.strokeStyle='#2d211e';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=buddy.skin;ctx.beginPath();ctx.ellipse(-69*s,-63*s,12*s,21*s,0,0,6.283);ctx.ellipse(69*s,-63*s,12*s,21*s,0,0,6.283);ctx.fill();
    ctx.fillStyle='#29231f';if(buddy.hair==='crop')rr(ctx,-57*s,-125*s,114*s,31*s,20*s,'#29231f');else if(buddy.hair==='wave'){for(let i=-2;i<=2;i++){ctx.beginPath();ctx.arc(i*22*s,-112*s+(i%2)*5*s,25*s,0,6.283);ctx.fill();}}else if(buddy.hair==='spikes'){for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(i*18*s,-101*s);ctx.lineTo((i*18+8)*s,-146*s+Math.abs(i)*5*s);ctx.lineTo((i*18+19)*s,-99*s);ctx.fill();}}
    ctx.strokeStyle='#211f1c';ctx.lineWidth=4*s;ctx.lineCap='round';if(buddy.hit>.65){line(ctx,-38*s,-72*s,-17*s,-65*s,'#211f1c',4*s);line(ctx,17*s,-65*s,38*s,-72*s,'#211f1c',4*s);}else{ctx.fillStyle='#f8f6e9';ctx.beginPath();ctx.ellipse(-27*s,-71*s,14*s,10*s,0,0,6.283);ctx.ellipse(27*s,-71*s,14*s,10*s,0,0,6.283);ctx.fill();ctx.fillStyle='#27362c';ctx.beginPath();ctx.arc(-24*s,-69*s,5*s,0,6.283);ctx.arc(24*s,-69*s,5*s,0,6.283);ctx.fill();}
    ctx.beginPath();if(buddy.face==='goofy')ctx.arc(0,-35*s,24*s,0,Math.PI);else if(buddy.face==='calm')ctx.arc(0,-24*s,22*s,Math.PI,6.283);else{ctx.moveTo(-20*s,-28*s);ctx.quadraticCurveTo(0,-17*s,21*s,-29*s);}ctx.stroke();ctx.textAlign='center';rr(ctx,-62*s,102*s,124*s,31*s,16*s,'#19271fdd','#ffffff33');text(ctx,buddy.name,0,123*s,13*s,'#f5f3df','700');
    if(buddyChase.message){rr(ctx,-155*s,-188*s,310*s,46*s,17*s,'#fffdf2','#bcc9b2');ctx.textAlign='center';text(ctx,'Hope you are feeling better now — glad I could help!',0,-160*s,11*s,'#42503c','700');}
    ctx.restore();
  }
  function explodeGrenade(g){
    const radius=105+state.intensity*22;let count=0;
    for(const t of tiles){const cx=t.x+t.sw*t.scale/2,cy=t.y+t.sh*t.scale/2,dx=cx-g.x,dy=cy-g.y,dist=Math.hypot(dx,dy);if(dist>radius)continue;if(!t.loose){t.loose=true;count++;}const force=(1-dist/radius)*520*(state.gentle?.35:1);t.vx+=(dx/(dist||1))*force;t.vy+=(dy/(dist||1))*force-rand(100,300);t.va+=rand(-12,12);}
    bubbles.forEach(b=>{if(!b.popped&&Math.hypot(b.x-g.x,b.y-g.y)<radius){b.popped=true;b.respawn=rand(1.2,3.2);count++;}});if(state.scene==='bubbles'&&count){state.totalPops+=count;updateUseCounter();}
    marks.push({type:'burn',x:g.x,y:g.y,r:radius*.58},{type:'crater',x:g.x,y:g.y,r:radius*.32});
    effects.push({x:g.x,y:g.y,r:radius*.32,life:1,color:'#ffe6a5'},{x:g.x,y:g.y,r:radius*.5,life:.85,color:'#ef9b58'});
    for(let i=0;i<(state.gentle?18:55);i++){const a=rand(0,6.283),s=rand(70,390);particles.push({x:g.x,y:g.y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rand(20,180),r:rand(3,14),color:i%4?'#eb8b43':'#332d26',life:rand(.35,1.1),fire:i%3===0,smoke:i%4===0});}
    if(['desktop','glass','image'].includes(state.scene))shatterGlass(g.x,g.y,3);
    sound('explosion');if(!state.gentle){shake=14;flash=.2;}state.hits+=count;$('#session-note').textContent='A big release. Still only a replica.';
  }
  function render(dt,now) {
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);ctx.save();
    if(shake>0){ctx.translate(rand(-shake,shake),rand(-shake,shake));shake=Math.max(0,shake-dt*35);}
    drawBackground();
    if(state.scene==='buddy')drawBuddy(dt);
    for(const t of tiles) {
      if(t.loose) {
        if(state.tool==='vortex'&&pointer.down&&Math.hypot(t.x-pointer.x,t.y-pointer.y)<190){t.vx+=(pointer.x-t.x)*dt*6;t.vy+=(pointer.y-t.y)*dt*6;}
        else t.vy+=state.gentle?dt*100:dt*390;
        t.x+=t.vx*dt;t.y+=t.vy*dt;t.a+=t.va*dt;t.vx*=Math.pow(.985,dt*60);t.life-=dt*(state.gentle?.8:.23);
      }
      if(t.y>H+80||t.life<=0)continue;
      const w=t.sw*t.scale,h=t.sh*t.scale;
      if(t.loose){ctx.save();ctx.globalAlpha=Math.min(1,t.life*2);ctx.translate(t.x+w/2,t.y+h/2);ctx.rotate(t.a);ctx.drawImage(t.image,t.sx,t.sy,t.sw,t.sh,-w/2,-h/2,w,h);ctx.restore();}
      else ctx.drawImage(t.image,t.sx,t.sy,t.sw,t.sh,t.x,t.y,w+.1,h+.1);
    }
    tiles=tiles.filter(t=>!t.loose||(t.life>0&&t.y<H+80));
    for(const s of glassShards){s.life-=dt;s.vy+=dt*(state.gentle?120:430);s.x+=s.vx*dt;s.y+=s.vy*dt;s.a+=s.va*dt;s.vx*=Math.pow(.985,dt*60);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.a);ctx.globalAlpha=clamp(s.life,0,1)*.82;ctx.beginPath();ctx.moveTo(s.points[0][0],s.points[0][1]);for(let i=1;i<s.points.length;i++)ctx.lineTo(s.points[i][0],s.points[i][1]);ctx.closePath();const sg=ctx.createLinearGradient(-20,-20,20,20);sg.addColorStop(0,'#ffffffdd');sg.addColorStop(.35,s.tint+'99');sg.addColorStop(1,'#4b748a55');ctx.fillStyle=sg;ctx.fill();ctx.strokeStyle='#ffffffdd';ctx.lineWidth=1.1;ctx.stroke();ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(s.points[1][0]*.8,s.points[1][1]*.8);ctx.strokeStyle='#ffffff88';ctx.stroke();ctx.restore();}
    glassShards=glassShards.filter(s=>s.life>0&&s.y<H+100);
    for(const b of bubbles) {
      if(b.popped) {b.respawn=(b.respawn||2)-dt;if(b.respawn<=0){b.popped=false;b.respawn=0;}else{ctx.beginPath();ctx.arc(b.x,b.y,b.r*.85,0,6.283);ctx.fillStyle='#d2dec877';ctx.fill();ctx.strokeStyle='#bacbad88';ctx.lineWidth=1;ctx.stroke();line(ctx,b.x-5,b.y,b.x+4,b.y+3,'#b8c8ad77');continue;}}
      const grad=ctx.createRadialGradient(b.x-5,b.y-6,1,b.x,b.y,b.r);grad.addColorStop(0,'#ffffff');grad.addColorStop(.35,'#f6f9ee');grad.addColorStop(.8,'#dbe7d0');grad.addColorStop(1,'#bdcfac');
      ctx.save();ctx.shadowColor='#71895625';ctx.shadowBlur=5;ctx.shadowOffsetY=3;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,6.283);ctx.fillStyle=grad;ctx.fill();ctx.restore();ctx.strokeStyle='#ffffffaa';ctx.lineWidth=1;ctx.stroke();
      ctx.beginPath();ctx.ellipse(b.x-b.r*.25,b.y-b.r*.34,b.r*.3,b.r*.15,-.4,0,6.283);ctx.fillStyle='#ffffffbb';ctx.fill();
    }
    if(state.scene==='swarm'){
      while(swarm.length<1000&&Math.random()<.92){const edge=Math.floor(rand(0,4));swarm.push({x:edge===0?0:edge===1?W:rand(0,W),y:edge===2?0:edge===3?H:rand(0,H),vx:rand(-22,22),vy:rand(-22,22),a:rand(0,6.283),s:rand(1.2,3.2),type:Math.floor(rand(0,4))});}
      for(const b of swarm){b.a+=rand(-1,1)*dt;b.x+=b.vx*dt+Math.cos(b.a)*12*dt;b.y+=b.vy*dt+Math.sin(b.a)*12*dt;if(b.x<0)b.x=W;if(b.x>W)b.x=0;if(b.y<0)b.y=H;if(b.y>H)b.y=0;}
      for(const q of squishes){q.life-=dt;ctx.save();ctx.globalAlpha=clamp(q.life,0,1);ctx.translate(q.x,q.y);ctx.rotate(q.a);ctx.fillStyle=q.color;ctx.beginPath();ctx.ellipse(0,0,q.r*1.7,q.r*.38,0,0,6.283);ctx.fill();ctx.strokeStyle='#1b1511aa';ctx.lineWidth=1;for(let j=-1;j<=1;j++){line(ctx,j*q.r*.45,0,j*q.r*.8-5,-q.r*.75,'#1b1511aa',1);line(ctx,j*q.r*.45,0,j*q.r*.8-5,q.r*.75,'#1b1511aa',1);}ctx.restore();}squishes=squishes.filter(q=>q.life>0);
      for(const b of swarm){const z=b.s*3.6;ctx.drawImage(bugSprites[b.type],b.x-z*1.25,b.y-z*.8,z*2.5,z*1.65);}
    }
    for(const m of marks) {
      ctx.save();if(m.type==='paint'){if(m.wet>0){m.x+=m.vx*dt;m.y+=m.vy*dt;m.vy+=24*dt;m.alpha-=dt*.08*m.wet;}ctx.globalAlpha=Math.max(0,m.alpha??.86);ctx.fillStyle=m.color;ctx.shadowColor=m.wet?'#ffffff66':'transparent';ctx.shadowBlur=m.wet?5:0;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,6.283);ctx.fill();for(const s of m.spots){if(m.wet)s.y+=m.vy*dt*(.25+s.r/18);ctx.beginPath();ctx.ellipse(m.x+s.x,m.y+s.y,s.r,m.wet?s.r*(1.4+m.wet):s.r,0,0,6.283);ctx.fill();}if(m.wet){ctx.globalAlpha=Math.max(0,(m.alpha??.86)*.7);ctx.fillRect(m.x-m.r*.12,m.y,m.r*.24,m.r*(1+m.wet*2));}}
      else if(m.type==='stamp'){ctx.translate(m.x,m.y);ctx.rotate(m.angle);rr(ctx,-51,-20,102,40,3,null,'#ad3f48');rr(ctx,-47,-16,94,32,1,null,'#ad3f48');ctx.textAlign='center';text(ctx,m.label,0,5,14,'#ad3f48','bold');}
      else if(m.type==='burn'){const g=ctx.createRadialGradient(m.x,m.y,2,m.x,m.y,m.r);g.addColorStop(0,'#201a14cc');g.addColorStop(.65,'#44331c77');g.addColorStop(1,'#48341c00');ctx.fillStyle=g;ctx.fillRect(m.x-m.r,m.y-m.r,m.r*2,m.r*2);}
      else if(m.type==='bullet'){ctx.beginPath();ctx.arc(m.x,m.y,9,0,6.283);ctx.fillStyle='#554c3d';ctx.fill();ctx.beginPath();ctx.arc(m.x,m.y,4,0,6.283);ctx.fillStyle='#111713';ctx.fill();}
      else if(m.type==='bat'){ctx.translate(m.x,m.y);ctx.rotate(m.angle);ctx.strokeStyle='#d8bd8c66';ctx.lineWidth=8;ctx.beginPath();ctx.arc(-m.r*.1,0,m.r,-.9,.5);ctx.stroke();}
      else if(m.type==='crater'){const g=ctx.createRadialGradient(m.x,m.y,2,m.x,m.y,m.r);g.addColorStop(0,'#141815ee');g.addColorStop(.55,'#2a2720bb');g.addColorStop(1,'#3f342000');ctx.fillStyle=g;ctx.beginPath();ctx.arc(m.x,m.y,m.r,0,6.283);ctx.fill();}
      else if(m.type==='buddy-word'){m.life-=dt*1.6;ctx.globalAlpha=Math.max(0,m.life);ctx.translate(m.x,m.y-(1-m.life)*35);ctx.rotate(-.12);ctx.textAlign='center';text(ctx,m.label,0,0,22,'#fff3a5','900');}
      else if(m.type==='cut'){ctx.translate(m.x,m.y);ctx.rotate(m.angle);line(ctx,-m.r,0,m.r,0,'#293327',4);}
      else {ctx.translate(m.x,m.y);ctx.rotate(m.angle);ctx.strokeStyle='#52684725';ctx.lineWidth=.8;for(let i=0;i<5;i++){ctx.rotate(1.26);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(m.r*.4,5);ctx.lineTo(m.r,0);ctx.stroke();}}
      ctx.restore();
    }
    marks=marks.filter(m=>(m.type!=='buddy-word'||m.life>0)&&(m.type!=='paint'||(m.alpha??.86)>0));
    for(const e of effects){
      e.life-=dt*(e.type==='thunder'?4.5:3);
      if(e.type==='thunder'){
        const alpha=Math.max(0,e.life);ctx.save();ctx.globalCompositeOperation='screen';ctx.lineJoin='round';ctx.lineCap='round';
        for(const [width,color,a] of [[15,'#399cff',.15],[7,'#74c8ff',.38],[2.2,'#f4fbff',1]]){ctx.globalAlpha=alpha*a;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.shadowColor='#61bdff';ctx.shadowBlur=width*2;ctx.beginPath();e.points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
        ctx.globalAlpha=alpha*.75;ctx.fillStyle='#eefdff';ctx.shadowColor='#80d9ff';ctx.shadowBlur=34;ctx.beginPath();ctx.arc(e.x,e.y,10+20*(1-alpha),0,6.283);ctx.fill();ctx.restore();
      }else{ctx.globalAlpha=Math.max(0,e.life*.55);ctx.beginPath();ctx.arc(e.x,e.y,e.r*(2-e.life),0,6.283);ctx.strokeStyle=e.color;ctx.lineWidth=2;ctx.stroke();}
    }ctx.globalAlpha=1;ctx.shadowBlur=0;effects=effects.filter(e=>e.life>0);
    for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=dt*(p.fire?-50:p.water?360:250);ctx.globalAlpha=Math.max(0,p.life)*(p.smoke?.55:1);ctx.fillStyle=p.color;if(p.spark){ctx.strokeStyle=p.color;ctx.lineWidth=p.r;ctx.shadowColor='#ff9f24';ctx.shadowBlur=10;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.045,p.y-p.vy*.045);ctx.stroke();ctx.shadowBlur=0;}else if(p.smoke){ctx.shadowColor=p.color;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(p.x,p.y,p.r*1.4,0,6.283);ctx.fill();ctx.shadowBlur=0;}else if(p.fire){ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.beginPath();ctx.moveTo(p.x,p.y-p.r*1.8);ctx.quadraticCurveTo(p.x+p.r,p.y,p.x,p.y+p.r);ctx.quadraticCurveTo(p.x-p.r,p.y,p.x,p.y-p.r*1.8);ctx.fill();ctx.shadowBlur=0;}else if(p.water){ctx.strokeStyle=p.color;ctx.lineWidth=p.r;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.035,p.y-p.vy*.035);ctx.stroke();}else ctx.fillRect(p.x,p.y,p.r,p.r);}ctx.globalAlpha=1;ctx.shadowBlur=0;particles=particles.filter(p=>p.life>0);
    const liveGrenades=[];for(const g of grenades){g.timer-=dt;g.vy+=410*dt;g.x+=g.vx*dt;g.y+=g.vy*dt;g.a+=g.va*dt;if(g.y>H-25){g.y=H-25;g.vy*=-.42;g.vx*=.72;}if(g.x<15||g.x>W-15){g.x=clamp(g.x,15,W-15);g.vx*=-.6;}if(g.timer<=0){explodeGrenade(g);continue;}ctx.save();ctx.translate(g.x,g.y);ctx.rotate(g.a);ctx.shadowColor='#17211988';ctx.shadowBlur=8;ctx.shadowOffsetY=5;if(grenadePhoto)ctx.drawImage(grenadePhoto,-17,-26,34,51);else{const gg=ctx.createRadialGradient(-4,-5,1,0,0,14);gg.addColorStop(0,'#a5b379');gg.addColorStop(1,'#3d5035');ctx.fillStyle=gg;ctx.beginPath();ctx.roundRect(-12,-12,24,24,8);ctx.fill();}ctx.restore();liveGrenades.push(g);}grenades=liveGrenades;
    for(const b of bugs){
      b.life-=dt;b.timer-=dt;b.angle+=rand(-2,2)*dt;b.x=clamp(b.x+Math.cos(b.angle)*dt*(state.gentle?14:35),8,W-8);b.y=clamp(b.y+Math.sin(b.angle)*dt*(state.gentle?14:35),8,H-8);
      if(b.x<=8||b.x>=W-8||b.y<=8||b.y>=H-8)b.angle+=Math.PI;
      if(b.timer<=0){b.timer=.18;const t=tiles.find(t=>!t.loose&&Math.hypot(t.x+t.sw*t.scale/2-b.x,t.y+t.sh*t.scale/2-b.y)<22);if(t){t.loose=true;t.life=0;state.hits++;}const bubble=bubbles.find(t=>!t.popped&&Math.hypot(t.x-b.x,t.y-b.y)<t.r);if(bubble)bubble.popped=true;}
      ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.angle);ctx.strokeStyle='#4a3a25';ctx.lineWidth=1;for(let j=-1;j<=1;j++){line(ctx,j*3,-2,j*4-2,-6,'#4a3a25');line(ctx,j*3,2,j*4-2,6,'#4a3a25');}ctx.fillStyle='#6d4e2e';ctx.beginPath();ctx.ellipse(0,0,6,3,0,0,6.283);ctx.fill();ctx.restore();
    }bugs=bugs.filter(b=>b.life>0);
    if(flash>0){ctx.fillStyle=`rgba(255,255,235,${flash})`;ctx.fillRect(0,0,W,H);flash=Math.max(0,flash-dt);}
    ctx.restore();
    if(pointer.inside)drawCursor(now);else window.unwind3D?.setVisible(false);
  }
  function drawCursor(now) {
    const {x,y}=pointer,t=now*.001,pressed=pointer.down;ctx.save();ctx.translate(x,y);const propScale=clamp(Math.min(W/980,H/500),.78,1.06),lookX=clamp((x/W-.5)*2+pointer.vx*.012,-1,1),lookY=clamp((y/H-.5)*2+pointer.vy*.01,-1,1),depth=1-Math.abs(lookX)*.22;ctx.transform(1,lookY*.16,-lookX*.3,1,lookX*8,lookY*5);ctx.scale(propScale*depth,propScale*(1-Math.abs(lookY)*.09));ctx.rotate(lookX*.13+pointer.vx*.0035);
    ctx.shadowColor='#111c1766';ctx.shadowBlur=10+Math.abs(lookX)*12;ctx.shadowOffsetX=7-lookX*15;ctx.shadowOffsetY=9+lookY*5;
    const poly=(pts,fill,stroke='#29382d')=>{ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}};
    const box=(x,y,w,h,d,front='#8ca06d',top='#c7d69d',side='#586c4d')=>{poly([[x,y],[x+d,y-d],[x+w+d,y-d],[x+w,y]],top);poly([[x+w,y],[x+w+d,y-d],[x+w+d,y+h-d],[x+w,y+h]],side);rr(ctx,x,y,w,h,3,front,'#314331');};
    const cylinder=(x,y,w,h,front='#788a75',light='#dce8d7')=>{const g=ctx.createLinearGradient(x,y,x+w,y);g.addColorStop(0,'#43574a');g.addColorStop(.3,light);g.addColorStop(.7,front);g.addColorStop(1,'#35473d');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,y,w,h,h/2);ctx.fill();ctx.strokeStyle='#2b3d32';ctx.stroke();};
    if(['laser','paint','gun','flame','washer'].includes(state.tool)){ctx.save();ctx.shadowColor='transparent';ctx.strokeStyle=pressed?'#fff':'#8eeeff';ctx.globalAlpha=pressed?.95:.72;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,pressed?14:18,0,6.283);ctx.stroke();for(let i=0;i<4;i++){const a=i*1.571,d=pressed?17:22;ctx.beginPath();ctx.moveTo(Math.cos(a)*d,Math.sin(a)*d);ctx.lineTo(Math.cos(a)*(d+7),Math.sin(a)*(d+7));ctx.stroke();}ctx.fillStyle=pressed?'#fff':'#8eeeff';ctx.beginPath();ctx.arc(0,0,2.5,0,6.283);ctx.fill();ctx.restore();}
    ctx.save();ctx.globalAlpha=.25;ctx.shadowColor='transparent';ctx.fillStyle='#1a251e';ctx.beginPath();ctx.ellipse(6,20,28,8,0,0,6.283);ctx.fill();ctx.restore();
    const real3D=Boolean(window.unwind3D?.has(state.tool));window.unwind3D?.update({tool:state.tool,x,y,lookX,lookY,pressed,scale:propScale,visible:pointer.inside});if(real3D){ctx.restore();return;}
    ctx.rotate((pressed?-.08:0)+Math.sin(t*2)*.015);
    if(state.tool==='hammer'){
      ctx.rotate(pressed?-.65:-.08);if(hammerPhoto){const size=164;ctx.shadowColor='#54bfff';ctx.shadowBlur=pressed?30:16;ctx.drawImage(hammerPhoto,-61,-54,size,size);ctx.shadowBlur=0;if(pressed){ctx.strokeStyle='#9ee4ff';ctx.lineWidth=1.5;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(rand(-24,18),rand(-22,18));ctx.lineTo(rand(-42,32),rand(-40,35));ctx.lineTo(rand(-56,48),rand(-52,48));ctx.stroke();}}}else{cylinder(-3,-1,8,34,'#8a613e','#d7b27b');box(-18,-15,35,15,7,'#83918a','#eef2e8','#4d5d55');line(ctx,-12,-11,12,-11,'#fff',2);}
    }else if(state.tool==='laser'){
      ctx.rotate(-.04);if(laserPhoto){const recoil=pressed?-7:0;ctx.shadowColor='#20cfff';ctx.shadowBlur=pressed?30:16;ctx.drawImage(laserPhoto,-195+recoil,-72,208,139);ctx.shadowBlur=0;if(pressed){ctx.globalCompositeOperation='screen';ctx.strokeStyle='#65e8ff';ctx.lineWidth=5;ctx.shadowColor='#18cfff';ctx.shadowBlur=22;ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(74,0);ctx.stroke();ctx.strokeStyle='#efffff';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(78,0);ctx.stroke();ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;}}
      else{ctx.rotate(-.55);cylinder(-24,-6,45,13,'#536474','#b8c9d2');box(9,-8,18,17,5,'#556553','#aaba99','#344438');box(-3,6,11,18,4,'#35463b','#788b7d','#26332c');ctx.shadowColor='#20cfff';ctx.shadowBlur=pressed?26:12;ctx.fillStyle=pressed?'#efffff':'#37dfff';ctx.beginPath();ctx.arc(29,-1,pressed?5:3,0,6.283);ctx.fill();}
    }else if(state.tool==='paint'){
      ctx.rotate(-.035);const c=colors[paintColor%colors.length];if(paintballPhoto){const recoil=pressed?-6:0;ctx.shadowColor='#17211988';ctx.shadowBlur=14;ctx.drawImage(paintballPhoto,-211+recoil,-75,225,150);ctx.shadowBlur=0;if(pressed){ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=20;ctx.beginPath();ctx.arc(13,0,6,0,6.283);ctx.fill();for(let i=0;i<5;i++){const a=i*1.257+rand(-.25,.25),d=rand(10,25);ctx.beginPath();ctx.arc(13+Math.cos(a)*d,Math.sin(a)*d,rand(1.5,3.5),0,6.283);ctx.fill();}ctx.shadowBlur=0;}}
      else{ctx.rotate(-.18);box(-27,-12,43,23,6,'#53665c','#aebeb1','#324139');cylinder(12,-8,35,11,'#485952','#b9c8c0');box(-9,9,13,24,4,'#3b4a42','#788b7d','#26332c');ctx.fillStyle=c;ctx.shadowColor=c;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(48,-2,pressed?6:3,0,6.283);ctx.fill();ctx.shadowBlur=0;rr(ctx,-23,-28,27,18,8,c,'#563f49');text(ctx,'PB',-17,-16,7,'#fff','800');}
    }else if(state.tool==='vortex'){
      const spin=state.gentle?t*.22:t*(pressed?1.8:.55);ctx.rotate(spin);if(gravityPhoto){const size=118+(pressed?8:0);ctx.shadowColor='#2edcff';ctx.shadowBlur=pressed?34:20;ctx.drawImage(gravityPhoto,-size/2,-size/2,size,size);ctx.shadowBlur=0;ctx.save();ctx.rotate(-spin*1.8);ctx.globalCompositeOperation='screen';for(let i=0;i<3;i++){ctx.strokeStyle=i===1?'#eaffff':'#59eaff';ctx.globalAlpha=pressed?.75-i*.12:.35-i*.08;ctx.lineWidth=pressed?2.4:1.4;ctx.beginPath();ctx.ellipse(0,0,70+i*9,20+i*5,i*.7,0,6.283);ctx.stroke();}ctx.restore();if(pressed){ctx.fillStyle='#c8fbff';ctx.shadowColor='#2edcff';ctx.shadowBlur=15;for(let i=0;i<6;i++){const a=t*3+i*1.047,r=62+((t*35+i*13)%38);ctx.beginPath();ctx.arc(Math.cos(a)*r,Math.sin(a)*r*.55,2.2,0,6.283);ctx.fill();}ctx.shadowBlur=0;}}else{for(let i=0;i<3;i++){ctx.rotate(2.094);const g=ctx.createLinearGradient(0,-3,27,5);g.addColorStop(0,'#dce9ee');g.addColorStop(1,'#637d8d');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-5);ctx.bezierCurveTo(13,-13,30,-8,27,5);ctx.bezierCurveTo(15,1,9,9,0,5);ctx.fill();ctx.stroke();}cylinder(-7,-7,14,14,'#708a96','#edf6f4');}
    }else if(state.tool==='chainsaw'){
      ctx.rotate(-.06+(pressed?Math.sin(t*55)*.018:0));if(chainsawPhoto){ctx.shadowColor='#172119aa';ctx.shadowBlur=15;ctx.drawImage(chainsawPhoto,-215,-79,230,153);ctx.shadowBlur=0;if(pressed){ctx.strokeStyle='#fff0a1';ctx.lineWidth=2;ctx.shadowColor='#ff9a25';ctx.shadowBlur=10;for(let i=0;i<5;i++){ctx.beginPath();ctx.moveTo(rand(-5,15),rand(-8,8));ctx.lineTo(rand(20,62),rand(18,48));ctx.stroke();}ctx.shadowBlur=0;}}else{ctx.rotate(-.38);box(-25,-2,29,20,6,'#cc8e42','#f3bd60','#815728');poly([[4,-5],[40,-8],[47,-2],[42,7],[4,9]],'#d5d5c7','#526055');}
    }else if(state.tool==='gun'){
      ctx.rotate(-.03);if(gunPhoto){const recoil=pressed?-9+Math.sin(t*65)*3:0;ctx.shadowColor='#17211999';ctx.shadowBlur=14;ctx.drawImage(gunPhoto,-228+recoil,-64,241,136);ctx.shadowBlur=0;if(pressed){ctx.shadowColor='#ffd477';ctx.shadowBlur=24;poly([[9,-10],[40,0],[9,10],[18,0]],'#fff0a0',null);ctx.shadowBlur=0;}}
      else{ctx.rotate(-.15);box(-24,-10,39,19,5,'#40534a','#8b9b91','#27372f');cylinder(10,-7,32,8,'#394941','#a8b4ac');box(-8,8,13,22,4,'#5d4937','#9c7f5d','#382b23');box(-20,-6,10,11,3,'#697d70','#a9b7ad','#405248');if(pressed){ctx.shadowColor='#ffd477';ctx.shadowBlur=20;poly([[43,-9],[55,-3],[43,5],[47,-2]],'#ffe08a',null);}}
    }else if(state.tool==='flame'){
      ctx.rotate(-.04);if(flamePhoto){ctx.drawImage(flamePhoto,-215+(pressed?-5:0),-72,225,150);}else{ctx.rotate(-.25);cylinder(-26,-9,36,19,'#aa4c34','#ef9b5d');box(-19,8,12,21,4,'#594638','#9b7454','#352b24');cylinder(7,-6,31,10,'#6d7164','#d5d7c8');}
      if(pressed){const g=ctx.createRadialGradient(18,-1,2,18,-1,30);g.addColorStop(0,'#fff7a5');g.addColorStop(.35,'#ffb236');g.addColorStop(1,'#e74b2800');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(8,-8);ctx.quadraticCurveTo(55,-17+Math.sin(t*18)*6,82,-1);ctx.quadraticCurveTo(56,16,8,7);ctx.fill();}
    }else if(state.tool==='stamp'){
      ctx.rotate(pressed?.08:-.05);if(stampPhoto){const s=pressed?.82:1;ctx.scale(s,s);ctx.drawImage(stampPhoto,-39,-56,78,81);}else{cylinder(-11,-25,22,21,'#7c553a','#c99466');box(-22,-5,44,15,6,'#805b47','#cda17f','#593c30');box(-25,10,50,7,4,'#a33f49','#d56d76','#6e2730');}
    }else if(state.tool==='termites'){
      ctx.rotate(Math.sin(t*2)*.025);if(termiteBoxPhoto){const bob=pressed?Math.sin(t*25)*3:0;ctx.shadowColor=pressed?'#65ff72':'#17211988';ctx.shadowBlur=pressed?24:12;ctx.drawImage(termiteBoxPhoto,-73,-49+bob,146,97);ctx.shadowBlur=0;if(pressed){ctx.save();ctx.globalCompositeOperation='screen';const glow=ctx.createRadialGradient(0,-8,2,0,-8,48);glow.addColorStop(0,'#aaff85aa');glow.addColorStop(1,'#43ff6500');ctx.fillStyle=glow;ctx.fillRect(-50,-50,100,88);ctx.restore();}}else box(-19,-17,37,30,7,'#d6c3a0','#f1e4c6','#8f7b5e');ctx.shadowColor='transparent';for(let i=0;i<(pressed?9:5);i++){const a=t*(pressed?7:1.5)+i*.76,rr=pressed?28+((t*45+i*11)%42):13,xx=Math.cos(a)*rr,yy=Math.sin(a)*rr*.55-(pressed?8:0);ctx.save();ctx.translate(xx,yy);ctx.rotate(a);ctx.fillStyle='#68452d';ctx.beginPath();ctx.ellipse(0,0,5,2.5,0,0,6.283);ctx.fill();ctx.restore();}
    }else if(state.tool==='washer'){
      ctx.rotate(-.035);if(washerPhoto){ctx.drawImage(washerPhoto,-171+(pressed?-5:0),-57,180,120);}else{ctx.rotate(-.25);box(-24,-9,30,20,5,'#4c8493','#9ccbd1','#315a64');box(-18,9,11,21,4,'#405a55','#879c8d','#283e3a');cylinder(3,-6,36,9,'#56818a','#c3e8e9');}
      if(pressed){ctx.shadowColor='#b9f1ff';ctx.shadowBlur=12;ctx.strokeStyle='#bdefff';ctx.lineWidth=3;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(8,-2+i*2);ctx.lineTo(66+Math.sin(t*14+i)*5,-12+i*12);ctx.stroke();}}
    }else if(state.tool==='bat'){
      ctx.rotate(pressed?-1.22:-.12);if(batPhoto){ctx.shadowColor='#17211988';ctx.shadowBlur=12;ctx.drawImage(batPhoto,-16,-158,150,157);ctx.shadowBlur=0;if(pressed){ctx.strokeStyle='#f1d19a88';ctx.lineWidth=7;ctx.beginPath();ctx.arc(0,0,126,-1.15,.15);ctx.stroke();}}else{const g=ctx.createLinearGradient(-5,-31,10,28);g.addColorStop(0,'#f0c98c');g.addColorStop(.45,'#a96c3e');g.addColorStop(1,'#5b3927');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-5,30);ctx.quadraticCurveTo(-11,5,-15,-20);ctx.quadraticCurveTo(-14,-34,-5,-35);ctx.quadraticCurveTo(5,-34,7,-20);ctx.quadraticCurveTo(3,7,5,30);ctx.closePath();ctx.fill();ctx.strokeStyle='#4c3226';ctx.stroke();}
    }else if(state.tool==='grenade'){
      ctx.rotate(pressed?.45:-.12);if(grenadePhoto)ctx.drawImage(grenadePhoto,-31,-50,62,93);else{const g=ctx.createRadialGradient(-6,-7,1,0,0,24);g.addColorStop(0,'#aebd78');g.addColorStop(.55,'#60764b');g.addColorStop(1,'#34442f');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(-19,-18,38,38,12);ctx.fill();ctx.strokeStyle='#26352a';ctx.stroke();}
    }else if(state.tool==='slap'){
      ctx.rotate(pressed?-.72:-.25);if(slapPhoto){const size=92;ctx.shadowColor='#1d271f88';ctx.shadowBlur=10;ctx.drawImage(slapPhoto,-size*.48,-size*.58,size,size);}else{const sg=ctx.createLinearGradient(-28,-28,30,22);sg.addColorStop(0,'#f8d4b4');sg.addColorStop(.55,buddy.skin);sg.addColorStop(1,'#654136');rr(ctx,-18,-6,35,44,16,sg,'#3d2924');for(let i=0;i<4;i++)rr(ctx,-31+i*16,-34-(i%2)*3,13,35,7,sg,'#3d2924');rr(ctx,13,2,14,31,7,sg,'#3d2924');}
    }else if(state.tool==='punch'){
      const left=punchCombo%2===0;if(glovesPhoto){const sw=glovesPhoto.width/2,sh=glovesPhoto.height;const drawGlove=(side,ox,oy,active)=>{ctx.save();ctx.translate(ox,oy+(active&&pressed?-23:0));ctx.rotate(active&&pressed?(side?-.22:.22):(side?-.08:.08));ctx.drawImage(glovesPhoto,side?sw:0,0,sw,sh,-31,-41,62,69);ctx.restore();};drawGlove(0,left?-21:-38,left?-8:11,left);drawGlove(1,left?23:7,left?11:-8,!left);}else{const glove=(ox,oy,flip,active)=>{ctx.save();ctx.translate(ox,oy);ctx.scale(flip,1);ctx.rotate(active&&pressed?-.3:.12);const pg=ctx.createLinearGradient(-28,-30,30,27);pg.addColorStop(0,'#ff8c78');pg.addColorStop(.5,'#c93f45');pg.addColorStop(1,'#681f2a');rr(ctx,-26,-18,53,44,16,pg,'#461821');rr(ctx,-12,20,28,25,10,pg,'#461821');ctx.restore();};glove(left?2:-39,left?-3:10,left?1:-1,true);glove(left?-38:5,left?12:-5,left?-1:1,false);}
    }
    ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.12+Math.abs(lookX)*.12;ctx.strokeStyle=lookX<0?'#7fe9ff':'#ffd2a1';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,48+Math.abs(lookX)*12,-1.2,.4);ctx.stroke();ctx.restore();
    ctx.restore();
  }
  function frame(now) {
    if(state.scene==='swarm'&&now-lastFrame<40){requestAnimationFrame(frame);return;}
    const dt=Math.min((now-lastFrame)/1000,.034)||.016;lastFrame=now;
    pointer.vx*=Math.pow(.84,dt*60);pointer.vy*=Math.pow(.84,dt*60);if(!document.hidden){if(pointer.down)act(now);render(dt,now);}requestAnimationFrame(frame);
  }
  function updatePointer(event){const r=canvas.getBoundingClientRect(),nx=clamp(event.clientX-r.left,0,W),ny=clamp(event.clientY-r.top,0,H);pointer.vx=pointer.vx*.72+(nx-pointer.x)*.28;pointer.vy=pointer.vy*.72+(ny-pointer.y)*.28;pointer.lastX=pointer.x;pointer.lastY=pointer.y;pointer.x=nx;pointer.y=ny;}
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;initAudio();canvas.focus({preventScroll:true});updatePointer(e);pointer.down=true;pointer.inside=true;canvas.setPointerCapture(e.pointerId);paintColor++;lastAction=0;act(performance.now());});
  canvas.addEventListener('pointermove',e=>{updatePointer(e);pointer.inside=true;});
  const stop=()=>{pointer.down=false;};
  canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);canvas.addEventListener('lostpointercapture',stop);
  canvas.addEventListener('pointerleave',()=>{if(!pointer.down)pointer.inside=false;});
  window.addEventListener('blur',()=>{stop();pointer.inside=false;});document.addEventListener('visibilitychange',stop);
  function selectTool(tool) {
    state.tool=tool;document.querySelectorAll('[data-tool]').forEach(b=>{b.classList.toggle('active',b.dataset.tool===tool);b.setAttribute('aria-pressed',String(b.dataset.tool===tool));});
    updateUseCounter();
    $('#action-label').textContent={hammer:'Click to smash · hold & drag to let it out',laser:'Hold & drag to carve a glowing path',paint:'Hold to fire bright paintballs',vortex:'Hold to pull the world into your orbit',chainsaw:'Hold & drag to saw through the surface',gun:'Hold to fire · drag to scatter bullet holes',flame:'Hold to scorch · linger to burn through',stamp:'Click to stamp · each click changes the message',termites:'Click to release termites · they nibble for 14 seconds',washer:'Hold & drag the Restore Potion to wash paint and rebuild the surface',bat:'Click to swing a wide arc',grenade:'Click to throw · the fuse lasts about 1.5 seconds',slap:'Click the buddy for a springy open-hand slap',punch:'Hold for alternating left-jab and right-cross combinations'}[tool];
  }
  function selectScene(scene) {
    stop();state.scene=scene;document.querySelectorAll('[data-scene]').forEach(b=>{b.classList.toggle('active',b.dataset.scene===scene);b.setAttribute('aria-selected',String(b.dataset.scene===scene));});
    $('#scene-label').textContent={desktop:'THE WORKDAY',bubbles:'BUBBLE WRAP',glass:'GLASS GARDEN',image:'YOUR SCREENSHOT',buddy:'VENT BUDDY',swarm:'BUG SWARM'}[scene];
    $('#stage-caption span').textContent={desktop:'',bubbles:'A very satisfying way to do absolutely nothing.',glass:'Some things are made to be beautifully broken.',image:'',buddy:'A fictional, springy dummy that always bounces back.',swarm:'Clear the swarm. More bugs keep crawling in.'}[scene];reset();
    if(scene==='buddy'){selectTool('slap');if(!buddyCreated)setTimeout(()=>$('#buddy-dialog').showModal(),0);}
  }
  document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>selectTool(b.dataset.tool)));
  document.querySelectorAll('[data-scene]').forEach(b=>b.addEventListener('click',()=>selectScene(b.dataset.scene)));
  document.querySelectorAll('[data-scene]').forEach((b,i,all)=>b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?all.length-1:(i+(e.key==='ArrowRight'?1:-1)+all.length)%all.length;all[next].focus();selectScene(all[next].dataset.scene);}));
  $('#intensity').addEventListener('input',e=>state.intensity=Number(e.target.value));
  $('#reset').addEventListener('click',()=>{stop();reset(true);});
  function toggleSound(){state.sound=!state.sound;if(state.sound)initAudio();$('#sound').setAttribute('aria-pressed',String(state.sound));$('#sound span').textContent=state.sound?'Sound on':'Sound off';}
  $('#sound').addEventListener('click',toggleSound);
  function updateGentle(){$('#quiet').setAttribute('aria-pressed',String(state.gentle));$('#quiet span').textContent=state.gentle?'Gentle mode on':'Gentle mode';}
  $('#quiet').addEventListener('click',()=>{state.gentle=!state.gentle;shake=0;flash=0;updateGentle();toast(state.gentle?'Softer sounds. Less motion. Same little escape.':'Full play mode.');});updateGentle();
  function setTheme(dark){document.documentElement.dataset.theme=dark?'dark':'light';$('#theme').setAttribute('aria-pressed',String(dark));$('#theme span:last-child').textContent=dark?'Light mode':'Dark mode';try{localStorage.setItem('unwind-theme',dark?'dark':'light');}catch{}}
  let darkTheme=false;try{darkTheme=localStorage.getItem('unwind-theme')==='dark';}catch{}setTheme(darkTheme);$('#theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme!=='dark'));
  function applyFullscreen(active){const playground=$('.playground'),controls=$('#display-controls'),updateControl=$('#update-button'),header=$('.header-right');playground.classList.toggle('native-fullscreen',active);$('#fullscreen').setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');if(active){$('.playground-header').append(updateControl,controls);}else{header.insertBefore(updateControl,$('#help'));header.insertBefore(controls,$('#help'));}setTimeout(resize,80);}
  async function fullscreen(){try{if(window.unwindDesktop?.toggleFullscreen){applyFullscreen(await window.unwindDesktop.toggleFullscreen());return;}if(document.fullscreenElement)await document.exitFullscreen();else await $('.playground').requestFullscreen();}catch{toast('Fullscreen isn’t available here. You can still play in this window.');}}
  $('#fullscreen').addEventListener('click',fullscreen);
  document.addEventListener('fullscreenchange',()=>applyFullscreen(Boolean(document.fullscreenElement)));
  window.unwindDesktop?.onFullscreenChange?.(applyFullscreen);
  const dialog=$('#help-dialog');$('#help').addEventListener('click',()=>{stop();dialog.showModal();});$('.close-dialog').addEventListener('click',()=>dialog.close());$('#start-playing').addEventListener('click',()=>dialog.close());
  const buddyDialog=$('#buddy-dialog');
  $('#edit-buddy').addEventListener('click',()=>{stop();$('#buddy-name').value=buddy.name;$('#buddy-skin').value=buddy.skin;$('#buddy-shirt').value=buddy.shirt;$('#buddy-hair').value=buddy.hair;$('#buddy-face').value=buddy.face;buddyDialog.showModal();});
  $('#buddy-cancel').addEventListener('click',()=>buddyDialog.close());
  $('#buddy-save').addEventListener('click',()=>{buddy.name=$('#buddy-name').value.trim().replace(/[<>]/g,'').slice(0,18)||'Bop';buddy.skin=$('#buddy-skin').value;buddy.shirt=$('#buddy-shirt').value;buddy.hair=$('#buddy-hair').value;buddy.face=$('#buddy-face').value;buddyCreated=true;buddyDialog.close();selectScene('buddy');toast(`${buddy.name} is ready to bounce back.`);});
  const updateDialog=$('#update-dialog'),updateButton=$('#update-button'),updateAction=$('#update-action'),updateCheck=$('#update-check');let updateStatus='idle';
  function renderUpdate(state,notify=false){if(!state)return;updateStatus=state.status;$('#update-title').textContent={checking:'Looking for a new release…',available:`Unwind ${state.version} is available`,current:'You are up to date',downloading:'Downloading your update',downloaded:'Ready to restart and install',error:'Could not check for updates',development:'Updates are checked by the installed app'}[state.status]||'Unwind updates';$('#update-message').textContent=state.message||'Updates come from the official Unwind GitHub Releases page.';const progress=$('#update-progress');progress.hidden=state.status!=='downloading';progress.querySelector('span').style.width=`${state.progress||0}%`;updateAction.hidden=!['available','downloaded'].includes(state.status);updateAction.textContent=state.status==='downloaded'?'Restart and install':'Download update';updateAction.disabled=false;updateCheck.disabled=['checking','downloading'].includes(state.status);updateButton.classList.toggle('has-update',['available','downloaded'].includes(state.status));if(notify&&state.status==='available')toast(`Unwind ${state.version} is available. Update whenever you like.`);if(notify&&state.status==='downloaded')toast('Update downloaded. Restart and install whenever you are ready.');}
  updateButton.addEventListener('click',async()=>{stop();updateDialog.showModal();if(window.unwindDesktop?.getUpdateState)renderUpdate(await window.unwindDesktop.getUpdateState());else renderUpdate({status:'development',message:'Update checks are available in the installed Windows or macOS app.'});});
  $('#update-close').addEventListener('click',()=>updateDialog.close());
  updateCheck.addEventListener('click',async()=>{if(!window.unwindDesktop?.checkForUpdates){renderUpdate({status:'development',message:'Update checks are available in the installed app.'});return;}renderUpdate({status:'checking',message:'Checking the official GitHub Releases feed…'});try{renderUpdate(await window.unwindDesktop.checkForUpdates());}catch(error){renderUpdate({status:'error',message:error.message||'Unable to check for updates.'});}});
  updateAction.addEventListener('click',async()=>{if(updateStatus==='downloaded'){updateAction.disabled=true;updateAction.textContent='Restarting…';await window.unwindDesktop.installUpdate();return;}updateAction.disabled=true;renderUpdate({status:'downloading',progress:0,message:'Starting download…'});try{await window.unwindDesktop.downloadUpdate();}catch(error){renderUpdate({status:'error',message:error.message||'Unable to download the update.'});}});
  window.unwindDesktop?.onUpdateStatus?.(state=>renderUpdate(state,true));
  document.addEventListener('keydown',e=>{
    if(dialog.open||buddyDialog.open||updateDialog.open||$('#screen-dialog').open||capturing||e.ctrlKey||e.metaKey||e.altKey||e.target.matches('input,textarea,select'))return;
    const key=e.key.toLowerCase();
    if('1234567890'.includes(key)&&key.length===1)selectTool(toolOrder[key==='0'?9:Number(key)-1]);
    else if(key==='b')selectTool('bat');else if(key==='g')selectTool('grenade');else if(key==='s')selectTool('slap');else if(key==='p')selectTool('punch');
    else if(key==='r'&&!e.repeat){stop();reset(true);}else if(key==='m'&&!e.repeat)toggleSound();else if(key==='f'&&!e.repeat)fullscreen();else if(key==='escape')stop();
    if(e.target===canvas){if(e.key.startsWith('Arrow')){e.preventDefault();pointer.inside=true;const d=e.shiftKey?35:15;pointer.x=clamp(pointer.x+(e.key==='ArrowRight'?d:e.key==='ArrowLeft'?-d:0),0,W);pointer.y=clamp(pointer.y+(e.key==='ArrowDown'?d:e.key==='ArrowUp'?-d:0),0,H);}if(e.code==='Space'){e.preventDefault();initAudio();pointer.inside=true;pointer.down=true;}}
  });document.addEventListener('keyup',e=>{if(e.code==='Space')stop();});
  $('#upload').addEventListener('click',()=>$('#image-input').click());
  function boundedImage(source,width,height) {
    const scale=Math.min(1,2560/Math.max(width,height));
    return surface(Math.round(width*scale),Math.round(height*scale),c=>c.drawImage(source,0,0,Math.round(width*scale),Math.round(height*scale)));
  }
  async function captureScreen(displayId) {
    if(capturing)return;capturing=true;stop();
    $('#capture').disabled=true;$('#capture-start').disabled=true;
    let stream, video;
    try {
      if(window.unwindDesktop) {
        const data=await window.unwindDesktop.captureScreen(displayId);
        if(!data.ok)throw new Error(data.message);
        const img=new Image();img.src=data.image;await img.decode();snapshot=boundedImage(img,img.naturalWidth,img.naturalHeight);
      } else {
        if(!navigator.mediaDevices?.getDisplayMedia)throw new Error('This browser cannot capture your screen. Open this preview in Chrome or Edge, or use Load screenshot.');
        stream=await navigator.mediaDevices.getDisplayMedia({video:{displaySurface:'monitor'},audio:false,selfBrowserSurface:'exclude'});
        video=document.createElement('video');video.muted=true;video.srcObject=stream;
        await video.play();
        await new Promise((resolve,reject)=>{
          const timer=setTimeout(()=>reject(new Error('No screen image received. Please try again.')),8000);
          if(video.requestVideoFrameCallback)video.requestVideoFrameCallback(()=>{clearTimeout(timer);resolve();});
          else if(video.readyState>=2){clearTimeout(timer);resolve();}
          else video.addEventListener('loadeddata',()=>{clearTimeout(timer);resolve();},{once:true});
        });
        if(!video.videoWidth||!video.videoHeight)throw new Error('No screen image received. Please try again.');
        snapshot=boundedImage(video,video.videoWidth,video.videoHeight);
      }
      selectScene('desktop');$('#capture').lastChild.textContent='Capture again';
      toast('Your screen is now a replica. Capture stopped; nothing was uploaded.');
    }catch(error){
      toast(['NotAllowedError','AbortError'].includes(error.name)?'Capture cancelled or not allowed. You can also load a screenshot.':error.message||'Screen capture failed. Try loading a screenshot.');
    }finally{stream?.getTracks().forEach(track=>track.stop());if(video){video.pause();video.srcObject=null;}capturing=false;$('#capture').disabled=false;$('#capture-start').disabled=false;}
  }
  async function beginCapture(){
    if(capturing)return;
    if(!window.unwindDesktop){await captureScreen();return;}
    try{
      const screens=await window.unwindDesktop.listScreens();const select=$('#screen-choice');select.replaceChildren();
      for(const screen of screens){const option=document.createElement('option');option.value=screen.id;option.textContent=screen.name;select.append(option);}
      if(!screens.length)throw new Error('No screens available.');$('#screen-dialog').showModal();
    }catch(error){toast(error.message||'Unable to list screens.');}
  }
  $('#capture').addEventListener('click',beginCapture);$('#capture-start').addEventListener('click',beginCapture);
  $('#screen-cancel').addEventListener('click',()=>$('#screen-dialog').close());
  $('#screen-confirm').addEventListener('click',()=>{const id=$('#screen-choice').value;$('#screen-dialog').close();captureScreen(id);});
  $('#forget').addEventListener('click',()=>{snapshot=null;imported=null;selectScene('desktop');$('#capture').lastChild.textContent='Use my screen';toast('Snapshot cleared from the playground.');});
  $('#image-input').addEventListener('change',async e=>{
    const file=e.target.files[0];if(!file)return;e.target.value='';
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){toast('Choose a PNG, JPG, or WebP image.');return;}
    if(file.size>20*1024*1024){toast('Please choose an image smaller than 20 MB.');return;}
    try{const bitmap=await createImageBitmap(file);snapshot=boundedImage(bitmap,bitmap.width,bitmap.height);bitmap.close();selectScene('desktop');toast('Screenshot loaded locally. Your original stays untouched.');}catch{toast('That image couldn’t be opened. Try a PNG or JPG.');}
  });
  function toast(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3000);}
  new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(resize,100);}).observe(stage);
  resize();requestAnimationFrame(frame);
})();
