import { useCallback, useEffect, useRef, useState } from "react";

import {
  COLOR,
  ICoordinate,
  distance,
  fixedValue,
  roundPointValue,
  intersectionPoint,
} from "../utils";
interface CanvasProps {
  width: number;
  height: number;
}

const SCALE = 60;

const Canvas = ({ width, height }: CanvasProps) => {
  const canvasRef = useRef();
  const canvasRefBase = useRef();
  const timeoutId = useRef();

  const [isPainting, setIsPainting] = useState(false);

  const [point1, setPoint1] = useState({ x: -2, y: -2 });
  const [point2, setPoint2] = useState({ x: 2, y: 2 });

  const toReal = useCallback(
    ({ x, y }: ICoordinate) => ({
      x: x * SCALE + width / 2,
      y: -y * SCALE + height / 2,
    }),
    [height, width]
  );
  const fromReal = useCallback(
    ({ x, y }: ICoordinate) => ({
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
  ): ICoordinate | undefined => {
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
    if (d1 < d2 && d1 < 1.0) {
      setPoint1(coordinate);
    } else {
      if (d2 < d1 && d2 < 1.0) {
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
    canvas.addEventListener("touchstart", mouseDown);
    canvas.addEventListener("touchend", mouseUp);
    canvas.addEventListener("touchmove", updateLineWithNewCoordinates);

    return () => {
      canvas.removeEventListener("mousedown", mouseDown);
      canvas.removeEventListener("mousemove", updateLineWithNewCoordinates);
      canvas.removeEventListener("mouseup", mouseUp);
      canvas.removeEventListener("touchstart", mouseDown);
      canvas.removeEventListener("touchend", mouseUp);
      canvas.removeEventListener("touchmove", updateLineWithNewCoordinates);
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
        Math.max(canvasBase.height, canvasBase.width) / SCALE / 2
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
      // x
      const from = toReal({ x: -lines, y: 0 });
      const to = toReal({ x: lines, y: 0 });
      contextBase.moveTo(from.x, from.y);
      contextBase.lineTo(to.x, to.y);
      // arrow x
      contextBase.moveTo(canvasBase.width - 15, to.y - 3);
      contextBase.lineTo(canvasBase.width - 2, to.y);
      contextBase.moveTo(canvasBase.width - 15, to.y + 3);
      contextBase.lineTo(canvasBase.width - 2, to.y);
      // y
      const from2 = toReal({ x: 0, y: -lines });
      const to2 = toReal({ x: 0, y: lines });
      contextBase.moveTo(from2.x, from2.y);
      contextBase.lineTo(to2.x, to2.y);
      // arrow y
      contextBase.moveTo(to2.x - 3, 15);
      contextBase.lineTo(to2.x, 2);
      contextBase.moveTo(to2.x + 3, 15);
      contextBase.lineTo(to2.x, 2);
      //
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

      let p1 = intersectionPoint(
        { p1: from, p2: to },
        { p1: { x: 0, y: 0 }, p2: { x: 0, y: canvas.height } }
      );
      let p2 = intersectionPoint(
        { p1: from, p2: to },
        {
          p1: { x: canvas.width, y: 0 },
          p2: { x: canvas.width, y: canvas.height },
        }
      );

      if (p1.x === undefined || p2.x === undefined) {
        // прямая расположена вертикально
        p1 = { x: from.x, y: 0 };
        p2 = { x: from.x, y: canvas.height };
      }

      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);

      context.closePath();
      context.stroke();

      context.font = "30px serif";

      context.fillStyle = "red";
      context.fillText(
        `(${fixedValue(point1.x)}, ${fixedValue(point1.y)} )`,
        from.x + 15,
        from.y - 5
      );
      context.fillText(
        `(${fixedValue(point2.x)}, ${fixedValue(point2.y)} )`,
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
      message = `y = ${fixedValue(k)} * x${
        b === 0 ? "" : ` ${b > 0 ? "+" : ""} ${fixedValue(b)}`
      }`;
    }
  }

  return (
    <>
      <div className="message">{message}</div>
      <div className="fullScreen">
        <canvas ref={canvasRefBase} height={height} width={width} />
      </div>
      <div className="fullScreen">
        <canvas ref={canvasRef} height={height} width={width} />
      </div>
    </>
  );
};

export default Canvas;
