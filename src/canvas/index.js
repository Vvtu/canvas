import { useCallback, useEffect, useRef, useState, Profiler } from "react";

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
  scale: number;
}

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

const Canvas = ({ width, height, scale }: CanvasProps) => {
  const canvasRef = useRef();
  const canvasRefBase = useRef();
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
    if (!canvasRefBase.current) {
      return;
    }
    const canvasBase: HTMLCanvasElement = canvasRefBase.current;
    const coordinatesGridRef = canvasBase.getContext("2d");
    if (coordinatesGridRef) {
      coordinatesGridRef.clearRect(0, 0, canvasBase.width, canvasBase.height);

      coordinatesGridRef.strokeStyle = COLOR.base;
      coordinatesGridRef.lineWidth = 1;

      coordinatesGridRef.beginPath();

      const lines = Math.round(
        Math.max(canvasBase.height, canvasBase.width) / scale / 2
      );
      for (let x = -lines; x < lines; x += 1) {
        const from = toReal({ x, y: 0 });
        const to = toReal({ x, y: 0 });
        coordinatesGridRef.moveTo(from.x, 0);
        coordinatesGridRef.lineTo(to.x, canvasBase.height);
      }
      for (let y = -lines; y < lines; y += 1) {
        const from = toReal({ x: 0, y });
        const to = toReal({ x: 0, y });
        coordinatesGridRef.moveTo(0, from.y);
        coordinatesGridRef.lineTo(canvasBase.width, to.y);
      }
      coordinatesGridRef.closePath();
      coordinatesGridRef.stroke();

      coordinatesGridRef.strokeStyle = COLOR.ordinates;
      coordinatesGridRef.lineWidth = 1;
      coordinatesGridRef.beginPath();
      // x
      const from = toReal({ x: -lines, y: 0 });
      const to = toReal({ x: lines, y: 0 });
      coordinatesGridRef.moveTo(from.x, from.y);
      coordinatesGridRef.lineTo(to.x + 10, to.y);
      // arrow x
      coordinatesGridRef.moveTo(canvasBase.width - 15, to.y - 3);
      coordinatesGridRef.lineTo(canvasBase.width - 2, to.y);
      coordinatesGridRef.moveTo(canvasBase.width - 15, to.y + 3);
      coordinatesGridRef.lineTo(canvasBase.width - 2, to.y);
      // y
      const from2 = toReal({ x: 0, y: -lines });
      const to2 = toReal({ x: 0, y: lines });
      coordinatesGridRef.moveTo(from2.x, from2.y);
      coordinatesGridRef.lineTo(to2.x, to2.y);
      // arrow y
      coordinatesGridRef.moveTo(to2.x - 3, 15);
      coordinatesGridRef.lineTo(to2.x, 2);
      coordinatesGridRef.moveTo(to2.x + 3, 15);
      coordinatesGridRef.lineTo(to2.x, 2);
      //
      coordinatesGridRef.closePath();
      coordinatesGridRef.stroke();
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

  const callback = (e) => {
    console.log("%ccallback e = ", "color: #bada55", e); //TODO - delete vvtu
  };

  return (
    <Profiler id="Navigation" onRender={callback}>
      <>
        <div className="fullScreen">
          <canvas ref={canvasRefBase} height={height} width={width} />
        </div>
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
