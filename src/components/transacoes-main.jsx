import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TransactionsPage from "./TransactionsPage.jsx";
import "../index.css";
import "../styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <TransactionsPage />
  </StrictMode>
);
