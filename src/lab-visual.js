import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// A view of the actual city asset used by the research demonstrator.
export function mountLabVisual(container) {
  const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setClearColor('#eceeeb',0);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.4;
  container.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(36,1,1,1500);
  camera.position.set(245,265,315);camera.lookAt(0,0,0);
  scene.add(new THREE.HemisphereLight('#ffffff','#a7b2b3',3));
  const sun=new THREE.DirectionalLight('#ffffff',4);sun.position.set(-60,130,70);scene.add(sun);
  const modelRoot=new THREE.Group();scene.add(modelRoot);
  let loaded=false;
  new GLTFLoader().load('/models/bangkok.glb',g=>{
    g.scene.traverse(o=>{
      if(!o.isMesh)return;
      const name=o.name.toLowerCase();
      o.material=new THREE.MeshStandardMaterial({color:name.includes('chao')?'#a0b5b2':name.includes('landmarks')?'#ee613b':name.includes('district')?'#dae0da':'#d4d9d2',roughness:.85});
      if(name.includes('architecture')||name.includes('landmarks')){
        const edge=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry,30),new THREE.LineBasicMaterial({color:'#5b6861',transparent:true,opacity:.22}));o.add(edge);
      }
    });
    modelRoot.add(g.scene);loaded=true;container.classList.add('is-loaded');
    document.querySelector('#visual-status').textContent='CITY MODEL / INTERACTIVE GEOMETRY';
  },undefined,()=>{document.querySelector('#visual-status').textContent='EXPLORE THE CITY SHOWCASE BELOW';});
  const ringMat=new THREE.MeshBasicMaterial({color:'#ed5c39',side:THREE.DoubleSide,transparent:true,opacity:.85});
  const signals=[];
  for(const [x,z] of [[12,39],[53,-28],[-49,-20],[-12,-60]]){
    const mesh=new THREE.Mesh(new THREE.RingGeometry(8,8.4,48),ringMat.clone());mesh.rotation.x=-Math.PI/2;mesh.position.set(x,1,z);modelRoot.add(mesh);signals.push(mesh);
  }
  new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;if(!w||!h)return;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe(container);
  const motionQuery=matchMedia('(prefers-reduced-motion: reduce)');
  let motion=!motionQuery.matches,visible=true,elapsed=0,last=performance.now();
  const button=document.querySelector('#visual-motion');
  function sync(){button.textContent=motion?'Pause motion Ⅱ':'Play motion ▷';button.setAttribute('aria-pressed',String(motion));}
  button.onclick=()=>{motion=!motion;sync();};
  motionQuery.addEventListener('change',()=>{motion=!motionQuery.matches;sync();});
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0}).observe(container);
  sync();
  function frame(now){requestAnimationFrame(frame);const dt=Math.min((now-last)/1000,.05);last=now;if(!visible||document.hidden)return;if(loaded&&motion){elapsed+=dt;modelRoot.rotation.y=Math.sin(elapsed*.12)*.14;signals.forEach((s,i)=>{const pulse=1+(Math.sin(elapsed*1.2+i)+1)*.3;s.scale.setScalar(pulse);});}renderer.render(scene,camera);}
  requestAnimationFrame(frame);
  window.__labVisualReady=true;
}
