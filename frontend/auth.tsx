import React from "react";
import ReactDOM from "react-dom/client";
import AuthPage from "./src/pages/AuthPage";
import "./src/index.css";

// Disable Vite HMR to prevent dev artifacts from showing
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // Prevent HMR from reloading - just ignore updates
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthPage />
  </React.StrictMode>
);
