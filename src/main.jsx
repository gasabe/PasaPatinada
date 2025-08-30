import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { GameSettingsProvider } from "./context/GameSettingsContext";
import "./styles/globals.css";
import "./styles/Modal.css";

import App from "./App.jsx";
import Welcome from "./pages/Welcome.jsx";
import Game from "./pages/Game.jsx";
import Letters from "./pages/Letters.jsx";
import Ranking from "./pages/Ranking.jsx";
import Editor from "./pages/Editor.jsx";
import Host from "./pages/Host.jsx"; 

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Welcome /> },
      { path: "game", element: <Game /> },
      { path: "letters", element: <Letters /> },
      { path: "ranking", element: <Ranking /> },
      { path: "editor", element: <Editor /> },
      { path: "host", element: <Host /> }, 
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
