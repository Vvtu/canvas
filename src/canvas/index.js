import React, { useCallback, useEffect, useRef, useState } from "react";

const COLOR = {
  line: "red",
  base: "#ddd",
  ordinates: "#000",
};
interface CanvasProps {
  width: number;
  height: number;
}

type Coordinate = {
  x: number,
  y: number,
};

const distance = (a: Coordinate, b: Coordinate) =>
  Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const roundPointValue = (point: Coordinate) => {
  const p1 = { ...point };
  const a = Math.round(p1.x);
  let isChanged = false;
  if (Math.abs(a - p1.x) < 0.1) {
    p1.x = a;
    isChanged = true;
  }
  const b = Math.round(p1.y);
  if (Math.abs(b - p1.y) < 0.1) {
    p1.y = b;
    isChanged = true;
  }
  if (isChanged) {
    return p1;
  }
  return point;
};

const SCALE = 60;

const Canvas = ({ width, height }: CanvasProps) => {
  const canvasRef = useRef();
  const canvasRefBase = useRef();

  const timeoutId = useRef();

  const [isPainting, setIsPainting] = useState(false);

  const [point1, setPoint1] = useState({ x: -2, y: -2 });
  const [point2, setPoint2] = useState({ x: 2, y: 2 });

  const toReal = useCallback(
    ({ x, y }: Coordinate) => ({
      x: x * SCALE + width / 2,
      y: -y * SCALE + height / 2,
    }),
    [height, width]
  );
  const fromReal = useCallback(
    ({ x, y }: Coordinate) => ({
      x: (x - width / 2) / SCALE,
      y: -(y - height / 2) / SCALE,
    }),
    [height, width]
  );

  useEffect(() => {
    return () => {
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  const updateLineWithNewCoordinates = (
    event: MouseEvent
  ): Coordinate | undefined => {
    if (!canvasRef.current) {
      return;
    }
    if (isPainting === false) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;

    const coordinate = fromReal({
      x: event.pageX - canvas.offsetLeft,
      y: event.pageY - canvas.offsetTop,
    });
    const d1 = distance(coordinate, point1);
    const d2 = distance(coordinate, point2);
    if (d1 < d2 && d1 < 1) {
      setPoint1(coordinate);
    } else {
      if (d2 < d1 && d2 < 1) {
        setPoint2(coordinate);
      }
    }
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    timeoutId.current = setTimeout(() => {
      setPoint1(roundPointValue(point1));
      setPoint2(roundPointValue(point2));
    }, 300);
  };

  const mouseUp = () => setIsPainting(false);
  const mouseDown = () => setIsPainting(true);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousedown", mouseDown);
    canvas.addEventListener("mousemove", updateLineWithNewCoordinates);
    canvas.addEventListener("mouseup", mouseUp);
    // canvas.addEventListener("mouseleave", mouseDown);
    return () => {
      canvas.removeEventListener("mousedown", mouseDown);
      canvas.removeEventListener("mousemove", updateLineWithNewCoordinates);
      canvas.removeEventListener("mouseup", mouseUp);
      // canvas.removeEventListener("mouseleave", mouseDown);
    };
  });

  useEffect(() => {
    if (!canvasRefBase.current) {
      return;
    }
    const canvasBase: HTMLCanvasElement = canvasRefBase.current;
    const contextBase = canvasBase.getContext("2d");
    if (contextBase) {
      contextBase.strokeStyle = COLOR.base;
      contextBase.lineWidth = 1;

      contextBase.beginPath();

      const lines = Math.round(
        Math.max(canvasBase.height, canvasBase.width) / SCALE
      );

      for (let x = -lines; x < lines; x += 1) {
        const from = toReal({ x, y: 0 });
        const to = toReal({ x, y: 0 });
        contextBase.moveTo(from.x, 0);
        contextBase.lineTo(to.x, canvasBase.height);
      }
      for (let y = -lines; y < lines; y += 1) {
        const from = toReal({ x: 0, y });
        const to = toReal({ x: 0, y });
        contextBase.moveTo(0, from.y);
        contextBase.lineTo(canvasBase.width, to.y);
      }
      contextBase.closePath();
      contextBase.stroke();

      contextBase.strokeStyle = COLOR.ordinates;
      contextBase.lineWidth = 1;
      contextBase.beginPath();
      const from = toReal({ x: -lines, y: 0 });
      const to = toReal({ x: lines, y: 0 });
      contextBase.moveTo(from.x, from.y);
      contextBase.lineTo(to.x, to.y);

      const from2 = toReal({ x: 0, y: -lines });
      const to2 = toReal({ x: 0, y: lines });
      contextBase.moveTo(from2.x, from2.y);
      contextBase.lineTo(to2.x, to2.y);
      contextBase.closePath();
      contextBase.stroke();
    }
  }, [toReal]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = COLOR.line;
      context.lineWidth = 3;
      context.beginPath();

      const from = toReal(point1);
      const to = toReal(point2);
      context.moveTo(from.x, from.y);
      context.arc(from.x, from.y, 3, 0, Math.PI * 2, true);
      context.moveTo(to.x, to.y);
      context.arc(to.x, to.y, 3, 0, Math.PI * 2, true);

      context.moveTo(from.x, from.y);
      context.lineTo(to.x, to.y);

      context.closePath();
      context.stroke();

      context.font = "1.5rem serif";

      context.fillStyle = "red";
      context.fillText(
        `(${point1.x.toFixed(2)}, ${point1.y.toFixed(2)} )`,
        from.x + 15,
        from.y - 5
      );
      context.fillText(
        `(${point2.x.toFixed(2)}, ${point2.y.toFixed(2)} )`,
        to.x + 15,
        to.y - 5
      );
    }
  }, [point1, point2, toReal]);

  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;

  let message;
  if (dx === 0 && dy === 0) {
    message = "точки совпадают";
  } else {
    if (dx === 0) {
      message = "k = ∞";
    } else {
      const k = dy / dx;
      const b = -point1.x * k + point1.y;
      message = `y = ${k.toFixed(2)} * x${
        b === 0 ? "" : ` ${b > 0 ? "+" : ""} ${b.toFixed(2)}`
      }`;
    }
  }

  return (
    <>
      <div style={{ marginLeft: "15rem", fontSize: "2rem" }}>{message}</div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: height,
          width: width,
        }}
      >
        <canvas ref={canvasRefBase} height={height} width={width} />
      </div>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: height,
          width: width,
        }}
      >
        <canvas ref={canvasRef} height={height} width={width} />
      </div>
    </>
  );
};

export default Canvas;
