module.exports = {
  line: (context, p1, p2) => {
    context.beginPath();
    context.moveTo(p1[0], p1[1]);
    context.lineTo(p2[0], p2[1]);
    context.stroke();
  },
  dot: (context, pt) => {
    context.beginPath();
    context.ellipse(pt[0], pt[1], 10, 10, 0, 0, Math.PI * 2);
    context.fill();
  },
};
