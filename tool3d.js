import * as THREE from './assets/vendor/three.module.js';
import { GLTFLoader } from './assets/vendor/GLTFLoader.js';

const stage=document.querySelector('#stage');
const canvas=document.createElement('canvas');
canvas.className='tool-3d-canvas';canvas.setAttribute('aria-hidden','true');stage.append(canvas);
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0x000000,0);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-500,500,250,-250,.1,2000);camera.position.z=1000;
scene.add(new THREE.HemisphereLight(0xcdf7ff,0x291d18,2.25));
const key=new THREE.DirectionalLight(0xffffff,3.8);key.position.set(-300,420,700);key.castShadow=true;scene.add(key);
const rim=new THREE.DirectionalLight(0x48dfff,2.7);rim.position.set(400,-120,450);scene.add(rim);
const warm=new THREE.PointLight(0xff804f,2.1,1400);warm.position.set(-350,-180,500);scene.add(warm);
const loader=new GLTFLoader(),models=new Map(),urls={laser:'laser.glb',paint:'paint.glb',gun:'gun.glb',flame:'flame.glb',washer:'washer.glb',grenade:'grenade.glb'};
let active=null,target={x:0,y:0,lookX:0,lookY:0,pressed:false,scale:1},ready=true;
for(const [name,file] of Object.entries(urls))loader.load(`assets/3d/tools/${file}`,g=>{const asset=g.scene;asset.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();o.material.roughness=Math.min(.72,o.material.roughness??.6);o.material.metalness=Math.max(.08,o.material.metalness??.1);}});const box=new THREE.Box3().setFromObject(asset),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),pivot=new THREE.Group();asset.position.sub(center);pivot.add(asset);const max=Math.max(size.x,size.y,size.z)||1;pivot.userData.norm=155/max;pivot.scale.setScalar(pivot.userData.norm);pivot.visible=false;scene.add(pivot);models.set(name,pivot);},undefined,error=>console.warn(`Could not load 3D ${name} model`,error));
function resize(){const r=stage.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);renderer.setSize(w,h,false);camera.left=-w/2;camera.right=w/2;camera.top=h/2;camera.bottom=-h/2;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(stage);resize();
function update(data){target={...target,...data};if(active!==data.tool){if(active&&models.has(active))models.get(active).visible=false;active=data.tool;if(models.has(active))models.get(active).visible=true;}}
function frame(t){requestAnimationFrame(frame);const model=models.get(active);if(!model||!target.visible){if(model)model.visible=false;renderer.render(scene,camera);return;}model.visible=true;const w=stage.clientWidth,h=stage.clientHeight;model.position.x+=(target.x-w/2-model.position.x)*.24;model.position.y+=(h/2-target.y-model.position.y)*.24;model.position.z=target.pressed?38:0;const gunLike=active!=='grenade';model.rotation.x+=(target.lookY*.72+(target.pressed&&gunLike?-.08:0)-model.rotation.x)*.2;model.rotation.y+=(-target.lookX*1.05-model.rotation.y)*.2;model.rotation.z+=((gunLike?-.12:0)+target.lookX*.16+(target.pressed?-.08:0)-model.rotation.z)*.2;const pulse=target.pressed?(active==='grenade'?.86:.94):1,base=model.userData.norm*(active==='grenade'?1.02:1.18)*target.scale,next=model.scale.x+(base*pulse-model.scale.x)*.18;model.scale.setScalar(next);key.position.x=-target.lookX*420;rim.position.x=target.lookX*520;renderer.render(scene,camera);}
requestAnimationFrame(frame);
window.unwind3D={has:name=>Object.hasOwn(urls,name),update,setVisible:visible=>{target.visible=visible;if(!visible&&active&&models.has(active))models.get(active).visible=false;},ready:()=>ready};
