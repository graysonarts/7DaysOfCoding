const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const math = require("canvas-sketch-util/math");
const vec2 = require("./vec2");
const draw = require("./draw");
const initialize = require("./initialize");

const LINE_THRESHOLD = 2;
const MAX_POINTS = 5000;
const RELAX_SCALE = 1;
const FPS = 15.0;
const NEW_EVERY = Math.floor(FPS / 8.0);

let { nodes, links } = initialize();
let placedPointCount = 0;
random.setSeed(random.getRandomSeed());

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  fps: FPS,
};

const isLinkConnectedToNode = (node) => (link) =>
  link[0] === node || link[1] === node;

const relaxLinks = (n, l, context, mapToScreen) => {
  const newNodes = n.map((pt, node) => {
    // Do not move initial nodes
    if (pt.length > 2 && pt[2]) {
      return pt;
    }

    const connectedNodes = l
      .filter(isLinkConnectedToNode(node))
      .map((lnk) => (lnk[0] === node ? lnk[1] : lnk[0]));
    const newNodeOffset = connectedNodes
      .map((rtIdx) => n[rtIdx])
      .filter((rt) => Math.abs(vec2.mag(pt, rt)) > LINE_THRESHOLD)
      .map((rt) => {
        if (context) {
          context.fillStyle = "purple";
          draw.dot(context, mapToScreen(rt));
        }
        return rt;
      })
      .map((rt) => vec2.vectorTo(rt, pt))
      .map(vec2.normalize)
      .reduce(
        (acc, val) => {
          return vec2.add(acc, val);
        },
        [0, 0]
      );
    return vec2.add(pt, vec2.scale(RELAX_SCALE, newNodeOffset));
  });

  nodes = newNodes;
};

const adjacentTo = (l, r) =>
  l[0] === r[0] || l[1] === r[0] || l[0] === r[1] || l[1] === r[1];

const findAdjacentInterections = (intersections) => {
  // TODO: Need to make this into a flat list interections that are adjacent
  const retVal = new Set();
  intersections.forEach((i1) => {
    intersections
      .filter((i2) => i1[2] !== i2[2])
      .filter((i2) => adjacentTo(i1[2], i2[2]))
      .forEach((i2) => retVal.add([i1, i2]));
  });

  return [...retVal.values()];
};

const addIntersection = (pt, link) => {
  links = links.filter((lnk) => lnk !== link);
  const nodeIdx = nodes.push(pt) - 1;
  links.push([link[0], nodeIdx]);
  links.push([link[1], nodeIdx]);

  return nodeIdx;
};

const addPoints = (n, l) => {
  const candidate = [
    [random.gaussian(), random.gaussian()],
    [random.gaussian(), random.gaussian()],
  ];
  // const candidate = vec2.extend(
  //   [
  //     [random.gaussian(), random.gaussian()],
  //     [random.gaussian(), random.gaussian()],
  //   ],
  //   [
  //     [-2, -2],
  //     [2, 2],
  //   ]
  // );
  const intersections = [];
  for (const link of l) {
    const line = [n[link[0]], n[link[1]]];
    const i = vec2.intersection(candidate, line);
    if (i && i.intersect) {
      const pt = vec2.lerp(candidate[0], candidate[1], i.p);
      intersections.push([pt, line, link]);
    }
  }

  if (intersections.length < 2) {
    return { addedLink: undefined, candidate };
  }

  const adjacents = findAdjacentInterections(intersections);
  const picked = random.pick(adjacents);
  if (!picked) {
    return { addedLink: undefined, candidate };
  }

  const [p1, l1, lk1] = picked[0];
  const [p2, l2, lk2] = picked[1];
  const nodeIdx1 = addIntersection(p1, lk1);
  const nodeIdx2 = addIntersection(p2, lk2);
  links.push([nodeIdx1, nodeIdx2]);

  return { addedLink: [lk1, lk2], candidate };
};

const sketch = () => {
  let addedPoints = undefined;
  let hasSetHandler = false;
  return ({ context, width, height, frame, pause }) => {
    let prevNode = 0;

    const mapToScreen = (p) => [
      math.mapRange(p[0], -2, 2, 0, width, true),
      math.mapRange(p[1], -2, 2, 0, height, true),
    ];
    const mapToDomain = (p) => [
      math.mapRange(p[0], 0, context.canvas.clientWidth, -2, 2, true),
      math.mapRange(p[1], 0, context.canvas.clientHeight, -2, 2, true),
    ];

    if (!hasSetHandler) {
      context.canvas.addEventListener("mouseup", (evt) => {
        const newNode =
          nodes.push([
            ...mapToDomain([evt.offsetX, evt.offsetY]),
            placedPointCount < 4,
          ]) - 1;
        links.push([prevNode, newNode]);
        prevNode = newNode;
        placedPointCount = true;
      });
      hasSetHandler = true;
    }

    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    if (Math.floor(frame) % NEW_EVERY === 0)
      addedPoints = addPoints(nodes, links);

    // nodes.forEach((n, idx) => {
    //   context.fillStyle = n.length > 2 ? (n[2] ? "red" : "green") : "black";
    //   context.font = "24pt san-serif";
    //   const pt = mapToScreen(n);
    //   context.fillText(`${idx}`, pt[0], pt[1]);
    // });
    context.strokeStyle = "black";
    context.lineWidth = 5;
    links.forEach((l) => {
      draw.line(context, mapToScreen(nodes[l[0]]), mapToScreen(nodes[l[1]]));
    });

    // if (addedPoints) {
    //   if (addedPoints.candidate && addedPoints.candidate.length >= 2) {
    //     context.strokeStyle = "pink";
    //     draw.line(
    //       context,
    //       mapToScreen(addedPoints.candidate[0]),
    //       mapToScreen(addedPoints.candidate[1])
    //     );
    //   }
    //   // if (addedPoints.addedLink) {
    //   //   console.log(nodes, links);
    //   //   pause();
    //   // }
    // }

    // if (addedPoints) {
    //   context.strokeStyle = "orange";
    //   context.fillStyle = "orange";
    //   context.lineWidth = 5;

    //   addedPoints.forEach((l) => {
    //     draw.line(context, mapToScreen(nodes[l[0]]), mapToScreen(nodes[l[1]]));
    //   });
    // }

    relaxLinks(nodes, links);
  };
};

canvasSketch(sketch, settings);
