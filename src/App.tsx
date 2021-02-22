import Routes from "./Routes";
import "./App.css";

import { useLayoutEffect, useRef, useState } from "react";
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
      <Routes
        width={screenSize.width}
        height={screenSize.height}
        scale={scale}
        setScale={(a) => {
          setScale(a);
          console.log("%c a = ", "color: #bada55", a); //TODO - delete vvtu
        }}
      />
    </div>
  );
}

export default App;
