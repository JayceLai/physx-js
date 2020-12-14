window.THREE = THREE;
var renderer = (() => {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '0'
  container.style.right = '0'
  container.style.bottom = '0'
  document.body.appendChild(container)

  const scene3 = new THREE.Scene()
  scene3.background = new THREE.Color('white')

  const dirLight = new THREE.DirectionalLight('white', 0.8)
  dirLight.position.set(-1, 1.75, 1)
  dirLight.position.multiplyScalar(30)
  dirLight.castShadow = true
  dirLight.shadow.mapSize.width = 1024
  dirLight.shadow.mapSize.height = 1024
  scene3.add(dirLight)

  const light = new THREE.AmbientLight('white', 0.3)
  scene3.add(light)

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.fromArray([
    -0.4013406342550598,
    7.44362999004455,
    11.24080658033156,
  ])
  camera.quaternion.fromArray([
    -0.28811373671368645,
    -0.017086547783363,
    -0.005141753910019259,
    0.9574299384124418,
  ])

  const renderer = new THREE.WebGLRenderer()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true

  const controls = new THREE.OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = false
  controls.minDistance = 1
  controls.maxDistance = 500
  controls.maxPolarAngle = Math.PI / 2

  const static = new THREE.MeshPhongMaterial({ color: 0xC7C7C7 });
  const dynamic = new THREE.MeshStandardMaterial({ color: '#C0C700' })
  const trigger = new THREE.MeshStandardMaterial({ color: '#65C7F1' })

  container.appendChild(renderer.domElement)

  const meshes = {}

  const init = entities => {
    entities.forEach(entity => {
      let geometry
      let material = entity.body.dynamic ? dynamic : static;
      let scale = [1, 1, 1]
      if (entity.model.type === 'box') {
        geometry = new THREE.BoxGeometry(
          entity.model.size[0],
          entity.model.size[1],
          entity.model.size[2]
        )
      } else if (entity.model.type === 'sphere') {
        geometry = new THREE.SphereGeometry(
          entity.model.size,
          32, 32
        )
      } else if (entity.model.type == 'cone') {
        geometry = new THREE.ConeGeometry(
          entity.model.size[0],
          entity.model.size[1],
          entity.model.size[2]
        )
      } else if (entity.model.type == 'terrain') {
        geometry = new THREE.PlaneBufferGeometry(
          entity.height.rows - 1,
          entity.height.cols - 1,
          entity.height.rows - 1,
          entity.height.cols - 1
        );
        geometry.rotateX(- Math.PI / 2);
        var vertices = geometry.attributes.position.array;
        for (var i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
          // j + 1 because it is the y component that we modify
          vertices[j + 1] = entity.height.data[i] / entity.height.heiScale;
        }
        geometry.computeVertexNormals();
        scale[0] = entity.height.rowScale
        scale[1] = entity.height.heiScale
        scale[2] = entity.height.colScale
      }
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.fromArray(entity.transform.position)
      mesh.quaternion.fromArray(entity.transform.rotation)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.scale.x = scale[0]
      mesh.scale.y = scale[1]
      mesh.scale.z = scale[2]
      entity.model.geometry = geometry
      entity.model.mesh = mesh
      entity.model.material = material
      meshes[entity.id] = mesh
      scene3.add(mesh)
    })
  }

  const update = entities => {
    entities.forEach(entity => {
      const mesh = meshes[entity.id]
      mesh.position.fromArray(entity.transform.position)
      mesh.quaternion.fromArray(entity.transform.rotation)
    })
    controls.update()
    renderer.render(scene3, camera)
  }

  return {
    init,
    update,
    meshes
  }
})();
