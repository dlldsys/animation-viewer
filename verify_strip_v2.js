const fs = require('fs');
const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const { DRACOLoader } = require('three/examples/jsm/loaders/DRACOLoader.js');
const { FBXLoader } = require('three/examples/jsm/loaders/FBXLoader.js');

function hasMeshDescendant(obj) {
  if (obj.isMesh || obj.isSkinnedMesh) return true;
  return obj.children?.some(c => hasMeshDescendant(c)) ?? false;
}

function analyzeModel(model, clip, label) {
  if (!clip) return console.log(`${label}: no animations`);
  // root bones
  const rootBoneNames = new Set();
  function findRootBones(obj) {
    if (obj.isBone && (!obj.parent || !obj.parent.isBone)) rootBoneNames.add(obj.name);
    obj.children?.forEach(c => findRootBones(c));
  }
  findRootBones(model);
  // empty groups (direct children with no mesh descendants)
  const emptyGroupNames = new Set();
  model.children.forEach(c => { if (!hasMeshDescendant(c)) emptyGroupNames.add(c.name); });
  // strip nodes
  const stripNodes = new Set();
  rootBoneNames.forEach(n => stripNodes.add(n));
  emptyGroupNames.forEach(n => stripNodes.add(n));
  // count
  const stripped = clip.tracks.filter(t => {
    const [n, p] = t.name.split('.');
    return stripNodes.has(n) && ['position','rotation','scale','quaternion'].includes(p);
  }).length;
  const meshTracks = clip.tracks.filter(t => {
    const n = t.name.split('.')[0];
    return !rootBoneNames.has(n) && !emptyGroupNames.has(n);
  }).length;
  console.log(`${label}: rootBones=[${[...rootBoneNames].join(',')}] emptyGroups=[${[...emptyGroupNames].join(',')}] stripped=${stripped}/${clip.tracks.length} meshTracks=${meshTracks}`);
}

// GLB
const glbBuf = fs.readFileSync('./test_model.glb');
new GLTFLoader().parse(glbBuf.buffer.slice(glbBuf.byteOffset, glbBuf.byteOffset + glbBuf.byteLength), '/',
  g => analyzeModel(g.scene, g.animations[0], 'GLB'), () => {});

// FBX
const fbxBuf = fs.readFileSync('./test_model.fbx');
const fbx = new FBXLoader().parse(fbxBuf.buffer.slice(fbxBuf.byteOffset, fbxBuf.byteOffset + fbxBuf.byteLength), '/');
analyzeModel(fbx, fbx.animations[0], 'FBX');
