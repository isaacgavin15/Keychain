const TOTE_PATH = `M 120 120 H 780 A 40 40 0 0 1 820 160 V 540 A 40 40 0 0 1 780 580 H 120 A 40 40 0 0 1 80 540 V 160 A 40 40 0 0 1 120 120 Z`;

const BACKPACK_PATH = `M 180 140 H 720 A 30 30 0 0 1 750 170 V 520 A 35 35 0 0 1 715 555 H 185 A 35 35 0 0 1 150 520 V 170 A 30 30 0 0 1 180 140 Z M 200 160 V 530 H 700 V 160 Z`;

const CROSSBODY_PATH = `M 160 180 Q 160 140 200 130 H 700 Q 740 140 740 180 V 500 Q 740 540 700 550 H 200 Q 160 540 160 500 Z`;

class BagModel {
  constructor(config) {
    this.name = config.name;
    this.path = config.path;
    this.points = config.points || [];
  }

  render() {
    return `<path class="bag-body" d="${this.path}" filter="url(#shadow)" />`;
  }

  hitTest(point) {
    const x = point.x;
    const y = point.y;
    
    if (this.points.length === 0) {
      return false;
    }

    let inside = false;
    for (let i = 0, j = this.points.length - 1; i < this.points.length; j = i++) {
      const xi = this.points[i].x;
      const yi = this.points[i].y;
      const xj = this.points[j].x;
      const yj = this.points[j].y;

      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }
}

function parseSvgPathToPoints(pathString) {
  const points = [];
  const commands = pathString.match(/[MLHVQC]/gi) || [];
  const nums = pathString.match(/-?\d+\.?\d*/g) || [];
  
  let x = 0, y = 0;
  let idx = 0;
  
  for (let i = 0; i < commands.length && idx < nums.length; i++) {
    const cmd = commands[i].toUpperCase();
    switch (cmd) {
      case 'M':
      case 'L':
        x = parseFloat(nums[idx++]);
        y = parseFloat(nums[idx++]);
        points.push({ x, y });
        break;
      case 'H':
        x = parseFloat(nums[idx++]);
        points.push({ x, y });
        break;
      case 'V':
        y = parseFloat(nums[idx++]);
        points.push({ x, y });
        break;
      case 'Q':
        x = parseFloat(nums[idx++]);
        y = parseFloat(nums[idx++]);
        const cx = parseFloat(nums[idx++]);
        const cy = parseFloat(nums[idx++]);
        points.push({ x, y });
        break;
      case 'C':
        x = parseFloat(nums[idx++]);
        y = parseFloat(nums[idx++]);
        const c1x = parseFloat(nums[idx++]);
        const c1y = parseFloat(nums[idx++]);
        points.push({ x, y });
        break;
      case 'A':
        x = parseFloat(nums[idx++]);
        y = parseFloat(nums[idx++]);
        points.push({ x, y });
        break;
    }
  }
  
  return points;
}

export const bagModels = {
  tote: new BagModel({
    name: "Tote bag",
    path: TOTE_PATH,
    points: [
      { x: 120, y: 120 },
      { x: 780, y: 120 },
      { x: 820, y: 160 },
      { x: 820, y: 540 },
      { x: 780, y: 580 },
      { x: 120, y: 580 },
      { x: 80, y: 540 },
      { x: 80, y: 160 },
    ],
  }),
  backpack: new BagModel({
    name: "Backpack",
    path: BACKPACK_PATH,
    points: [
      { x: 180, y: 140 },
      { x: 720, y: 140 },
      { x: 750, y: 170 },
      { x: 750, y: 520 },
      { x: 715, y: 555 },
      { x: 185, y: 555 },
      { x: 150, y: 520 },
      { x: 150, y: 170 },
    ],
  }),
  crossbody: new BagModel({
    name: "Crossbody",
    path: CROSSBODY_PATH,
    points: [
      { x: 160, y: 180 },
      { x: 200, y: 130 },
      { x: 700, y: 130 },
      { x: 740, y: 180 },
      { x: 740, y: 500 },
      { x: 700, y: 550 },
      { x: 200, y: 550 },
      { x: 160, y: 500 },
    ],
  }),
};