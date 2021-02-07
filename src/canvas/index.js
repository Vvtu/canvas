import React, { useCallback, useEffect, useRef, useState } from "react";
interface CanvasProps {
  width: number;
  height: number;
}

type Coordinate = {
  x: number,
  y: number,
};
const LINES = 10;

const Canvas = ({ width, height }: CanvasProps) => {
  console.log("width = ", width); //TODO vvtu, need to delete
  console.log("height = ", height); //TODO vvtu, need to delete
  const canvasRef = useRef();
  const canvasRefBase = useRef();

  const [isPainting, setIsPainting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const SCALE = Math.min(width, height) / LINES;
  console.log("SCALE = ", SCALE); //TODO vvtu, need to delete

  const toReal = ({ x, y }: Coordinate) => ({
    x: x * SCALE + width / 2,
    y: -y * SCALE + height / 2,
  });
  const fromReal = ({ x, y }: Coordinate) => ({
    x: (x - width / 2) / SCALE,
    y: -(y - height / 2) / SCALE,
  });

  console.log(fromReal(toReal({ x: 1, y: 1 })));

  const getCoordinates = (event: MouseEvent): Coordinate | undefined => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    return {
      x: event.pageX - canvas.offsetLeft,
      y: event.pageY - canvas.offsetTop,
    };
  };

  const startPaint = useCallback((event: MouseEvent) => {
    const coordinates = getCoordinates(event);
    if (coordinates) {
      setMousePosition(coordinates);
      setIsPainting(true);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousedown", startPaint);
    return () => {
      canvas.removeEventListener("mousedown", startPaint);
    };
  }, [startPaint]);

  const paint = useCallback(
    (event: MouseEvent) => {
      if (isPainting) {
        const newMousePosition = getCoordinates(event);
        if (mousePosition && newMousePosition) {
          drawLine(mousePosition, newMousePosition);
          setMousePosition(newMousePosition);
        }
      }
    },
    [isPainting, mousePosition]
  );

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mousemove", paint);
    return () => {
      canvas.removeEventListener("mousemove", paint);
    };
  }, [paint]);

  const exitPaint = useCallback(() => {
    setIsPainting(false);
    setMousePosition(undefined);
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    canvas.addEventListener("mouseup", exitPaint);
    canvas.addEventListener("mouseleave", exitPaint);
    return () => {
      canvas.removeEventListener("mouseup", exitPaint);
      canvas.removeEventListener("mouseleave", exitPaint);
    };
  }, [exitPaint]);

  useEffect(() => {
    if (!canvasRefBase.current) {
      return;
    }
    const canvasBase: HTMLCanvasElement = canvasRefBase.current;
    const contextBase = canvasBase.getContext("2d");
    if (contextBase) {
      const max = fromReal({ x: width, y: height });
      const min = fromReal({ x: 0, y: 0 });
      console.log("max = ", max); //TODO vvtu, need to delete
      console.log("min = ", min); //TODO vvtu, need to delete
      contextBase.strokeStyle = "#333";
      contextBase.lineWidth = 1;

      contextBase.beginPath();

      for (let x = -LINES; x < LINES; x += 1) {
        const from = toReal({ x, y: 0 });
        const to = toReal({ x, y: 0 });
        contextBase.moveTo(from.x, 0);
        contextBase.lineTo(to.x, height);
      }
      for (let y = -LINES; y < LINES; y += 1) {
        const from = toReal({ x: 0, y });
        const to = toReal({ x: 0, y });
        contextBase.moveTo(0, from.y);
        contextBase.lineTo(width, to.y);
      }
      contextBase.closePath();
      contextBase.stroke();

      contextBase.strokeStyle = "#555";
      contextBase.lineWidth = 2;
      contextBase.beginPath();
      const from = toReal({ x: -LINES, y: 0 });
      const to = toReal({ x: LINES, y: 0 });
      contextBase.moveTo(from.x, from.y);
      contextBase.lineTo(to.x, to.y);

      const from2 = toReal({ x: 0, y: -LINES });
      const to2 = toReal({ x: 0, y: LINES });
      contextBase.moveTo(from2.x, from2.y);
      contextBase.lineTo(to2.x, to2.y);
      contextBase.closePath();
      contextBase.stroke();
    }
  }, [height, width, canvasRefBase.current]);

  const drawLine = (
    originalMousePosition: Coordinate,
    newMousePosition: Coordinate
  ) => {
    if (!canvasRef.current) {
      return;
    }
    const canvas: HTMLCanvasElement = canvasRef.current;
    const context = canvas.getContext("2d");
    if (context) {
      context.strokeStyle = "red";
      context.lineJoin = "round";
      context.lineWidth = 2;

      context.beginPath();
      context.moveTo(originalMousePosition.x, originalMousePosition.y);
      context.lineTo(newMousePosition.x, newMousePosition.y);
      context.closePath();

      context.stroke();
    }
  };

  return (
    <>
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
