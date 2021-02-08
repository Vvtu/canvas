import Canvas from "./canvas";
import "./App.css";

import { useLayoutEffect, useRef, useState } from "react";

function App() {
  const ref = useRef<any>();
  const timeoutId = useRef<any>();
  const [screenSize, setScreenSize] = useState({ width: 600, height: 600 });

  function updateSize() {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
    }
    timeoutId.current = setTimeout(() => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        console.log("rect = ", rect); //TODO vvtu, need to delete
        setScreenSize({ width: rect.width, height: rect.height });
      }
    }, 250);
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
      <Canvas width={screenSize.width} height={screenSize.height} />
    </div>
  );
}

export default App;
