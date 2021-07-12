const random = require("canvas-sketch-util/random");

const static_initialize = () => {
  return {
    nodes: [
      [0, random.value()], // 0
      [-random.value(), 0], // 1
      [0, -random.value()], // 2
      [random.value(), 0], // 3
      [-2, -2, true], // 4
      [2, 2, true], // 5
      [-2, 2, true], // 6
      [2, -2, true], // 7
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [1, 4],
      [3, 5],
      [2, 7],
      [0, 6],
      [4, 6],
      [6, 5],
      [5, 7],
      [7, 4],
    ],
  };
};

module.exports = () => {
  return static_initialize();
};
