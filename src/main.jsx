import React from "react";
import ReactDOM from "react-dom/client";
import { storage } from "./lib/storage";
import App from "./App.jsx";

// كود اللعبة (App.jsx) بينادي window.storage.get/set/delete/list
// زي أي artifact جوه Claude.ai. السطر ده بيوصّل نفس الـ API لـ Firebase (shared)
// أو localStorage (خاص بالجهاز) حسب lib/storage.js
window.storage = storage;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
