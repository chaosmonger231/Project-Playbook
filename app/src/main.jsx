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
import AccountPage from "./pages/AccountPage.jsx";
import Onboarding from "./pages/Onboarding";
import "./index.css";
import { UserProvider } from "./auth/UserContext.jsx";
import Playbook1 from "./pages/Playbook1.jsx";
import Playbook2 from "./pages/Playbook2.jsx";
import Playbook3 from "./pages/Playbook3.jsx";
import Playbook4 from "./pages/Playbook4.jsx";
import Playbook5 from "./pages/Playbook5.jsx";
import LearningModuleContent from "./pages/LearningModuleContent";

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },

  {
    path: "/onboarding",
    element: (
      <AuthGate>
        <Onboarding />
      </AuthGate>
    ),
  },

  {
    path: "/account",
    element: (
      <AuthGate>
        <AccountPage />
      </AuthGate>
    ),
  },

  // 🔹 LEARNING ROUTE (authenticated, NO sidebar)
  {
    path: "/learning/:topic",
    element: (
      <AuthGate>
        <LearningModuleContent />
      </AuthGate>
    ),
  },

  // 🔹 APP ROUTES (WITH sidebar)
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
      { path: "/playbook1", element: <Playbook1 /> },
      { path: "/playbook2", element: <Playbook2 /> },
      { path: "/playbook3", element: <Playbook3 /> },
      { path: "/playbook4", element: <Playbook4 /> },
      { path: "/playbook5", element: <Playbook5 /> },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>
  </React.StrictMode>
);