const T=require('three'),fs=require('fs');
const {FBXLoader:F}=require('three/examples/jsm/loaders/FBXLoader.js');
const {GLTFLoader:G}=require('three/examples/jsm/loaders/GLTFLoader.js');

// FBX path: shift meshes + update bind, then scale
const fbx=new F().parse(fs.readFileSync('./test_model.fbx').buffer,'/');
const pc=new T.Box3().setFromObject(fbx).getCenter(new T.Vector3());
const o=pc.clone().negate();
fbx.traverse(c=>{if(c.isMesh||c.isSkinnedMesh){c.position.add(o);if(c.isSkinnedMesh&&c.skeleton){c.bindMatrix.copy(c.matrixWorld);c.bindMatrixInverse.copy(c.bindMatrix).invert();}}});
fbx.updateMatrixWorld(true);
fbx.scale.setScalar(3.0/Math.max(...new T.Box3().setFromObject(fbx).getSize(new T.Vector3()).toArray()));
fbx.updateMatrixWorld(true);
const v1=new T.Box3().setFromObject(fbx).getCenter(new T.Vector3());
const fbxOk=v1.length()<0.001;

// GLB path: scale then center
const gb=fs.readFileSync('./test_model.glb');
new G().parse(gb.buffer.slice(gb.byteOffset,gb.byteOffset+gb.byteLength),'/',g=>{
  g.scene.scale.setScalar(3.0/Math.max(...new T.Box3().setFromObject(g.scene).getSize(new T.Vector3()).toArray()));
  g.scene.updateMatrixWorld(true);
  g.scene.position.sub(new T.Box3().setFromObject(g.scene).getCenter(new T.Vector3()));
  g.scene.updateMatrixWorld(true);
  const v2=new T.Box3().setFromObject(g.scene).getCenter(new T.Vector3());
  const glbOk=v2.length()<0.001;
  const result='FBX: '+(fbxOk?'PASS':'FAIL')+'\nGLB: '+(glbOk?'PASS':'FAIL')+'\n=== '+(fbxOk&&glbOk?'ALL PASS':'FAIL')+' ===';
  console.log(result);
  try{fs.writeFileSync(process.env.TMP+'\\hermes-verify-result.txt',result);}catch(e){}
  process.exit(fbxOk&&glbOk?0:1);
},undefined,()=>{process.exit(1);});
