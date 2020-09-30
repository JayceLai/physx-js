var physics = (() => {
  let loaded = false
  let cb = null
  let physics
  let scene
  let bodies = {}
  let shapes = []
  let geometries = []
  let cache = {}
  let material = null
  let vectorMaterial = null
  let BOX_GEO = null
  let SPHERE_GEO = null

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

    material = physics.createMaterial(0.2, 0.2, 0.2)
    vectorMaterial = new PhysX.VectorPxMaterial()
    vectorMaterial.push_back(material)

    PhysX.physics = physics;
    PhysX.scene = scene;
  }

  const init = entities => {
    entities.forEach(entity => {
      let geometry
      if (entity.body.type === 'box') {
        if (!BOX_GEO) BOX_GEO = new PhysX.PxBoxGeometry(0.5, 0.5, 0.5);
        const hx = entity.body.size[0] / 2;
        const hy = entity.body.size[1] / 2;
        const hz = entity.body.size[2] / 2;
        BOX_GEO.halfExtents = { x: hx, y: hy, z: hz }
        geometry = BOX_GEO
      } else if (entity.body.type === 'sphere') {
        if (!SPHERE_GEO) SPHERE_GEO = new PhysX.PxSphereGeometry(0.5)
        SPHERE_GEO.radius = entity.body.size
        geometry = SPHERE_GEO
      }
      const flags = new PhysX.PxShapeFlags(
        PhysX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
        PhysX.PxShapeFlag.eSIMULATION_SHAPE.value
      )
      // var material2 = physics.createMaterial(0.2, 0.2, 0.2)
      const shape = physics.createShape(geometry, material, true, flags)
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

      if (entity.id == 1) {
        // update size
        // entity.body.size[0] /= 2;
        // entity.model.size[0] /= 2;
        // var he = geometry.halfExtents;
        // geometry.halfExtents = { x: entity.body.size[0] / 2, y: he.y, z: he.z };
        // shape.setGeometry(geometry);

        // update material
        // shape.setMaterials(vectorMaterial);
      }

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
      renderer.meshes[entity.id].scale.set(1, 1, 1)
      renderer.meshes[entity.id].scale.multiplyScalar(size / entity.model.size);
      geo.radius = size
    }
    entity.body.size = size
    shapes[index].setGeometry(geo)
  }

  const updateMaterial = (index, sf, df, r) => {
    material.setStaticFriction(sf);
    material.setDynamicFriction(df);
    material.setRestitution(r);
    // shapes[index].setMaterials(vectorMaterial);
  }

  const updateIsTrigger = (index, v) => {
    if (v) {
      shapes[index].setFlag(PhysX.PxShapeFlag.eSIMULATION_SHAPE, !v)
      shapes[index].setFlag(PhysX.PxShapeFlag.eTRIGGER_SHAPE, v);
    } else {
      shapes[index].setFlag(PhysX.PxShapeFlag.eTRIGGER_SHAPE, v);
      shapes[index].setFlag(PhysX.PxShapeFlag.eSIMULATION_SHAPE, !v)
    }
  }

  return {
    init,
    update,
    onLoad,
    updateSize,
    updateMaterial,
    updateIsTrigger,
    bodies,
    shapes,
    geometries,
    material,
    vectorMaterial
  }
})();