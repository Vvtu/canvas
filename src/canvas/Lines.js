import { useCallback, useEffect, useRef, useState, Profiler } from "react";
import CoordinateGrid from "./CoordinateGrid";

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

const Canvas = ({ width, height, scale }: ICanvasProps) => {
  const canvasRef = useRef();
  const timeoutId = useRef();

  const [isPainting, setIsPainting] = useState(false);

  const [point1, setPoint1] = useState({ x: -2, y: -2 });
  const [point2, setPoint2] = useState({ x: 2, y: 2 });

  const [point3, setPoint3] = useState({ x: 0, y: -2 });
  const [point4, setPoint4] = useState({ x: 4, y: 2 });
  const [twoLineIntersection, setTwoLineIntersection] = useState({});

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
    const dist = [
      distance(coordinate, point1),
      distance(coordinate, point2),
      distance(coordinate, point3),
      distance(coordinate, point4),
    ];

    dist.forEach((d, index) => {
      if (d < dist[indexMin]) {
        indexMin = index;
      }
    });

    if (dist[indexMin] < 1.0) {
      switch (indexMin) {
        case 0:
          setPoint1(coordinate);
          break;
        case 1:
          setPoint2(coordinate);
          break;
        case 2:
          setPoint3(coordinate);
          break;
        case 3:
          setPoint4(coordinate);
          break;
        default:
          break;
      }
    }

    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }

    timeoutId.current = setTimeout(() => {
      setPoint1(roundPointValue(point1));
      setPoint2(roundPointValue(point2));
      setPoint3(roundPointValue(point3));
      setPoint4(roundPointValue(point4));
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

      function drawLine(
        startPoint: ICoordinate,
        endPoint: ICoordinate,
        color: string
      ) {
        context.strokeStyle = color;
        context.lineWidth = 3;
        context.beginPath();

        const from = toReal(startPoint);
        const to = toReal(endPoint);

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

        context.fillStyle = color;
        context.fillText(
          `(${fixedValue(startPoint.x)} ; ${fixedValue(startPoint.y)} )`,
          from.x + 15,
          from.y - 5
        );
        context.fillText(
          `(${fixedValue(endPoint.x)} ; ${fixedValue(endPoint.y)} )`,
          to.x + 15,
          to.y - 5
        );
      }
      drawLine(point1, point2, COLOR.line1);
      drawLine(point3, point4, COLOR.line2);
      const intersec = intersectionPoint(
        { p1: point1, p2: point2 },
        { p1: point3, p2: point4 }
      );

      setTwoLineIntersection(intersec);
      if (intersec.x !== undefined) {
        const inter = toReal(intersec);

        context.strokeStyle = "grey";
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(inter.x, inter.y);
        context.arc(inter.x, inter.y, 3, 0, Math.PI * 2, true);
        context.fillStyle = "black";
        context.fillText(
          `(${fixedValue(intersec.x)} ; ${fixedValue(intersec.y)} )`,
          inter.x + 15,
          inter.y - 5
        );
        context.closePath();
        context.stroke();
      }
    }
  }, [point1, point2, point3, point4, toReal]);

  function onRenderCallback(
    id, // the "id" prop of the Profiler tree that has just committed
    phase, // either "mount" (if the tree just mounted) or "update" (if it re-rendered)
    actualDuration, // time spent rendering the committed update
    baseDuration, // estimated time to render the entire subtree without memoization
    startTime, // when React began rendering this update
    commitTime, // when React committed this update
    interactions // the Set of interactions belonging to this update
  ) {
    // Aggregate or log render timings...
    console.log("%conRenderCallback id = ", "color: #bada55", id); //TODO - delete vvtu
    console.log("%conRenderCallback phase = ", "color: #bada55", phase); //TODO - delete vvtu
    console.log(
      "%conRenderCallback actualDuration = ",
      "color: #bada55",
      actualDuration
    ); //TODO - delete vvtu
    console.log(
      "%conRenderCallback baseDuration = ",
      "color: #bada55",
      baseDuration
    ); //TODO - delete vvtu
    console.log("%conRenderCallback startTime = ", "color: #bada55", startTime); //TODO - delete vvtu
    console.log(
      "%conRenderCallback commitTime = ",
      "color: #bada55",
      commitTime
    ); //TODO - delete vvtu
    console.log(
      "%conRenderCallback interactions = ",
      "color: #bada55",
      interactions
    ); //TODO - delete vvtu
  }

  return (
    <Profiler id="Navigation" onRender={onRenderCallback}>
      <>
        <CoordinateGrid {...{ width, height, scale }} />
        <div className="fullScreen">
          <canvas ref={canvasRef} height={height} width={width} />
        </div>
        <div className="message">
          <div style={{ color: COLOR.line1 }}>
            {calcMessage(point1, point2)}
          </div>
          <div style={{ color: COLOR.line2 }}>
            {calcMessage(point3, point4)}
          </div>
          <div style={{ color: "grey" }}>
            {twoLineIntersection.x === undefined
              ? "∅ ( прямые паралельны )"
              : `точка пересечения (${fixedValue(
                  twoLineIntersection.x
                )} ; ${fixedValue(twoLineIntersection.y)} )`}
          </div>
        </div>
      </>
    </Profiler>
  );
};

export default Canvas;
