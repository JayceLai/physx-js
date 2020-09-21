console.log(1)
const physics = physx.createPhysics();
console.log(2)
const sceneDesc = physics.createSceneDesc();
console.log(3)
const scene = physics.createScene(sceneDesc);
console.log(4)
const geometry = new physx.BoxGeometry(50,1,50);
console.log(5)
const material = physics.createMaterial(0.3,0.2,0.1);
console.log(6)
const groundShape = physics.createShape(geometry,material)
console.log(7)
const transform = new physx.Transform([0,-0.5,0],[0,0,0,1])
console.log(8)
const actor = physics.createRigidStatic(transform);
console.log(9)
actor.attachShape(groundShape);
console.log(10)
scene.addActor(actor)
console.log(11)

const actors = [];
function createDynamic(transform,shape){
    const dynamic = physics.createRigidDynamic(transform);
    dynamic.attachShape(shape)
    scene.addActor(dynamic);
    //actors.push(dynamic);
}

const smallBoxGeometry = new physx.BoxGeometry(1,1,1);
console.log(12)
const smallBoxShape = physics.createShape(smallBoxGeometry,material)
console.log(13)
let smallBoxTransform = new physx.Transform([1,10,0],[0,0,0,1]);
console.log(14)
 
for(let i=0;i<30;++i){
    const t = smallBoxTransform.getPosition();
    //t[1] += 2;
    smallBoxTransform.setPosition(t);
    
    createDynamic(smallBoxTransform,smallBoxShape);
}
console.log(16)
for(let i=0;i<60;++i){
    scene.simulate(1/60.0)
    scene.fetchResults(true);
    let as = scene.getActiveActors(30);
    if(i % 10 == 0){
        for(let i=0;i<as.length;++i){
            let a = as[i];
            let t = a.getGlobalPose();
            let p = t.getPosition();
            let q = t.getQuaternion();
            console.log(i + "号物体的位置是" + p[0] + "," + p[1] + "," + p[2]);
        }
        

        for(let i=0;i<actors.length;++i){
            let a = actors[i];
            let t = a.getGlobalPose();
            let p = t.getPosition();
            let q = t.getQuaternion();
            console.log(i + "号物体的位置是" + p[0] + "," + p[1] + "," + p[2]);
        }
    }
}