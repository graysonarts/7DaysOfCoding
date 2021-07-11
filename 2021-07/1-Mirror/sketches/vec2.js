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

  if (topInt >= box[0][1] && topInt <= box[1][1]) {
    pt.push([box[0][1], topInt]);
  }

  if (rightInt >= box[0][0] && rightInt <= box[1][0]) {
    pt.push([box[1][0], rightInt]);
  }

  if (bottomInt >= box[0][1] && bottomInt <= box[1][1]) {
    pt.push([box[1][1], bottomInt]);
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
};
