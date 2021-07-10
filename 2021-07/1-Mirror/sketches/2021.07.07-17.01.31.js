const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const math = require("canvas-sketch-util/math");
const vec2 = require("./vec2");
const draw = require("./draw");

const LINE_THRESHOLD = 0.75;
const MAX_POINTS = 1000;
const RELAX_SCALE = 0.001;
const FPS = 30.0;
const NEW_EVERY = Math.floor(FPS / 8.0);

let nodes = [];
let links = [];
random.setSeed(random.getRandomSeed());

const settings = {
  dimensions: [2048, 2048],
  animate: true,
  fps: FPS,
};

// aa, and bb are in the form of [[x1, y1], [x2, y2]]
// implementation adapted from https://github.com/inconvergent/inconvergent-sandbox/blob/master/www/js/utils.js#L80
const intersection = (aa, bb) => {
  const a0 = aa[0];
  const a1 = aa[1];
  const b0 = bb[0];
  const b1 = bb[1];

  const sa = vec2.sub(a1, a0);
  const sb = vec2.sub(b1, b0);
  const u = vec2.cross(sa, sb);

  if (Math.abs(u) <= 0) {
    return undefined;
  }

  const ba = vec2.sub(a0, b0);
  const q = vec2.cross(sa, ba) / u;
  const p = vec2.cross(sb, ba) / u;

  return {
    intersect: p >= 0 && p <= 1 && q >= 0 && q <= 1,
    p,
    q,
  };
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
  l[0] === r[0] || l[1] === r[0] || l[0] === r[1] || l[1] || r[1];

const findNeighboringIntersection = (intersections, link) => {
  let candidate = random.pick(
    intersections.filter((i) => adjacentTo(i[2], link))
  );
  if (candidate[2] === link) return undefined;
  return candidate;
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
  const intersections = [];
  for (const link of l) {
    const line = [n[link[0]], n[link[1]]];
    const i = intersection(candidate, line);
    if (i && i.intersect) {
      const pt = vec2.lerp(candidate[0], candidate[1], i.p);
      intersections.push([pt, line, link]);
    }
  }

  if (intersections.length < 2) {
    return undefined;
  }

  const [pt, line, link] = random.pick(intersections);
  const node1Idx = addIntersection(pt, link);
  const value = findNeighboringIntersection(intersections, link);
  if (!value) return undefined;
  const [pt2, line2, link2] = value;
  const node2Idx = addIntersection(pt2, link2);
  links.push([node1Idx, node2Idx]);
  return [link, link2];
};

const sketch = () => {
  let addedPoints = undefined;
  nodes = [[random.gaussian(), random.gaussian(), true]];

  links = [];
  // const visitedNodes = new Set();
  // let dest = Math.floor(random.value() * nodes.length);
  // let previous = dest;
  // visitedNodes.add(dest);
  // while (visitedNodes.size < nodes.length) {
  //   while (visitedNodes.has(dest) && visitedNodes.size < nodes.length) {
  //     dest = Math.floor(Math.abs(random.value() * nodes.length));
  //   }
  //   visitedNodes.add(dest);
  //   if (previous !== dest) {
  //     links.push([previous, dest]);
  //     previous = dest;
  //   }
  // }
  let hasSetHandler = false;
  return ({ context, width, height, frame }) => {
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
          nodes.push([...mapToDomain([evt.offsetX, evt.offsetY]), true]) - 1;
        links.push([prevNode, newNode]);
        prevNode = newNode;
      });
      hasSetHandler = true;
    }

    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    if (nodes.length < MAX_POINTS && frame % NEW_EVERY === 0)
      addedPoints = addPoints(nodes, links);

    // nodes.forEach((n) => {
    //   context.fillStyle = n.length > 2 ? (n[2] ? "red" : "green") : "black";
    //   const pt = mapToScreen(n);
    //   draw.dot(context, pt);
    // });
    context.strokeStyle = "black";
    context.lineWidth = 5;
    links.forEach((l) => {
      draw.line(context, mapToScreen(nodes[l[0]]), mapToScreen(nodes[l[1]]));
    });

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
