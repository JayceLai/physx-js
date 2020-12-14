var physics = (() => {
  let loaded = false
  let cb = null
  let physics
  let scene
  let cooking
  let bodies = {}
  let shapes = []
  let geometries = []
  let cache = {}
  let material = null
  let vectorMaterial = null
  let BOX_GEO = null
  let SPHERE_GEO = null

  const PX = PHYSX({
    // locateFile (path) {
    //   if (path.endsWith('.wasm')) {
    //     return physxModule
    //   }
    //   return path
    // },
    onRuntimeInitialized () {
      loaded = true
      console.log('PX loaded')
      setup()
      if (cb) cb()
    },
  })

  window.PX = PX;

  const onLoad = _cb => {
    cb = _cb
    if (loaded) cb()
  }

  const setup = () => {
    const version = PX.PX_PHYSICS_VERSION
    const defaultErrorCallback = new PX.PxDefaultErrorCallback()
    const allocator = new PX.PxDefaultAllocator()
    const foundation = PX.PxCreateFoundation(
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
    const physxSimulationCallbackInstance = PX.PxSimulationEventCallback.implement(
      triggerCallback
    )

    physics = PX.PxCreatePhysics(
      version,
      foundation,
      new PX.PxTolerancesScale(),
      false,
      null
    )
    PX.PxInitExtensions(physics, null)
    const sceneDesc = PX.getDefaultSceneDesc(
      physics.getTolerancesScale(),
      0,
      physxSimulationCallbackInstance
    )
    scene = physics.createScene(sceneDesc)

    material = physics.createMaterial(0.6, 0.6, 0.2)
    material.setFrictionCombineMode(PX.PxCombineMode.eMULTIPLY)
    material.setRestitutionCombineMode(PX.PxCombineMode.eMULTIPLY)
    vectorMaterial = new PX.PxMaterialVector()
    vectorMaterial.push_back(material)

    cooking = PX.PxCreateCooking(
      version,
      foundation,
      new PX.PxCookingParams(physics.getTolerancesScale())
    )

    PX.physics = physics;
    PX.scene = scene;
    PX.cooking = cooking;
  }

  const init = entities => {
    entities.forEach(entity => {
      let geometry
      let offset = [0, 0, 0]
      if (entity.body.type === 'box') {
        if (!BOX_GEO) BOX_GEO = new PX.PxBoxGeometry({ x: 0.5, y: 0.5, z: 0.5 });
        const hx = entity.body.size[0] / 2;
        const hy = entity.body.size[1] / 2;
        const hz = entity.body.size[2] / 2;
        BOX_GEO.setHalfExtents({ x: hx, y: hy, z: hz });
        geometry = BOX_GEO
      } else if (entity.body.type === 'sphere') {
        if (!SPHERE_GEO) SPHERE_GEO = new PX.PxSphereGeometry(0.5)
        SPHERE_GEO.setRadius(entity.body.size);
        geometry = SPHERE_GEO
      } else if (entity.body.type === 'convex') {
        const g = entity.model.geometry;
        const l = g.vertices.length;
        const vArr = new PX.PxVec3Vector();
        for (let i = 0; i < l; i++) {
          vArr.push_back(g.vertices[i])
        }
        const convexMesh = cooking.createConvexMesh(vArr, physics);
        const meshScale = new PX.PxMeshScale({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 })
        geometry = new PX.PxConvexMeshGeometry(convexMesh, meshScale, new PX.PxConvexMeshGeometryFlags(1))
      } else if (entity.body.type === 'trimesh') {
        const g = entity.model.geometry;
        const l = g.vertices.length;
        const vArr = new PX.PxVec3Vector();
        for (let i = 0; i < l; i++) {
          vArr.push_back(g.vertices[i])
        }
        const l2 = g.faces.length;
        const iArr = new PX.PxU16Vector();
        for (let i = 0; i < l2; i++) {
          iArr.push_back(g.faces[i].a); iArr.push_back(g.faces[i].b); iArr.push_back(g.faces[i].c);
        }
        const trimesh = cooking.createTriMeshExt(vArr, iArr, physics);
        const meshScale = new PX.PxMeshScale({ x: 1, y: 1, z: 1 }, { x: 0, y: 0, z: 0, w: 1 })
        geometry = new PX.PxTriangleMeshGeometry(trimesh, meshScale, new PX.PxMeshGeometryFlags(0))
      } else if (entity.body.type === 'terrain') {
        const height = entity.height;
        const rows = height.rows;
        const cols = height.cols;
        const heightArr = new PX.PxHeightFieldSampleVector();
        const rowScale = height.rowScale;
        const colScale = height.colScale;
        const heiScale = height.heiScale;
        let p = 0
        for (var j = 0; j < cols; j++) {
          for (var i = 0; i < rows; i++) {
            const s = new PX.PxHeightFieldSample();
            s.height = height.data[p] / heiScale;
            heightArr.push_back(s);
            p++;
          }
        }
        const heightField = cooking.createHeightFieldExt(cols, rows, heightArr, physics);
        geometry = new PX.PxHeightFieldGeometry(heightField, new PX.PxMeshGeometryFlags(1), heiScale, rowScale, colScale);
        offset = entity.body.offset;
      }
      const flags = new PX.PxShapeFlags(
        PX.PxShapeFlag.eSCENE_QUERY_SHAPE.value |
        PX.PxShapeFlag.eSIMULATION_SHAPE.value
      )
      const shape = physics.createShape(geometry, material, true, flags)
      if (offset[0] || offset[1] || offset[2]) {
        shape.setLocalPose({
          translation: { x: offset[0], y: offset[1], z: offset[2], },
          rotation: { w: 1, x: 0, y: 0, z: 0, },
        });
      }
      const transform = {
        translation: {
          x: entity.transform.position[0],
          y: entity.transform.position[1],
          z: entity.transform.position[2],
        },
        rotation: {
          w: entity.transform.rotation[3], // PX uses WXYZ quaternions,
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
      shape.setSimulationFilterData({ word0: 1, word1: 1, word2: 0, word3: 0 })
    })
  }

  const update = entities => {
    scene.simulate(1 / 60, true)
    scene.fetchResults(true)
    entities.forEach(entity => {
      const body = bodies[entity.id]
      if (body) {
        const transform = body.getGlobalPose()
        entity.transform.position[0] = transform.translation.x
        entity.transform.position[1] = transform.translation.y
        entity.transform.position[2] = transform.translation.z
        entity.transform.rotation[0] = transform.rotation.x
        entity.transform.rotation[1] = transform.rotation.y
        entity.transform.rotation[2] = transform.rotation.z
        entity.transform.rotation[3] = transform.rotation.w
        // body.setGlobalPose(transform, true)
      }
    })
  }

  const updateSize = (index, type, size) => {
    var entity = entities[index];
    var geo = geometries[index];
    if (type == 0) {//box
      renderer.meshes[entity.id].scale.x = size[0] / entity.model.size[0];
      renderer.meshes[entity.id].scale.y = size[1] / entity.model.size[1];
      renderer.meshes[entity.id].scale.z = size[2] / entity.model.size[2];
      geo.setHalfExtents({ x: size[0] / 2, y: size[1] / 2, z: size[2] / 2 });
    } else if (type == 1) {//sphere
      renderer.meshes[entity.id].scale.set(1, 1, 1)
      renderer.meshes[entity.id].scale.multiplyScalar(size / entity.model.size);
      geo.setRadius(size);
    }
    entity.body.size = size
    shapes[index].setGeometry(geo)
  }

  const updateMaterial = (index, sf, df, r) => {
    material.setStaticFriction(sf);
    material.setDynamicFriction(df);
    material.setRestitution(r);
    shapes[index].setMaterials(vectorMaterial);
  }

  const updateIsTrigger = (index, v) => {
    if (v) {
      shapes[index].setFlag(PX.PxShapeFlag.eSIMULATION_SHAPE, !v)
      shapes[index].setFlag(PX.PxShapeFlag.eTRIGGER_SHAPE, v);
    } else {
      shapes[index].setFlag(PX.PxShapeFlag.eTRIGGER_SHAPE, v);
      shapes[index].setFlag(PX.PxShapeFlag.eSIMULATION_SHAPE, !v)
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