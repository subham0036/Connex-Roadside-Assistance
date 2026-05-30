import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import RequestProvider from "./context/RequestContext";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <RequestProvider>
    <App />
  </RequestProvider>
);