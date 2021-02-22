import { useCallback, useEffect, useRef } from "react";

import { COLOR, ICoordinate } from "../utils";

import { ICanvasProps } from "./types";

const CoordinateGrid = ({ width, height, scale }: ICanvasProps) => {
  const canvasCoordinateGridRef = useRef();

  const toReal = useCallback(
    ({ x, y }: ICoordinate) => ({
      x: x * scale + width / 2,
      y: -y * scale + height / 2,
    }),
    [height, width, scale]
  );

  useEffect(() => {
    if (!canvasCoordinateGridRef.current) {
      return;
    }
    const canvasBase: HTMLCanvasElement = canvasCoordinateGridRef.current;
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
  }, [toReal, scale]);

  return (
    <div className="fullScreen">
      <canvas ref={canvasCoordinateGridRef} height={height} width={width} />
    </div>
  );
};

export default CoordinateGrid;
