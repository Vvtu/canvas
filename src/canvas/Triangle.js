import { useCallback, useEffect, useRef, useState } from "react";
import CoordinateGrid from "./CoordinateGrid";
import ScaleButtons from "./ScaleButtons";

import {
  COLOR,
  ICoordinate,
  distance,
  fixedValue,
  roundPointValue,
  intersectionPoint,
} from "../utils";

import { ICanvasProps } from "./types";

const REAL_POINTS_BASE = [
  { name: "A", prev: 2, next: 1 },
  { name: "B", prev: 0, next: 2 },
  { name: "C", prev: 1, next: 0 },
];

const calcMessage = (point1: ICoordinate, point2: ICoordinate) => {
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
  return message;
};

export default function Triangle(props: ICanvasProps) {
  const { width, height, scale } = props;

  const canvasRef = useRef();
  const timeoutId = useRef();

  const [isPainting, setIsPainting] = useState(false);

  const [points, setPoints] = useState([
    { x: -2, y: -2 },
    { x: 2, y: 2 },
    { x: 0, y: -3 },
  ]);

  const toReal = useCallback(
    ({ x, y }: ICoordinate) => ({
      x: x * scale + width / 2,
      y: -y * scale + height / 2,
    }),
    [height, width, scale]
  );
  const fromReal = useCallback(
    ({ x, y }: ICoordinate) => ({
      x: (x - width / 2) / scale,
      y: -(y - height / 2) / scale,
    }),
    [height, width, scale]
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
    let indexMin = 0;
    let distMin = Number.MAX_VALUE;

    points.forEach((point, index) => {
      const dist = distance(point, coordinate);
      if (distMin >= dist) {
        distMin = dist;
        indexMin = index;
      }
    });
    if (distMin < 1.0) {
      const newPoints = [...points];
      newPoints[indexMin] = coordinate;
      setPoints(newPoints);
    }

    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    timeoutId.current = setTimeout(() => {
      const newPoints = points.map((p) => roundPointValue(p));
      setPoints(newPoints);
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
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);

      const realPoints = points.map((p, index) => ({
        ...REAL_POINTS_BASE[index],
        point: toReal(p),
      }));

      realPoints.forEach((p) => {
        const pNext = realPoints[p.next].point;
        const pPrev = realPoints[p.prev].point;

        let p1 = intersectionPoint(
          { p1: p.point, p2: pNext },
          { p1: { x: 0, y: 0 }, p2: { x: 0, y: canvas.height } }
        );
        let p2 = intersectionPoint(
          { p1: p.point, p2: pNext },
          {
            p1: { x: canvas.width, y: 0 },
            p2: { x: canvas.width, y: canvas.height },
          }
        );

        if (p1.x === undefined || p2.x === undefined) {
          // прямая расположена вертикально
          p1 = { x: p.point.x, y: 0 };
          p2 = { x: p.point.x, y: canvas.height };
        }
        context.strokeStyle = COLOR.base;
        context.lineWidth = 1;
        context.beginPath();

        context.moveTo(p1.x, p1.y);
        context.lineTo(p2.x, p2.y);

        context.closePath();
        context.stroke();

        context.lineWidth = 3;
        context.strokeStyle = COLOR.line1;
        context.beginPath();

        context.moveTo(p.point.x, p.point.y);
        context.lineTo(pNext.x, pNext.y);

        context.closePath();
        context.stroke();
        // медиана
        const median = {
          x: (pPrev.x + pNext.x) / 2,
          y: (pPrev.y + pNext.y) / 2,
        };

        context.lineWidth = 1;
        context.strokeStyle = "blue";
        context.beginPath();

        context.moveTo(p.point.x, p.point.y);
        context.lineTo(median.x, median.y);

        context.closePath();
        context.stroke();

        // бисектрисса
        const atanBisectrissa1 = Math.atan2(
          pPrev.y - p.point.y,
          pPrev.x - p.point.x
        );
        const atanBisectrissa2 = Math.atan2(
          pNext.y - p.point.y,
          pNext.x - p.point.x
        );

        const atanBi = (atanBisectrissa1 + atanBisectrissa2) / 2;

        const b1 = intersectionPoint(
          { p1: pNext, p2: pPrev },
          {
            p1: p.point,
            p2: {
              x: p.point.x + Math.cos(atanBi),
              y: p.point.y + Math.sin(atanBi),
            },
          }
        );
        let letterCoorditate = {
          x: p.point.x - 30 * Math.cos(atanBi),
          y: p.point.y - 30 * Math.sin(atanBi),
        };

        const di = distance(p.point, b1);
        const diLetter = distance(letterCoorditate, b1);
        if (di > diLetter) {
          letterCoorditate = {
            x: p.point.x + 30 * Math.cos(atanBi),
            y: p.point.y + 30 * Math.sin(atanBi),
          };
        }

        context.font = "30px serif";
        context.fillStyle = COLOR.line1;
        context.fillText(
          p.name,
          letterCoorditate.x - 10,
          letterCoorditate.y + 7
        );

        context.lineWidth = 1;
        context.strokeStyle = "green";
        context.beginPath();
        context.moveTo(p.point.x, p.point.y);
        context.lineTo(b1.x, b1.y);
        context.closePath();
        context.stroke();
      });
    }
  }, [points, toReal]);

  return (
    <>
      <CoordinateGrid {...props} />
      <div className="fullScreen">
        <canvas ref={canvasRef} height={height} width={width} />
        <ScaleButtons {...props} />
      </div>
      {/* <div className="message">
        <div style={{ color: COLOR.line1 }}>{calcMessage(point1, point2)}</div>
      </div> */}
    </>
  );
}
