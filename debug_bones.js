/**
 * Debug: check bone positions relative to meshes for both GLB and FBX.
 */
const T=require('three'),{GLTFLoader:G}=require('three/examples/jsm/loaders/GLTFLoader.js'),{FBXLoader:F}=require('three/examples/jsm/loaders/FBXLoader.js'),fs=require('fs');

function bonePositions(m,label){
  console.log(label+' bones:');
  m.traverse(c=>{if(c.isBone){
    const wp=new T.Vector3();c.getWorldPosition(wp);
    console.log('  '+c.name+' world=('+wp.x.toFixed(2)+','+wp.y.toFixed(2)+','+wp.z.toFixed(2)+') local=('+c.position.x.toFixed(2)+','+c.position.y.toFixed(2)+','+c.position.z.toFixed(2)+')');
  }});
  console.log(label+' mesh world bboxes:');
  m.traverse(c=>{if(c.isMesh){
    const b=new T.Box3().setFromObject(c),bc=b.getCenter(new T.Vector3());
    console.log('  '+c.name+' worldCenter=('+bc.x.toFixed(2)+','+bc.y.toFixed(2)+','+bc.z.toFixed(2)+')');
  }});
}

const gb=fs.readFileSync('./test_model.glb');
new G().parse(gb.buffer.slice(gb.byteOffset,gb.byteOffset+gb.byteLength),'/',g=>{
  bonePositions(g.scene,'GLB (before centering)');
  const fb=fs.readFileSync('./test_model.fbx');
  const f=new F().parse(fb.buffer.slice(fb.byteOffset,fb.byteOffset+fb.byteLength),'/');
  bonePositions(f,'FBX (before centering)');
});
