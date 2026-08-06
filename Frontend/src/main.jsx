import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { UIProvider } from "./context/UIContext";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UIProvider>
      <App />
    </UIProvider>
  </React.StrictMode>
);