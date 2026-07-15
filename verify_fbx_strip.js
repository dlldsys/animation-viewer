/**
 * Verify FBX root bone stripping logic.
 * Run: node verify_fbx_strip.js
 */
const fs = require('fs');
const THREE = require('three');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');

const buffer = fs.readFileSync('./test_model.fbx');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
const fbx = new FBXLoader().parse(arrayBuffer, '/');
const clip = fbx.animations[0];

console.log('=== ANIMATION TRACKS (strip-worthy) ===');
const rootBoneNames = new Set();
function findRootBones(obj) {
  if (obj.isBone && (!obj.parent || !obj.parent.isBone)) rootBoneNames.add(obj.name);
  obj.children?.forEach(c => findRootBones(c));
}
findRootBones(fbx);
console.log('Root bones:', [...rootBoneNames]);

const animatedNodeNames = new Set();
clip.tracks.forEach(t => animatedNodeNames.add(t.name.split('.')[0]));

const stripNodes = new Set();
animatedNodeNames.forEach(name => {
  if (name === fbx.name) stripNodes.add(name);
  if (fbx.getObjectByName(name)?.parent === fbx) stripNodes.add(name);
  if (rootBoneNames.has(name)) stripNodes.add(name);
});
console.log('Strip nodes:', [...stripNodes]);

const filtered = clip.tracks.filter(t => {
  const [n, p] = t.name.split('.');
  if (stripNodes.has(n) && ['position','rotation','scale','quaternion'].includes(p)) return false;
  return true;
});
console.log(`Stripped: ${clip.tracks.length - filtered.length}, Remaining: ${filtered.length}`);

// Also check centering
const scale = 3.0 / Math.max(...new THREE.Box3().setFromObject(fbx).getSize(new THREE.Vector3()).toArray());
fbx.scale.setScalar(scale);
fbx.updateMatrixWorld(true);
const box = new THREE.Box3().setFromObject(fbx);
const center = box.getCenter(new THREE.Vector3());
fbx.position.sub(center);
fbx.updateMatrixWorld(true);
const vc = new THREE.Box3().setFromObject(fbx).getCenter(new THREE.Vector3());
console.log(`\nCentered: ${vc.length() < 0.001 ? 'YES ✅' : 'NO ❌ ('+vc.length().toFixed(6)+')'}`);
