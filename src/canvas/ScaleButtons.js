import { ICanvasProps } from "./types";

const SCALE_MULTIPLIER = 1.2;

const ScaleButtons = ({ scale, setScale }: ICanvasProps) => {
  return (
    <div className="fullScreen">
      <div
        className="scaleButton1"
        onClick={() => {
          setScale(scale * SCALE_MULTIPLIER);
        }}
      >
        +
      </div>
      <div
        className="scaleButton2"
        onClick={() => {
          setScale(scale / SCALE_MULTIPLIER);
        }}
      >
        &minus;
      </div>
    </div>
  );
};

export default ScaleButtons;
