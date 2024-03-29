import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";
import { BlockchainWrapper } from "./components/Wrapper/BlockchainWrapper";

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);
root.render(
  <Router>
    <App />
  </Router>
);
