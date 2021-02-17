import Canvas from "./canvas";
import "./App.css";

import { useLayoutEffect, useRef, useState } from "react";
const SCALE_MULTIPLIER = 1.2;
const INITIAL_SCALE_VALUE = 60;

function App() {
  const ref = useRef<any>();
  const timeoutId = useRef<any>();
  const [screenSize, setScreenSize] = useState({ width: 600, height: 600 });
  const [scale, setScale] = useState(INITIAL_SCALE_VALUE);

  function updateSize() {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setScreenSize({ width: rect.width, height: rect.height });
      }
    }, 200);
  }

  useLayoutEffect(() => {
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => {
      window.removeEventListener("resize", updateSize);
      if (timeoutId.current) {
        clearTimeout(timeoutId.current);
      }
    };
  }, []);

  return (
    <div className="App fullScreen" ref={ref}>
      <Canvas
        width={screenSize.width}
        height={screenSize.height}
        scale={scale}
      />
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
}

export default App;
