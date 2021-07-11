const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const math = require("canvas-sketch-util/math");
const vec2 = require("./vec2");
const draw = require("./draw");

const LINE_THRESHOLD = 0.75;
const MAX_POINTS = 1000;
const RELAX_SCALE = 0.00025;
const FPS = 30.0;
const NEW_EVERY = Math.floor(FPS / 2.0);
const MAX_MODE = 2;

let nodes = [];
let links = [];
random.setSeed(random.getRandomSeed());

const settings = {
  dimensions: [2048, 2048],
  animate: false,
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

const adjacentTo = (l, r) => {
  console.log(l[0], r[0], l[1], r[1]);
  return l[0] === r[0] || l[1] === r[0] || l[0] === r[1] || l[1] === r[1];
};

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

const findIntersections = (n, l, candidate) => {
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

  return intersections;
};

const addPoints = (n, l) => {
  const candidate = [
    [random.gaussian(), random.gaussian()],
    [random.gaussian(), random.gaussian()],
  ];
  intersections = findIntersections(n, l, candidate);

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
  let selectedNode = 0;
  let mode = 0;
  const { nodes, links, candidateLine } = {
    nodes: [
      [-1.2030155887743323, -0.3708818619689974, true],
      [0.1323106423777567, -1.3595397890699905, true],
      [1.2023010546500479, -1.0373921380632791, true],
      [1.2943432406519655, 0.41227229146692235, true],
      [1.0757430488974111, 1.1255992329817834, true],
      [0.10162991371045083, 1.3173537871524448, true],
      [-0.8034515819750718, 1.1102588686481303, true],
      [-1.1831255992329819, 0.6040268456375837, true],
      [-1.351869606903164, 0.18600191754554185, true],
      [-0.772770853307766, -0.3547459252157239, true],
      [0.3700862895493766, -0.6001917545541706, true],
      [0.8916586768935764, 0.0057526366251199335, true],
      [0.6615532118887826, 0.6653883029721954, true],
      [0.05944391179290509, 0.30105465004793874, true],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
      [11, 12],
      [12, 13],
    ],
    candidateLine: [
      [-1.3480345158197506, 0.8954937679769897],
      [1.6011505273250242, 0.05177372962607851],
    ],
  };
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
        switch (mode) {
          case 0:
            const newNode =
              nodes.push([...mapToDomain([evt.offsetX, evt.offsetY]), true]) -
              1;
            links.push([prevNode, newNode]);
            prevNode = newNode;
            break;
          case 1:
            const node = [...mapToDomain([evt.offsetX, evt.offsetY])];
            candidateLine.push(node);
            if (candidateLine.length > 2) {
              candidateLine.splice(0, 1);
            }
        }
      });

      window.addEventListener("keyup", (evt) => {
        switch (evt.key) {
          case "Enter":
            mode = (mode + 1) % MAX_MODE;
            console.log(`mode ${mode}`);
            break;
          case " ":
            console.log(
              JSON.stringify({
                nodes,
                links,
                candidateLine,
              })
            );
          default:
            console.log(`press ${evt.key}`);
            break;
        }
      });
      hasSetHandler = true;
    }

    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    // if (nodes.length < MAX_POINTS && frame % NEW_EVERY === 0)
    //   addedPoints = addPoints(nodes, links);

    switch (mode) {
      case 0:
        nodes.forEach((n, idx) => {
          context.fillStyle =
            idx === selectedNode
              ? "purple"
              : n.length > 2
              ? n[2]
                ? "red"
                : "green"
              : "black";
          const pt = mapToScreen(n);
          draw.dot(context, pt);
        });
        break;
    }
    context.strokeStyle = "black";
    context.lineWidth = 5;
    links.forEach((l) => {
      draw.line(context, mapToScreen(nodes[l[0]]), mapToScreen(nodes[l[1]]));
    });
    context.strokeStyle = "purple";
    context.fillStyle = "purple";
    if (candidateLine.length !== 0) {
      candidateLine.forEach((n) => {
        draw.dot(context, mapToScreen(n));
      });
    }
    if (candidateLine.length >= 2) {
      const possibleInts = findIntersections(nodes, links, candidateLine);
      const [selectedPt, selectedLine, selectedLink] =
        random.pick(possibleInts);
      const ints = possibleInts.filter((x) => adjacentTo(selectedLink, x[2]));
      draw.line(
        context,
        mapToScreen(candidateLine[0]),
        mapToScreen(candidateLine[1])
      );
      if (ints) {
        ints.forEach(([pt, line, link]) => {
          context.fillStyle = "orange";
          draw.dot(context, mapToScreen(pt));

          context.strokeStyle = "pink";
          draw.line(
            context,
            mapToScreen(nodes[link[0]]),
            mapToScreen(nodes[link[1]])
          );
        });
      }
    }

    // if (addedPoints) {
    //   context.strokeStyle = "orange";
    //   context.fillStyle = "orange";
    //   context.lineWidth = 5;

    //   addedPoints.forEach((l) => {
    //     draw.line(context, mapToScreen(nodes[l[0]]), mapToScreen(nodes[l[1]]));
    //   });
    // }

    // relaxLinks(nodes, links);
  };
};

canvasSketch(sketch, settings);
