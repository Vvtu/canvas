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
    { x: 0, y: -2 },
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
    console.log("%c indexMin = ", "color: #bada55", indexMin); //TODO - delete vvtu
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

      context.strokeStyle = COLOR.base;
      context.lineWidth = 1;
      context.beginPath();

      const realPoints = points.map((p) => ({ point: toReal(p) }));
      console.log("%c realPoints = ", "color: #bada55", realPoints); //TODO - delete vvtu
      // context.moveTo(realPoints[0].point.x, realPoints[0].point.y);
      // context.arc(realPoints[0].point.x, realPoints[0].point.y, 3, 0, Math.PI * 2, true);
      // context.moveTo(realPoints[1].point.x, realPoints[1].point.y);
      // context.arc(realPoints[1].point.x, realPoints[1].point.y, 3, 0, Math.PI * 2, true);
      // context.moveTo(realPoints[2].point.x, realPoints[2].point.y);
      // context.arc(realPoints[2].point.x, realPoints[2].point.y, 3, 0, Math.PI * 2, true);

      // context.closePath();
      // context.stroke();
      // context.lineWidth = 1;
      // context.beginPath();

      let p1 = intersectionPoint(
        { p1: realPoints[0].point, p2: realPoints[1].point },
        { p1: { x: 0, y: 0 }, p2: { x: 0, y: canvas.height } }
      );
      let p2 = intersectionPoint(
        { p1: realPoints[0].point, p2: realPoints[1].point },
        {
          p1: { x: canvas.width, y: 0 },
          p2: { x: canvas.width, y: canvas.height },
        }
      );

      if (p1.x === undefined || p2.x === undefined) {
        // прямая расположена вертикально
        p1 = { x: realPoints[0].point.x, y: 0 };
        p2 = { x: realPoints[0].point.x, y: canvas.height };
      }

      context.moveTo(p1.x, p1.y);
      context.lineTo(p2.x, p2.y);

      context.closePath();
      context.stroke();

      context.lineWidth = 3;
      context.strokeStyle = COLOR.line1;
      context.beginPath();

      context.moveTo(realPoints[0].point.x, realPoints[0].point.y);
      context.lineTo(realPoints[1].point.x, realPoints[1].point.y);

      context.closePath();
      context.stroke();
      context.font = "30px serif";

      context.fillStyle = COLOR.line1;
      context.fillText(
        "A",
        realPoints[0].point.x + 15,
        realPoints[0].point.y - 5
      );
      // }
      // drawLine(point1, point2, COLOR.base);
      // drawLine(point2, point3, COLOR.base);
      // drawLine(point3, point1, COLOR.base);

      // const intersec = intersectionPoint(
      //   { p1: point1, p2: point2 },
      //   { p1: point3, p2: point4 }
      // );

      // setTwoLineIntersection(intersec);
      // if (intersec.x !== undefined) {
      //   const inter = toReal(intersec);

      //   context.strokeStyle = "grey";
      //   context.lineWidth = 3;
      //   context.beginPath();
      //   context.moveTo(inter.x, inter.y);
      //   context.arc(inter.x, inter.y, 3, 0, Math.PI * 2, true);
      //   context.fillStyle = "black";
      //   context.fillText(
      //     `(${fixedValue(intersec.x)} ; ${fixedValue(intersec.y)} )`,
      //     inter.x + 15,
      //     inter.y - 5
      //   );
      //   context.closePath();
      //   context.stroke();
      // }
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
