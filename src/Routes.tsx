import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import { ICanvasProps } from "./canvas/types";

import Lines from "./canvas/Lines";

const LINES = "/lines";

export default function Routes(props: ICanvasProps) {
  return (
    <Router>
      <Switch>
        <Route path={LINES}>
          <Lines {...props} />
        </Route>
        <Route path="/">
          <nav>
            <ul>
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to={LINES}>Lines</Link>
              </li>
            </ul>
          </nav>
        </Route>
      </Switch>
    </Router>
  );
}
