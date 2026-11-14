import { createRoot } from "react-dom/client";
import App from "./App";
import { initRum } from "./lib/rum";
import "./index.css";

initRum();
createRoot(document.getElementById("root")!).render(<App />);
