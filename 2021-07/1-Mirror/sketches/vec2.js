const add = (v1, v2) => [v1[0] + v2[0], v1[1] + v2[1]];
const scale = (scalar, v) => [v[0] * scalar, v[1] * scalar];
const sub = (v1, v2) => [v1[0] - v2[0], v1[1] - v2[1]];
const cross = (v1, v2) => v1[0] * v2[1] - v2[0] * v1[1];
const lerp = (v1, v2, percentage) => {
  return add(v1, scale(percentage, sub(v2, v1)));
};
const distanceSq = (v1, v2) =>
  Math.pow(v2[0] - v1[0], 2) + Math.pow(v2[1] - v1[0], 2);
const mag = (v) => Math.sqrt(distanceSq([0, 0], v));

const vectorTo = (v1, v2) => sub(v1, v2);
const normalize = (v1) => {
  const m = mag(v1);
  return v1.map((u) => u / m);
};

// aa, and bb are in the form of [[x1, y1], [x2, y2]]
// implementation adapted from https://github.com/inconvergent/inconvergent-sandbox/blob/master/www/js/utils.js#L80
const intersection = (aa, bb) => {
  if (aa.length < 2 || bb.length < 2) {
    return undefined;
  }

  const a0 = aa[0];
  const a1 = aa[1];
  const b0 = bb[0];
  const b1 = bb[1];

  if (a1.length < 2 || a0.length < 2 || b1.length < 2 || b0.length < 2) {
    return undefined;
  }

  const sa = sub(a1, a0);
  const sb = sub(b1, b0);
  const u = cross(sa, sb);

  if (Math.abs(u) <= 0) {
    return undefined;
  }

  const ba = sub(a0, b0);
  const q = cross(sa, ba) / u;
  const p = cross(sb, ba) / u;

  return {
    intersect: p >= 0 && p <= 1 && q >= 0 && q <= 1,
    p,
    q,
  };
};

const extend = (v, box) => {
  const slope = (v[1][1] - v[0][1]) / (v[1][0] - v[0][0]);
  const intercept = v[1][1] - slope * v[1][0];

  const leftInt = slope * box[0][0] + intercept;
  const rightInt = slope * box[1][0] + intercept;
  const topInt = (box[0][1] - intercept) / slope;
  const bottomInt = (box[1][1] - intercept) / slope;

  const pt = [];
  if (leftInt >= box[0][0] && leftInt <= box[1][0]) {
    pt.push([box[0][0], leftInt]);
  }

  if (bottomInt >= box[0][1] && bottomInt <= box[1][1]) {
    pt.push([box[1][1], bottomInt]);
  }
  if (topInt >= box[0][1] && topInt <= box[1][1]) {
    pt.push([box[0][1], topInt]);
  }

  if (rightInt >= box[0][0] && rightInt <= box[1][0]) {
    pt.push([box[1][0], rightInt]);
  }

  return pt;
};
module.exports = {
  sub,
  cross,
  lerp,
  add,
  scale,
  distanceSq,
  vectorTo,
  normalize,
  mag,
  extend,
  intersection,
};
