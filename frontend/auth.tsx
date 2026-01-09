import React from "react";
import ReactDOM from "react-dom/client";
import AuthPage from "./src/pages/AuthPage";
import "./src/index.css";

// Prevent Vite HMR artifacts from showing on reload
if (import.meta.hot) {
  // Clear any existing auth session on dev reload to force clean state
  const hasReloaded = sessionStorage.getItem("auth_page_loaded");
  if (!hasReloaded) {
    sessionStorage.setItem("auth_page_loaded", "true");
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthPage />
  </React.StrictMode>
);
