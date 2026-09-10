import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const orientation = typeof screen !== "undefined" ? screen.orientation as ScreenOrientation & { lock?: (mode: "landscape") => Promise<void> } : undefined;
if (orientation?.lock) {
  orientation.lock("landscape").catch(() => undefined);
}

createRoot(document.getElementById("root")!).render(<App />);
