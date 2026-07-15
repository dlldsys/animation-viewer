/**
 * Verify root bone stripping logic.
 * Run: node verify_stripping.js
 */
const fs = require('fs');
const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const { DRACOLoader } = require('three/examples/jsm/loaders/DRACOLoader.js');

const buffer = fs.readFileSync('./test_model.glb');
const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

const loader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('./node_modules/three/examples/jsm/libs/draco/gltf/');
loader.setDRACOLoader(dracoLoader);

loader.parse(arrayBuffer, '/', (gltf) => {
  const model = gltf.scene;
  const clip = gltf.animations[0];

  console.log('=== Original tracks ===');
  clip.tracks.forEach(t => console.log(`  ${t.name}`));
  console.log(`Total: ${clip.tracks.length}`);

  // Simulate enhanced stripping logic
  const animatedNodeNames = new Set();
  clip.tracks.forEach(t => {
    animatedNodeNames.add(t.name.split('.')[0]);
  });

  // Find root bones
  const rootBoneNames = new Set();
  function findRootBones(obj) {
    if (obj.isBone && (!obj.parent || !obj.parent.isBone)) {
      rootBoneNames.add(obj.name);
    }
    obj.children?.forEach(c => findRootBones(c));
  }
  findRootBones(model);

  console.log('\n=== Root bones found ===');
  rootBoneNames.forEach(n => console.log(`  ${n}`));

  // Build strip list
  const stripNodes = new Set();
  animatedNodeNames.forEach(name => {
    if (name === model.name) stripNodes.add(name);
    if (model.getObjectByName(name)?.parent === model) stripNodes.add(name);
    if (rootBoneNames.has(name)) stripNodes.add(name);
  });

  console.log('\n=== Nodes to strip ===');
  stripNodes.forEach(n => console.log(`  ${n}`));

  // Apply stripping
  const filtered = clip.tracks.filter(t => {
    const [nodeName, prop] = t.name.split('.');
    if (stripNodes.has(nodeName) && ['position','rotation','scale','quaternion'].includes(prop)) {
      return false;
    }
    return true;
  });

  const stripped = clip.tracks.length - filtered.length;
  console.log(`\n=== Results ===`);
  console.log(`Original tracks: ${clip.tracks.length}`);
  console.log(`Stripped tracks: ${stripped}`);
  console.log(`Remaining tracks: ${filtered.length}`);

  // Check if Dummy001 root motion is gone
  const dummyPosRemaining = filtered.filter(t => t.name.startsWith('Dummy001.')).length;
  console.log(`Dummy001 tracks remaining: ${dummyPosRemaining} (expect 0 for pos/rot/scl)`);

  // Also check if the model can be centered
  const scale = 3.0 / Math.max(...(new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3()).toArray()));
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  model.updateMatrixWorld(true);
  const verify = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());

  console.log(`\n=== Centering verification ===`);
  console.log(`Geometry center after positioning: (${verify.x.toFixed(6)}, ${verify.y.toFixed(6)}, ${verify.z.toFixed(6)})`);
  console.log(`Centered correctly: ${verify.length() < 0.001 ? 'YES' : 'NO (deviation: ' + verify.length().toFixed(6) + ')'}`);

}, undefined, err => console.error('Error:', err));
