import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthGate from "./auth/AuthGate";
import Login from "./pages/Login";
import Shell from "./components/Shell";
import Home from "./pages/Home";
import Graphs from "./pages/Graphs";
import Train from "./pages/Train";
import Data from "./pages/Data";
import "./index.css";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    element: (
      <AuthGate>
        <Shell />
      </AuthGate>
    ),
    children: [
      { path: "/", element: <Home /> },
      { path: "/graphs", element: <Graphs /> },
      { path: "/train", element: <Train /> },
      { path: "/data", element: <Data /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
