/* Boot-straps Three.js, interpreter & GUI[1] */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { buildSceneFromSchema } from '$lib/modules/interpreter/index.js';
import { initGUI } from './guiControls.js';

export function start(canvas, schema){
  /* Three.js setup */
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true});
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.shadowMap.enabled=true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

  const scene=new THREE.Scene(); scene.background=new THREE.Color('#f8f9fa');
  const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);
  camera.position.set(4,3,6);
  const ctrls=new OrbitControls(camera,renderer.domElement);

  /* Lights / ground (same as original) */
  // Key Light (Main directional light from front-top-right)
    const sun = new THREE.DirectionalLight("#ffffff", 2.5);
    sun.position.set(8, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 50;
    sun.shadow.camera.left = -100;
    sun.shadow.camera.right = 100;
    sun.shadow.camera.top = 100;
    sun.shadow.camera.bottom = -100;
    sun.shadow.bias = -0.0001;
    scene.add(sun);

    // Fill Light (Softer light from front-left to reduce harsh shadows)
    const fillLight = new THREE.DirectionalLight("#e6f3ff", 0.8);
    fillLight.position.set(-6, 8, 4);
    scene.add(fillLight);

    // Rim Light (Back light for edge definition and depth)
    const rimLight = new THREE.DirectionalLight("#fff8e1", 1.2);
    rimLight.position.set(-4, 6, -8);
    scene.add(rimLight);

    // Ambient Light (Soft overall illumination)
    const ambientLight = new THREE.AmbientLight("#f0f8ff", 0.3);
    scene.add(ambientLight);

    // Environment Light (Hemisphere for natural feel)
    const hemisphereLight = new THREE.HemisphereLight("#87ceeb", "#deb887", 0.6);
    scene.add(hemisphereLight);

    // Ground plane for better shadow reception
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.15 });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    scene.add(ground);

  /* Build scene */
  const {objects,regenerate}=buildSceneFromSchema(schema,scene);

  /* GUI */
  initGUI(schema,objects,regenerate);

  /* Export OBJ */
  function exportOBJ(filename = 'scene.obj') {
  const exporter = new OBJExporter();

  const exportGroup = new THREE.Group();

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.name !== 'ground') {
      // Clone the mesh so we don’t affect the scene
      const cloned = child.clone();

      // Make sure world transformations are up to date
      child.updateWorldMatrix(true, false);

      // Bake world transform into mesh geometry
      // This mutates the cloned geometry!
      cloned.geometry = cloned.geometry.clone();
      cloned.applyMatrix4(child.matrixWorld);

      // Apply position/rotation/scale = identity, since it’s all baked into geometry
      cloned.position.set(0, 0, 0);
      cloned.rotation.set(0, 0, 0);
      cloned.scale.set(1, 1, 1);

      exportGroup.add(cloned);
    }
  });

  // Export the group as OBJ
  const objData = exporter.parse(exportGroup);

  // Download
  const blob = new Blob([objData], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download =  filename + '.obj';
  link.click();
  URL.revokeObjectURL(url);
}


  /* Responsive */
  window.addEventListener('resize',()=>{
    camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  });

  /* Animate */
  (function animate(){
    requestAnimationFrame(animate);
    ctrls.update(); renderer.render(scene,camera);
  })();

  // Return the export function along with other methods that may be added later
  return { exportOBJ };
}
