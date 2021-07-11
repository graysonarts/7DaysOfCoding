const static = () => {
  return {
    nodes: [
      [-0.5, 1], // 0
      [-0.5, 0.5], // 1
      [0.3, 0.3], // 2
      [0.5, -0.5], // 3
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
      [2, 6],
      [0, 7],
      [4, 6],
      [6, 5],
      [5, 7],
      [7, 4],
    ],
  };
};

module.exports = () => {
  return static();
};