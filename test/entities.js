
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
var terrainMaxHeight = 1;
var terrainMinHeight = -0.5;
var heights = generateHeight(terrainWidth, terrainDepth, terrainMinHeight, terrainMaxHeight);
var terrainRowScale = 2;
var terrainColScale = 2;
var terrainHeiScale = 1 / 1000;

const makeEntities = () => {
  let ids = 0
  const entities = []

  // terrain
  entities.push({
    id: ++ids,
    transform: {
      position: [0, -2, 0],
      rotation: [0, 0, 0, 1],
    },
    height: {
      data: heights,
      rows: terrainWidth,
      cols: terrainDepth,
      maxH: terrainMaxHeight,
      minH: terrainMinHeight,
      rowScale: terrainRowScale,
      colScale: terrainColScale,
      heiScale: terrainHeiScale,
    },
    model: {
      type: 'terrain',
    },
    body: {
      type: 'terrain',
      dynamic: false,
      offset: [-terrainWidth * terrainRowScale / 2, 0, -terrainDepth * terrainColScale / 2],
    },
  })

  // static primitive box
  entities.push({
    id: ++ids,
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0, 1],
    },
    model: {
      type: 'box',
      size: [10, 1, 10],
    },
    body: {
      type: 'box',
      size: [10, 1, 10],
      dynamic: false,
    },
  })
  
  // trimesh box
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 5; j++) {
      entities.push({
        id: ++ids,
        transform: {
          position: [
            -2.5 + i + 0.5 * i,
            3,
            -2.5 + j + 0.5 * j,
          ],
          rotation: [0, 0, 0, 1],
        },
        model: {
          type: 'box',
          size: [1, 1, 1],
        },
        body: {
          type: 'trimesh',
          dynamic: false,
        },
      })
    }
  }

  // convex box
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      entities.push({
        id: ++ids,
        transform: {
          position: [
            -2.5 + i + 0.1 * i,
            12,
            -2.5 + j + 0.1 * j,
          ],
          rotation: [0, 0, 0, 1],
        },
        model: {
          type: 'box',
          size: [0.5, 1, 2],
        },
        body: {
          type: 'convex',
          dynamic: true,
        },
      })
    }
  }

  // primitive box
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      entities.push({
        id: ++ids,
        transform: {
          position: [
            -2.5 + i + 0.1 * i,
            Math.floor(Math.random() * 6) + 1,
            -2.5 + j + 0.1 * j,
          ],
          rotation: [0, 0, 0, 1],
        },
        model: {
          type: 'box',
          size: [1, 1, 1],
        },
        body: {
          type: 'box',
          size: [1, 1, 1],
          dynamic: true,
        },
      })
    }
  }

  // primitive shpere
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 1; j++) {
      entities.push({
        id: ++ids,
        transform: {
          position: [
            -2.5 + i + 0.1 * i,
            8,
            -2.5 + j + 0.1 * j,
          ],
          rotation: [0, 0, 0, 1],
        },
        model: {
          type: 'sphere',
          size: 0.5,
        },
        body: {
          type: 'sphere',
          size: 0.5,
          dynamic: true,
        },
      })
    }
  }

  return entities
}
