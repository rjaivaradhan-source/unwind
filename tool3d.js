import * as THREE from './assets/vendor/three.module.js';
import { GLTFLoader } from './assets/vendor/GLTFLoader.js';
import { FBXLoader } from './assets/vendor/FBXLoader.js';

const stage=document.querySelector('#stage');
const canvas=document.createElement('canvas');
canvas.className='tool-3d-canvas';canvas.setAttribute('aria-hidden','true');stage.append(canvas);
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,2,.1,2400);camera.position.z=900;
scene.add(new THREE.HemisphereLight(0xcdf7ff,0x291d18,2.25));
const key=new THREE.DirectionalLight(0xffffff,3.8);key.position.set(-300,420,700);key.castShadow=true;scene.add(key);
const rim=new THREE.DirectionalLight(0x48dfff,2.7);rim.position.set(400,-120,450);scene.add(rim);
const warm=new THREE.PointLight(0xff804f,2.1,1400);warm.position.set(-350,-180,500);scene.add(warm);
const loader=new GLTFLoader(),models=new Map(),urls={laser:'laser.glb',paint:'paint.glb',gun:'gun.glb',flame:'flame.glb',washer:'washer.glb',grenade:'grenade.glb',chainsaw:'chainsaw.gltf',bat:'bat.glb'};
const fpsTools=new Set(['laser','paint','gun','flame','washer']);
const profiles={
  hammer:{turn:-.18,size:2.05,free:true,restZ:-.72,swing:true,stiff:92,drag:19},
  vortex:{turn:0,size:1.7,free:true,restZ:0,stiff:90,drag:19},
  stamp:{turn:0,size:1.7,free:true,restZ:-.08,swing:true,stiff:92,drag:19},
  termites:{turn:0,size:1.9,free:true,restZ:0,stiff:88,drag:18},
  slap:{turn:-.12,size:1.95,free:true,restZ:-.28,swing:true,stiff:96,drag:20},
  punch:{turn:0,size:1.95,free:true,restZ:0,punch:true,stiff:98,drag:21},
  grenade:{turn:0,size:1.85,free:true,restZ:-.08,toss:true,stiff:94,drag:20},
  bat:{turn:-.15,size:2.15,free:true,restZ:-.82,swing:true,stiff:88,drag:18},
  chainsaw:{turn:0,size:2.55,free:true,restZ:-.08,vibrate:true,stiff:90,drag:19},
  laser:{size:2.8,handX:.32,handY:-.37,recoil:true,stiff:94,drag:23},
  paint:{size:2.8,handX:.32,handY:-.37,recoil:true,stiff:94,drag:23},
  gun:{size:3.0,handX:.33,handY:-.38,recoil:true,stiff:98,drag:24},
  flame:{size:2.9,handX:.32,handY:-.37,recoil:true,stiff:90,drag:22},
  washer:{size:2.8,handX:.32,handY:-.37,recoil:true,stiff:94,drag:23}
};
let active=null,target={x:0,y:0,lookX:0,lookY:0,pressed:false,scale:1,vx:0,vy:0},ready=true,lastPointer={x:0,y:0,time:performance.now()},lastFrame=performance.now();
for(const [name,file] of Object.entries(urls))loader.load(`assets/3d/tools/${file}`,g=>{const asset=g.scene;asset.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();o.material.roughness=Math.min(.72,o.material.roughness??.6);o.material.metalness=Math.max(.08,o.material.metalness??.1);}});const box=new THREE.Box3().setFromObject(asset),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),pivot=new THREE.Group();if(fpsTools.has(name)){
  // Viewmodels rotate from the rear hand/stock, not their geometric center.
  // Put the rear of the local X axis at the rig origin so panning preserves grip position.
  // Kenney viewmodels face local -X. Anchor the stock/hand end at the rig and
  // let the barrel extend left into the scene toward the crosshair.
  asset.position.set(-box.max.x+size.x*.08,-center.y,-center.z);pivot.userData.viewModel=true;pivot.userData.muzzleX=-size.x*.92;
}else asset.position.sub(center);pivot.add(asset);const max=Math.max(size.x,size.y,size.z)||1;pivot.userData.norm=155/max;pivot.scale.setScalar(pivot.userData.norm);pivot.visible=false;scene.add(pivot);models.set(name,pivot);},undefined,error=>console.warn(`Could not load 3D ${name} model`,error));
const mat=(color,metalness=.08,roughness=.55)=>new THREE.MeshStandardMaterial({color,metalness,roughness});
const mesh=(geometry,material,position=[0,0,0],rotation=[0,0,0])=>{const object=new THREE.Mesh(geometry,material);object.position.set(...position);object.rotation.set(...rotation);object.castShadow=true;object.receiveShadow=true;return object;};
function addProcedural(name,asset){const box=new THREE.Box3().setFromObject(asset),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),pivot=new THREE.Group();asset.position.sub(center);pivot.add(asset);pivot.userData.norm=155/(Math.max(size.x,size.y,size.z)||1);pivot.scale.setScalar(pivot.userData.norm);pivot.visible=false;scene.add(pivot);models.set(name,pivot);}
function hammerModel(){const g=new THREE.Group(),steel=mat(0x57636c,.82,.28),edge=mat(0xaeb9c0,.9,.2),leather=mat(0x4b271b,.05,.72);g.add(mesh(new THREE.CylinderGeometry(.13,.16,2.7,16),leather,[0,-.95,0]));g.add(mesh(new THREE.BoxGeometry(2.25,.82,.9),steel,[0,.65,0]));g.add(mesh(new THREE.BoxGeometry(1.7,.5,.96),edge,[0,.68,0]));g.add(mesh(new THREE.TorusGeometry(.35,.045,8,20),mat(0x50c8ff,.3,.24),[0,.65,.52],[Math.PI/2,0,0]));return g;}
function gravityModel(){const g=new THREE.Group(),core=mat(0x1bdcff,.2,.18),ring=mat(0xa8bbc7,.78,.2);g.add(mesh(new THREE.SphereGeometry(.75,32,20),core));g.add(mesh(new THREE.TorusGeometry(1.05,.11,14,48),ring,[0,0,0],[1.15,0,.25]));g.add(mesh(new THREE.TorusGeometry(.92,.06,12,40),mat(0x4ff4ff,.4,.18),[0,0,0],[-.55,.3,0]));return g;}
function stampModel(){const g=new THREE.Group(),wood=mat(0x542b1b,.03,.42),brass=mat(0xc18c35,.72,.26),rubber=mat(0x17191b,0,.88);g.add(mesh(new THREE.SphereGeometry(.48,24,16),wood,[0,.8,0]));g.add(mesh(new THREE.CylinderGeometry(.24,.34,.95,20),wood,[0,.25,0]));g.add(mesh(new THREE.BoxGeometry(1.5,.35,.78),brass,[0,-.36,0]));g.add(mesh(new THREE.BoxGeometry(1.52,.13,.8),rubber,[0,-.6,0]));return g;}
function termiteModel(){const g=new THREE.Group(),wood=mat(0x382317,.02,.82),metal=mat(0x9b742f,.7,.34),glow=mat(0x31d85b,.18,.25);g.add(mesh(new THREE.BoxGeometry(1.8,1.05,1.15),wood));for(const x of [-.72,.72])for(const y of [-.42,.42])g.add(mesh(new THREE.BoxGeometry(.18,.18,1.2),metal,[x,y,0]));g.add(mesh(new THREE.SphereGeometry(.23,18,12),glow,[0,0,.62]));for(let i=0;i<5;i++)g.add(mesh(new THREE.CapsuleGeometry(.06,.17,4,8),mat(0x4a2818,0,.75),[-.65+i*.33,-.7+(i%2)*.12,.3],[0,0,i*.5]));return g;}
function handModel(){const g=new THREE.Group(),skin=mat(0xc98962,0,.66);g.add(mesh(new THREE.CapsuleGeometry(.43,.65,8,20),skin,[0,.05,0],[0,0,0]));for(let i=0;i<4;i++)g.add(mesh(new THREE.CapsuleGeometry(.105,.58,6,12),skin,[-.32+i*.22,.74,0],[0,0,0]));g.add(mesh(new THREE.CapsuleGeometry(.12,.48,6,12),skin,[.53,.1,0],[0,0,-.7]));g.add(mesh(new THREE.CylinderGeometry(.3,.38,.62,16),skin,[0,-.68,0]));return g;}
function glovesModel(){const g=new THREE.Group(),red=mat(0xb51628,.02,.38),dark=mat(0x17191d,.05,.72);for(const side of [-1,1]){g.add(mesh(new THREE.SphereGeometry(.58,24,18),red,[side*.62,.2,0]));g.add(mesh(new THREE.SphereGeometry(.3,18,12),red,[side*.92,.02,.18]));g.add(mesh(new THREE.CylinderGeometry(.35,.4,.58,18),dark,[side*.62,-.55,0]));}return g;}
addProcedural('hammer',hammerModel());addProcedural('vortex',gravityModel());addProcedural('stamp',stampModel());addProcedural('termites',termiteModel());addProcedural('slap',handModel());addProcedural('punch',glovesModel());
// Replace the fallback hammer with the supplied detailed FBX once it is ready.
new FBXLoader().load('assets/3d/tools/war-hammer.fbx',asset=>{
  asset.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const enhance=m=>{const material=m.clone();material.roughness=Math.min(.68,material.roughness??.58);material.metalness=Math.max(.12,material.metalness??.08);return material;};o.material=Array.isArray(o.material)?o.material.map(enhance):enhance(o.material);});
  const box=new THREE.Box3().setFromObject(asset),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),pivot=new THREE.Group();
  asset.position.sub(center);pivot.add(asset);pivot.userData.norm=185/(Math.max(size.x,size.y,size.z)||1);pivot.scale.setScalar(pivot.userData.norm);pivot.rotation.x=-Math.PI/2;pivot.visible=active==='hammer';
  const fallback=models.get('hammer');if(fallback)scene.remove(fallback);scene.add(pivot);models.set('hammer',pivot);
},undefined,error=>console.warn('Could not load supplied hammer model; using fallback',error));
function resize(){const r=stage.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function update(data){target={...target,...data};if(active!==data.tool){if(active&&models.has(active))models.get(active).visible=false;active=data.tool;if(models.has(active))models.get(active).visible=true;}}
function pointFromEvent(event){const r=stage.getBoundingClientRect(),x=THREE.MathUtils.clamp(event.clientX-r.left,0,r.width),y=THREE.MathUtils.clamp(event.clientY-r.top,0,r.height),now=performance.now(),dt=Math.max(8,now-lastPointer.time);target={...target,x,y,lookX:THREE.MathUtils.clamp((x/r.width-.5)*2,-1,1),lookY:THREE.MathUtils.clamp((y/r.height-.5)*2,-1,1),vx:THREE.MathUtils.clamp((x-lastPointer.x)/dt,-2.5,2.5),vy:THREE.MathUtils.clamp((y-lastPointer.y)/dt,-2.5,2.5),visible:true};lastPointer={x,y,time:now};}
stage.addEventListener('pointermove',pointFromEvent);
stage.addEventListener('pointerdown',event=>{pointFromEvent(event);target.pressed=true;target.actionStart=performance.now();});
stage.addEventListener('pointerup',()=>{target.pressed=false;target.actionEnd=performance.now();});
stage.addEventListener('pointercancel',()=>{target.pressed=false;target.actionEnd=performance.now();});
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-tool]');if(!button||!Object.hasOwn(profiles,button.dataset.tool))return;const r=stage.getBoundingClientRect();update({tool:button.dataset.tool,x:r.width*.5,y:r.height*.52,lookX:0,lookY:.04,pressed:false,scale:1,visible:true});});
function frame(t){
  requestAnimationFrame(frame);
  const dt=Math.min((t-lastFrame)/1000,.033)||.016;lastFrame=t;
  const model=models.get(active);if(!model||!target.visible){if(model)model.visible=false;renderer.render(scene,camera);return;}
  model.visible=true;
  const p=profiles[active]||profiles.laser,w=stage.clientWidth,h=stage.clientHeight;
  model.rotation.order=(p.recoil||p.vibrate)?'ZYX':'XYZ';
  const viewH=2*Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*camera.position.z,viewW=viewH*camera.aspect;
  const age=Math.max(0,(t-(target.actionStart||t))/1000),aimX=THREE.MathUtils.clamp(target.lookX,-1,1),aimY=THREE.MathUtils.clamp(target.lookY,-1,1);
  const handWorldX=(p.handX||0)*viewW,handWorldY=(p.handY||0)*viewH;
  const aimWorldX=(target.x/w-.5)*viewW,aimWorldY=(.5-target.y/h)*viewH;
  const pointerAngle=Math.atan2(aimWorldY-handWorldY,aimWorldX-handWorldX);
  // The imported barrels face local -X (angle PI). Rotate that axis toward the
  // pointer, with a safe first-person clamp so the gun can never spin or invert.
  const muzzleDelta=Math.atan2(Math.sin(pointerAngle-Math.PI),Math.cos(pointerAngle-Math.PI));
  const gunAim=THREE.MathUtils.clamp(muzzleDelta,-1.05,1.05);
  const cadence=(age%0.11)/.11,shot=target.pressed&&p.recoil?Math.sin(Math.min(1,cadence)*Math.PI)*Math.exp(-cadence*2.2):0;
  const swingPhase=p.swing&&target.pressed?Math.min(1,age/.3):0,swingArc=p.swing&&target.pressed?Math.sin(swingPhase*Math.PI):0;
  const punchPhase=p.punch&&target.pressed?Math.sin(Math.min(1,(age%0.34)/.34)*Math.PI):0;
  const throwPhase=p.toss&&target.pressed?Math.sin(Math.min(1,age/.38)*Math.PI):0;
  const pointerSpeed=Math.min(1,Math.hypot(target.vx,target.vy)/1.25);
  const bobCycle=t*.0085,bob=pointerSpeed*(.3+.7*Math.sin(bobCycle))*0.018;
  const walk=Math.sin(t*.0042)*.006,breath=Math.sin(t*.0017)*.0035;
  // A first-person viewmodel stays attached to the player. The pointer controls aim,
  // while only a small delayed sway reaches the hands.
  const desired=p.free?new THREE.Vector3(
    (target.x/w-.5)*viewW-target.vx*10,
    (.5-target.y/h)*viewH+target.vy*7+swingArc*viewH*.05+punchPhase*viewH*.08,
    45+punchPhase*55
  ):new THREE.Vector3(
    viewW*(p.handX+(p.recoil?bob*.18:aimX*.012))-swingArc*viewW*.12,
    viewH*(p.handY+(p.recoil?bob+breath:-aimY*.012+breath))+swingArc*viewH*.1+punchPhase*viewH*.12+throwPhase*viewH*.18,
    (p.recoil?325:38)+shot*(p.recoil?28:105)+punchPhase*70+throwPhase*115
  );
  const velocity=model.userData.velocity||(model.userData.velocity=new THREE.Vector3()),stiff=p.stiff||94,drag=p.drag||20;
  velocity.addScaledVector(desired.clone().sub(model.position),stiff*dt);velocity.multiplyScalar(Math.exp(-drag*dt));model.position.addScaledVector(velocity,dt);
  const chainNoise=p.vibrate&&target.pressed?(Math.sin(t*.12)*.014+Math.sin(t*.197)*.006):0;
  const follow=1-Math.exp(-dt*(p.recoil?16:p.swing||p.punch?20:12));
  if(p.recoil){
    // FPS viewmodels remain upright in the player's hands. Screen-space aim is
    // expressed as restrained pitch/yaw/roll instead of rotating through a full
    // world-space look-at, which could invert asymmetrical imported models.
    const desiredX=aimY*.075+bob*.35+shot*.018;
    const desiredY=-aimX*.16-target.vx*.006;
    const desiredZ=gunAim+target.vy*.004+walk-shot*.012;
    model.rotation.x+=(desiredX-model.rotation.x)*follow;
    model.rotation.y+=(desiredY-model.rotation.y)*follow;
    model.rotation.z+=(desiredZ-model.rotation.z)*follow;
  }else{
    const desiredX=aimY*.18+bob*.3+shot*.055-throwPhase*.68+punchPhase*.18;
    const desiredY=p.turn-aimX*.18-bob*.5-shot*.018+throwPhase*.3;
    const desiredZ=(p.restZ||0)-aimX*.055+walk-swingArc*1.72+chainNoise+(p.punch?punchPhase*(Math.sin(age*22)>.0?.22:-.22):0);
    model.rotation.x+=(desiredX-model.rotation.x)*follow;model.rotation.y+=(desiredY-model.rotation.y)*follow;model.rotation.z+=(desiredZ-model.rotation.z)*follow;
  }
  if(active==='grenade'&&target.pressed){model.rotation.y+=dt*4.8;model.rotation.z+=dt*3.1;}
  const base=model.userData.norm*p.size*target.scale,next=Math.abs(model.scale.x)+(base-Math.abs(model.scale.x))*(1-Math.exp(-dt*12));model.scale.setScalar(next);
  target.vx*=Math.exp(-dt*13);target.vy*=Math.exp(-dt*13);key.position.x=-aimX*420;rim.position.x=aimX*520;renderer.render(scene,camera);
}
requestAnimationFrame(frame);
function getMuzzle(){const model=models.get(active);if(!model?.userData.viewModel)return null;const point=model.localToWorld(new THREE.Vector3(model.userData.muzzleX||1,0,0)).project(camera),w=stage.clientWidth,h=stage.clientHeight;return{x:(point.x*.5+.5)*w,y:(-.5*point.y+.5)*h};}
window.unwind3D={has:name=>Object.hasOwn(profiles,name),update,getMuzzle,setVisible:visible=>{target.visible=visible;if(!visible&&active&&models.has(active))models.get(active).visible=false;},ready:()=>ready};
