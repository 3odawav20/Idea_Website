import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider as AstraThemeProvider } from "@figma/astraui";
import App from "./app/App";
import "./styles/index.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("IDEA could not find the application root.");
}

createRoot(root).render(
  <StrictMode>
    <AstraThemeProvider>
      <App />
    </AstraThemeProvider>
  </StrictMode>,
);
