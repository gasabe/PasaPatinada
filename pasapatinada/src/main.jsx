import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles/globals.css';
import App from './App.jsx';
import Welcome from './pages/Welcome.jsx';
import Game from './pages/Game.jsx';

const router = createBrowserRouter([
  { path: '/', element: <App />, children: [
    { index: true, element: <Welcome /> },
    { path: 'game', element: <Game /> }
  ] }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
