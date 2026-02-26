import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import "./index.css";
import { UserProvider } from "./auth/UserContext.jsx";

import AuthGate from "./auth/AuthGate";
import Shell from "./components/Shell";

import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import AccountPage from "./pages/AccountPage.jsx";

import Home from "./pages/Home";
import Train from "./pages/Train";
import Playbooks from "./pages/Playbooks.jsx";

import SecurityReadiness from "./pages/SecurityReadiness.jsx";
import Playbook2 from "./pages/Playbook2.jsx";
import Playbook3 from "./pages/Playbook3.jsx";
import Playbook4 from "./pages/Playbook4.jsx";
import Playbook5 from "./pages/Playbook5.jsx";

import LearningModuleContent from "./pages/LearningModuleContent";

const router = createBrowserRouter([
  // Public route
  { path: "/login", element: <Login /> },

  // Auth routes WITHOUT Shell
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
  {
    path: "/learning/:topic",
    element: (
      <AuthGate>
        <LearningModuleContent />
      </AuthGate>
    ),
  },

  // App routes WITH Shell
  {
    element: (
      <AuthGate>
        <Shell />
      </AuthGate>
    ),
    children: [
      { path: "/", element: <Home /> },
      { path: "/train", element: <Train /> },

      // ✅ Playbooks hub
      { path: "/playbooks", element: <Playbooks /> },

      // Playbook detail pages
      { path: "/securityreadiness", element: <SecurityReadiness /> },
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