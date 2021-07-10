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
};
