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
  Number.isInteger(x) ? x.toFixed(1) : x.toFixed(2);

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
