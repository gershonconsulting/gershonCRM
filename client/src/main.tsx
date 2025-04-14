import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Note: @dnd-kit doesn't have CSS files to import in newer versions
// We'll handle the styling with tailwind and custom CSS

createRoot(document.getElementById("root")!).render(<App />);
