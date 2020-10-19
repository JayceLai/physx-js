let tick = 0

const entities = makeEntities()

function generateHeight (width, depth, minHeight, maxHeight) {
  // Generates the height data (a sinus wave)
  var size = width * depth;
  var data = new Float32Array(size);
  var hRange = maxHeight - minHeight;
  var w2 = width / 2;
  var d2 = depth / 2;
  var phaseMult = 12;
  var p = 0;
  for (var j = 0; j < depth; j++) {
    for (var i = 0; i < width; i++) {
      var radius = Math.sqrt(Math.pow((i - w2) / w2, 2.0) + Math.pow((j - d2) / d2, 2.0));
      var height = (Math.sin(radius * phaseMult) + 1) * 0.5 * hRange + minHeight;
      data[p] = height;
      p++;
    }
  }
  return data;
}

var terrainWidth = 40;
var terrainDepth = 40;
var terrainMaxHeight = 1.5;
var terrainMinHeight = -0.75;
var heights = generateHeight(terrainWidth, terrainDepth, terrainMinHeight, terrainMaxHeight);

entities.push({
  id: Number.MAX_SAFE_INTEGER,
  transform: {
    position: [0, 0, 0],
    rotation: [0, 0, 0, 1],
  },
  model: {
    type: 'terrain',
    data: heights,
  },
  body: {
    type: 'terrain',
    data: heights,
    dynamic: false,
  },
})

const update = () => {
  tick++
  physics.update(entities)
  renderer.update(entities)
  // if (tick >= 200) return // DEBUG: only run a few ticks then stop
  requestAnimationFrame(update)
}

physics.onLoad(() => {
  renderer.init(entities)
  physics.init(entities)
  update()
})
