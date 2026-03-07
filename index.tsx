import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Os arquivos CSS agora são carregados diretamente no index.html.

const el = document.getElementById("root");

if (el) {
  createRoot(el).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error("Root element not found");
}