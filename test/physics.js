var physics = (() => {
  let loaded = false
  let cb = null
  let physics
  let scene
  let bodies = {}
  let shapes = []
  let geometries = []
  let cache = {}

  const PhysX = PHYSX({
    // locateFile (path) {
    //   if (path.endsWith('.wasm')) {
    //     return physxModule
    //   }
    //   return path
    // },
    onRuntimeInitialized () {
      loaded = true
      console.log('PhysX loaded')
      setup()
      if (cb) cb()
    },
  })

  window.PhysX = PhysX;

  const onLoad = _cb => {
    cb = _cb
    if (loaded) cb()
  }

  const setup = () => {
    const version = PhysX.PX_PHYSICS_VERSION
    const defaultErrorCallback = new PhysX.PxDefaultErrorCallback()
    const allocator = new PhysX.PxDefaultAllocator()
    const foundation = PhysX.PxCreateFoundation(
      version,
      allocator,
      defaultErrorCallback
    )
    const triggerCallback = {
      onContactBegin: () => { },
      onContactEnd: () => { },
      onContactPersist: () => { },
      onTriggerBegin: () => { },
      onTriggerEnd: () => { },
    }
    const physxSimulationCallbackInstance = PhysX.PxSimulationEventCallback.implement(
      triggerCallback
    )

    physics = PhysX.PxCreatePhysics(
      version,
      foundation,
      new PhysX.PxTolerancesScale(),
      false,
      null
    )
    PhysX.PxInitExtensions(physics, null)
    const sceneDesc = PhysX.getDefaultSceneDesc(
      physics.getTolerancesScale(),
      0,
      physxSimulationCallbackInstance
    )
    scene = physics.createScene(sceneDesc)
  }

  const init = entities => {
    entities.forEach(entity => {
      let geometry
      if (entity.body.type === 'box') {
        const hx = entity.body.size[0] / 2;
        const hy = entity.body.size[1] / 2;
        const hz = entity.body.size[2] / 2;
        const key = `${hx}-${hy}-${hz}`;
        if (!cache[key]) {
          cache[key] = new PhysX.PxBoxGeometry(
            // PhysX uses half-extents
            entity.body.size[0] / 2,
            entity.body.size[1] / 2,
            entity.body.size[2] / 2
          )
        }
        geometry = cache[key];
      } else if (entity.body.type === 'sphere') {
        const key = entity.body.size + '';
        if (!cache[key]) {
          cache[key] = new PhysX.PxSphereGeometry(entity.body.size)
        }
        geometry = cache[key];
      }
      const material = physics.createMaterial(0.2, 0.2, 0.2)
      const flags = new PhysX.PxShapeFlags(
        PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
        PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
      )
      const shape = physics.createShape(geometry, material, false, flags)
      const transform = {
        translation: {
          x: entity.transform.position[0],
          y: entity.transform.position[1],
          z: entity.transform.position[2],
        },
        rotation: {
          w: entity.transform.rotation[3], // PhysX uses WXYZ quaternions,
          x: entity.transform.rotation[0],
          y: entity.transform.rotation[1],
          z: entity.transform.rotation[2],
        },
      }
      let body
      if (entity.body.dynamic) {
        body = physics.createRigidDynamic(transform)
        body.setMass(1)
      } else {
        body = physics.createRigidStatic(transform)
      }

      // if (entity.id == 1) {
      //   entity.body.size[0] /= 2;
      //   entity.model.size[0] /= 2;
      //   var he = geometry.halfExtents;
      //   geometry.halfExtents = { x: entity.body.size[0] / 2, y: he.y, z: he.z };
      //   shape.setGeometry(geometry);
      // }

      body.attachShape(shape)
      bodies[entity.id] = body
      shapes.push(shape);
      geometries.push(geometry);
      scene.addActor(body, null)
      shape.setSimulationFilterData(new PhysX.PxFilterData(1, 1, 0, 0))
    })
  }

  const update = entities => {
    scene.simulate(1 / 60, true)
    scene.fetchResults(true)
    entities.forEach(entity => {
      const body = bodies[entity.id]
      const transform = body.getGlobalPose()
      entity.transform.position[0] = transform.translation.x
      entity.transform.position[1] = transform.translation.y
      entity.transform.position[2] = transform.translation.z
      entity.transform.rotation[0] = transform.rotation.x
      entity.transform.rotation[1] = transform.rotation.y
      entity.transform.rotation[2] = transform.rotation.z
      entity.transform.rotation[3] = transform.rotation.w
      body.setGlobalPose(transform, true)
    })
  }

  const updateSize = (index, type, size) => {
    var entity = entities[index];
    var geo = geometries[index];
    if (type == 0) {//box
      renderer.meshes[entity.id].scale.x = size[0] / entity.model.size[0];
      renderer.meshes[entity.id].scale.y = size[1] / entity.model.size[1];
      renderer.meshes[entity.id].scale.z = size[2] / entity.model.size[2];
      geo.halfExtents = { x: size[0] / 2, y: size[1] / 2, z: size[2] / 2 }
    } else if (type == 1) {//sphere
      geo.radius = size
      renderer.meshes[entity.id].scale.set(1,1,1)
      renderer.meshes[entity.id].scale.multiplyScalar(size / entity.model.size);
    }
    entity.body.size = size
    shapes[index].setGeometry(geo)
  }

  return {
    init,
    update,
    onLoad,
    updateSize,
    bodies,
    shapes,
    geometries
  }
})();