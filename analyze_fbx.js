/**
 * Analyze FBX file structure in detail.
 * Run: node analyze_fbx.js
 */
const fs = require('fs');
const THREE = require('three');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');

const filePath = './test_model.fbx';
const buffer = fs.readFileSync(filePath);
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new FBXLoader();
const fbx = loader.parse(arrayBuffer, '/');

console.log('=== FBX SCENE STRUCTURE ===');
console.log('fbx type:', fbx.type);
console.log('fbx name:', fbx.name);
console.log('fbx children:', fbx.children.length);
console.log('fbx position:', formatVec3(fbx.position));
console.log('fbx rotation:', formatEuler(fbx.rotation));
console.log('fbx scale:', formatVec3(fbx.scale));
console.log('');

// Print full hierarchy
console.log('=== HIERARCHY ===');
printHierarchy(fbx, 0);

console.log('');
console.log('=== BOUNDING BOX (world) ===');
const box = new THREE.Box3().setFromObject(fbx);
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
fbx.traverse(child => {
  if (child.isMesh) {
    meshCount++;
    const geo = child.geometry;
    const bbox = new THREE.Box3().setFromObject(child);
    const bcenter = new THREE.Vector3();
    bbox.getCenter(bcenter);
    console.log(`Mesh #${meshCount}: "${child.name}"`);
    console.log(`  local pos: ${formatVec3(child.position)}  rot: ${formatEuler(child.rotation)}  scl: ${formatVec3(child.scale)}`);
    console.log(`  world bbox center: ${formatVec3(bcenter)}`);
    console.log(`  world pos: ${formatVec3(new THREE.Vector3().setFromMatrixPosition(child.matrixWorld))}`);
    console.log('');
  }
});
console.log(`Total meshes: ${meshCount}`);

// Simulate what onModelLoaded does
console.log('=== SIMULATING onModelLoaded ===');
const rawBox = new THREE.Box3().setFromObject(fbx);
const rawSize = new THREE.Vector3();
rawBox.getSize(rawSize);
const maxDim = Math.max(rawSize.x, rawSize.y, rawSize.z);
const targetSize = 3.0;
const scale = targetSize / maxDim;
console.log(`Original size: ${formatVec3(rawSize)}, maxDim: ${maxDim}, scale: ${scale}`);

fbx.scale.setScalar(scale);
fbx.updateMatrixWorld(true);

const scaledBox = new THREE.Box3().setFromObject(fbx);
const scaledCenter = new THREE.Vector3();
scaledBox.getCenter(scaledCenter);
console.log(`After scale, bbox center: ${formatVec3(scaledCenter)}`);
console.log(`Before centering, fbx position: ${formatVec3(fbx.position)}`);

fbx.position.x -= scaledCenter.x;
fbx.position.y -= scaledCenter.y;
fbx.position.z -= scaledCenter.z;
console.log(`After centering, fbx position: ${formatVec3(fbx.position)}`);

fbx.updateMatrixWorld(true);
const verifyBox = new THREE.Box3().setFromObject(fbx);
const verifyCenter = new THREE.Vector3();
verifyBox.getCenter(verifyCenter);
console.log(`Verified geometry center: ${formatVec3(verifyCenter)}`);
console.log(`Verified box min: ${formatVec3(verifyBox.min)}`);
console.log(`Verified box max: ${formatVec3(verifyBox.max)}`);

// Check animations
console.log('');
console.log('=== ANIMATIONS ===');
if (fbx.animations && fbx.animations.length > 0) {
  fbx.animations.forEach((clip, i) => {
    console.log(`Animation ${i}: "${clip.name}" duration=${clip.duration}s tracks=${clip.tracks.length}`);
    clip.tracks.forEach((track, j) => {
      console.log(`  Track ${j}: ${track.name} (${track.getValueSize()} values)`);
    });
  });
} else {
  console.log('No animations');
}

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
  const pos = obj.isBone ? '' : ` pos=${formatVec3(obj.position)} rot=${formatEuler(obj.rotation)}`;
  const children = obj.children ? obj.children.length : 0;
  console.log(`${prefix}${type} "${name}"${pos} (children: ${children})`);
  
  if (obj.isMesh) {
    console.log(`${prefix}  [MESH] geo=${obj.geometry?.attributes?.position?.count || 0} verts, mat=${obj.material?.name || 'default'}`);
  }
  if (obj.isBone) {
    console.log(`${prefix}  [BONE]`);
  }
  
  for (const child of obj.children) {
    printHierarchy(child, indent + 1);
  }
}
