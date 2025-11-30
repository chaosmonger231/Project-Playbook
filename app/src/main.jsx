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
import Playbook2 from "./pages/Playbook2.jsx";
import Playbook3 from "./pages/Playbook3.jsx";


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
      { path: "/playbook2", element: <Playbook2 /> },
      { path: "/playbook3", element: <Playbook3 />}
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
