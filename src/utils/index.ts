export const COLOR = {
  line: "red",
  base: "#ddd",
  ordinates: "#000",
};

export type ICoordinate = {
  x: number;
  y: number;
};

export const distance = (a: ICoordinate, b: ICoordinate) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

export const fixedValue = (x: number) =>
  Number.isInteger(x) ? x.toFixed(0) : x.toFixed(2);

export const roundPointValue = (point: ICoordinate) => {
  const p1 = { ...point };
  const a = Math.round(p1.x);
  let isChanged = false;
  if (Math.abs(a - p1.x) < 0.1) {
    p1.x = a;
    isChanged = true;
  }
  const b = Math.round(p1.y);
  if (Math.abs(b - p1.y) < 0.2) {
    p1.y = b;
    isChanged = true;
  }
  if (isChanged) {
    return p1;
  }
  return point;
};

export type ILine = {
  p1: ICoordinate;
  p2: ICoordinate;
};

export function intersectionPoint(line1: ILine, line2: ILine) {
  let dx1 = line1.p2.x - line1.p1.x;
  let dx2 = line2.p2.x - line2.p1.x;
  let dy1 = line1.p2.y - line1.p1.y;
  let dy2 = line2.p2.y - line2.p1.y;

  let a1 = dy1;
  let b1 = -dx1;
  let c1 = line1.p1.y * dx1 - line1.p1.x * dy1;

  let a2 = dy2;
  let b2 = -dx2;
  let c2 = line2.p1.y * dx2 - line2.p1.x * dy2;

  let e;
  for (let i = 0; i < 2; i += 1) {
    if (a1 !== 0) {
      let bb1 = (b1 * a2) / a1;
      let cc1 = (c1 * a2) / a1;
      let bb2 = b2 - bb1;
      if (bb2 !== 0) {
        let cc2 = c2 - cc1;
        let y = -cc2 / bb2;
        let x = (-c1 - b1 * y) / a1;
        const result = i === 0 ? { x, y } : { x: y, y: x };
        return result;
      }
    }
    e = a1;
    a1 = b1;
    b1 = e;
    e = a2;
    a2 = b2;
    b2 = e;
  }
  // --- ПРЯМЫЕ ПАРАЛЕЛЬНЫ ---
  return {};
}
