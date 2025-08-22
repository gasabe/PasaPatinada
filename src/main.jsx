// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GameSettingsProvider } from "../src/context/GameSettingsContext"; 

import "./styles/globals.css";
import "./styles/Modal.css"; // <— importá el CSS del modal acá

import App from "./App.jsx";
import Welcome from "./pages/Welcome.jsx";
import Game from "./pages/Game.jsx";
import Letters from "./pages/Letters.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "game", element: <Game /> },
      { path: "letters", element: <Letters /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GameSettingsProvider>
      <RouterProvider router={router} />
    </GameSettingsProvider>
  </React.StrictMode>
);
