import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import AuthGate from "./auth/AuthGate";  // ✅ Import your AuthGate
import Login from "./pages/Login";
import Shell from "./components/Shell";
import Home from "./pages/Home";
import Graphs from "./pages/Graphs";
import Train from "./pages/Train";
import Data from "./pages/Data";
import "./index.css";

const router = createBrowserRouter([
  // Public route
  { path: "/login", element: <Login /> },

  // Protected routes wrapped inside AuthGate
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

  // Catch-all route — redirects invalid URLs to login
  { path: "*", element: <Login /> },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
