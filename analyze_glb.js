/**
 * Analyze GLB file structure in detail.
 * Run: node analyze_glb.js
 */
const fs = require('fs');
const path = require('path');
const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const { DRACOLoader } = require('three/examples/jsm/loaders/DRACOLoader.js');

const filePath = './test_model.glb';
const buffer = fs.readFileSync(filePath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

// Set up loader
const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/gltf/');
loader.setDRACOLoader(dracoLoader);

loader.parse(arrayBuffer, '/', (gltf) => {
  const scene = gltf.scene;
  
  console.log('=== GLTF SCENE STRUCTURE ===');
  console.log('scene type:', scene.type);
  console.log('scene name:', scene.name);
  console.log('scene children:', scene.children.length);
  console.log('scene position:', formatVec3(scene.position));
  console.log('scene rotation:', formatEuler(scene.rotation));
  console.log('scene scale:', formatVec3(scene.scale));
  console.log('');

  // Print full hierarchy
  console.log('=== HIERARCHY ===');
  printHierarchy(scene, 0);

  console.log('');
  console.log('=== BOUNDING BOX (world) ===');
  const box = new THREE.Box3().setFromObject(scene);
  console.log('min:', formatVec3(box.min));
  console.log('max:', formatVec3(box.max));
  const size = new THREE.Vector3();
  box.getSize(size);
  console.log('size:', formatVec3(size));
  const center = new THREE.Vector3();
  box.getCenter(center);
  console.log('center:', formatVec3(center));

  console.log('');
  console.log('=== MESHES ===');
  let meshCount = 0;
  scene.traverse(child => {
    if (child.isMesh) {
      meshCount++;
      const geo = child.geometry;
      const bbox = new THREE.Box3();
      if (geo.boundingBox) bbox.copy(geo.boundingBox);
      else bbox.setFromBufferAttribute(geo.attributes.position);
      console.log(`Mesh #${meshCount}: "${child.name}"`);
      console.log(`  local pos: ${formatVec3(child.position)}`);
      console.log(`  local rot: ${formatEuler(child.rotation)}`);
      console.log(`  local scl: ${formatVec3(child.scale)}`);
      console.log(`  local bbox min: ${formatVec3(bbox.min)}`);
      console.log(`  local bbox max: ${formatVec3(bbox.max)}`);
      const center = new THREE.Vector3();
      bbox.getCenter(center);
      console.log(`  local bbox center: ${formatVec3(center)}`);
      
      // Get world position of mesh
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);
      console.log(`  world pos: ${formatVec3(worldPos)}`);
      
      const worldBbox = new THREE.Box3().setFromObject(child);
      const worldCenter = new THREE.Vector3();
      worldBbox.getCenter(worldCenter);
      console.log(`  world bbox center: ${formatVec3(worldCenter)}`);
      console.log('');
    }
  });
  console.log(`Total meshes: ${meshCount}`);

  // Now simulate what onModelLoaded does
  console.log('=== SIMULATING onModelLoaded ===');
  
  // 1. Scale
  const rawBox = new THREE.Box3().setFromObject(scene);
  const rawSize = new THREE.Vector3();
  rawBox.getSize(rawSize);
  const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
  const targetSize = 3.0;
  const scale = targetSize / maxDim;
  console.log(`Original size: ${formatVec3(rawSize)}, maxDim: ${maxDim}, scale: ${scale}`);
  
  scene.scale.setScalar(scale);
  scene.updateMatrixWorld(true);
  
  // 2. Compute bbox after scale
  const scaledBox = new THREE.Box3().setFromObject(scene);
  const scaledCenter = new THREE.Vector3();
  scaledBox.getCenter(scaledCenter);
  console.log(`After scale, bbox center: ${formatVec3(scaledCenter)}`);
  
  // 3. Center
  console.log(`Before centering, scene position: ${formatVec3(scene.position)}`);
  scene.position.x -= scaledCenter.x;
  scene.position.y -= scaledCenter.y;
  scene.position.z -= scaledCenter.z;
  console.log(`After centering, scene position: ${formatVec3(scene.position)}`);
  
  scene.updateMatrixWorld(true);
  
  // 4. Verify
  const verifyBox = new THREE.Box3().setFromObject(scene);
  const verifyCenter = new THREE.Vector3();
  verifyBox.getCenter(verifyCenter);
  console.log(`Verified geometry center: ${formatVec3(verifyCenter)}`);
  console.log(`Verified box min: ${formatVec3(verifyBox.min)}`);
  console.log(`Verified box max: ${formatVec3(verifyBox.max)}`);

  // 5. Also check if there are any parent transforms that might cause issues
  console.log('');
  console.log('=== PARENT / ANCESTOR CHECK ===');
  let obj = scene;
  let depth = 0;
  while (obj.parent) {
    console.log(`Ancestor depth ${depth}: type=${obj.parent.type}, pos=${formatVec3(obj.parent.position)}`);
    obj = obj.parent;
    depth++;
  }
  
  // Check gltf scenes
  console.log(`gltf.scenes: ${gltf.scenes?.length}`);
  if (gltf.scenes) {
    gltf.scenes.forEach((s, i) => {
      console.log(`  scene[${i}]: name="${s.name}", children=${s.children.length}`);
    });
  }

  // Check animations
  console.log('');
  console.log('=== ANIMATIONS ===');
  if (gltf.animations && gltf.animations.length > 0) {
    gltf.animations.forEach((clip, i) => {
      console.log(`Animation ${i}: "${clip.name}" duration=${clip.duration}s tracks=${clip.tracks.length}`);
      clip.tracks.forEach((track, j) => {
        console.log(`  Track ${j}: ${track.name} (${track.getValueSize()} values)`);
      });
    });
  } else {
    console.log('No animations');
  }

}, undefined, (err) => {
  console.error('Load error:', err);
});

function formatVec3(v) {
  if (!v) return 'N/A';
  return `(${v.x.toFixed(6)}, ${v.y.toFixed(6)}, ${v.z.toFixed(6)})`;
}

function formatEuler(e) {
  return `(${(e.x * 180 / Math.PI).toFixed(2)}°, ${(e.y * 180 / Math.PI).toFixed(2)}°, ${(e.z * 180 / Math.PI).toFixed(2)}°)`;
}

function printHierarchy(obj, indent) {
  const prefix = '  '.repeat(indent);
  const type = obj.type || 'Unknown';
  const name = obj.name || '(unnamed)';
  const pos = obj.isBone ? '' : ` pos=${formatVec3(obj.position)}`;
  const children = obj.children ? obj.children.length : 0;
  console.log(`${prefix}${type} "${name}"${pos} (children: ${children})`);
  
  if (obj.isMesh) {
    console.log(`${prefix}  [MESH] geo=${obj.geometry?.attributes?.position?.count || 0} verts, mat=${obj.material?.name || 'default'}`);
  }
  if (obj.isBone) {
    console.log(`${prefix}  [BONE]`);
  }
  if (obj.isSkinnedMesh) {
    console.log(`${prefix}  [SKINNED MESH] skeleton=${obj.skeleton?.bones?.length || 0} bones`);
  }
  
  for (const child of obj.children) {
    printHierarchy(child, indent + 1);
  }
}
