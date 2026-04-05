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
import UserAgreement from "./pages/UserAgreement";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Help from "./pages/Help";
import AccountTerms from "./pages/AccountTerms"

import Home from "./pages/Home";
import Lessons from "./pages/Lessons.jsx";
import Playbooks from "./pages/Playbooks.jsx";
import TeamManagament from "./pages/TeamManagement.jsx";
import TrainingCampaign from "./pages/TrainingCampaign";
import About from "./pages/About";
import IncidentResponse from "./pages/IncidentResponse.jsx";
import IncidentResponsePlanning from "./pages/IncidentResponsePlanning";
import SecurityMonitoringTools from "./pages/SecurityMonitoringTools";
import WazuhMonitoringTool from "./pages/WazuhMonitoringTool";
import SuricataMonitoringTool from "./pages/SuricataMonitoringTool";
import MonitoringGuidance from "./pages/MonitoringGuidance";
import DetectionResponsePlaybook from "./pages/DetectionResponsePlaybook";
import RansomwareResponsePlaybook from "./pages/RansomwareResponsePlaybook";

import SecurityReadiness from "./pages/SecurityReadiness.jsx";
import Playbook1 from "./pages/Playbook1";
import Playbook2 from "./pages/Playbook2.jsx";
import Playbook3 from "./pages/Playbook3.jsx";
import Playbook4 from "./pages/Playbook4.jsx";
// import Playbook5 from "./pages/Playbook5.jsx";

import LearningModuleContent from "./pages/LearningModuleContent";

import SecurityTools from "./pages/SecurityTools";

import PolicyGuide from "./pages/PolicyGuide";

import RiskPlanningTools from "./pages/RiskPlanningTools";
import ImpactCalculator from "./pages/ImpactCalculator";
import RiskCalculator from "./pages/RiskCalculator";

const router = createBrowserRouter([
  // Public route
  { path: "/login", element: <Login /> },
  { path: "/account-terms", element: <AccountTerms/> },

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
    path: "/learning/:moduleId",
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
      { path: "/lessons", element: <Lessons /> },
      { path: "/user-agreement", element: <UserAgreement /> },
      { path: "/privacy-policy", element: <PrivacyPolicy /> },
      { path: "/help", element: <Help /> },
      

      // Playbooks hub
      { path: "/playbooks", element: <Playbooks /> },
      { path: "/organization", element: <TeamManagament/>},
      { path: "/about", element: <About/>},
      { path: "/incidentresponse", element: <IncidentResponse/> },

      { path: "/securitytools", element: <SecurityTools />},
      { path: "/policyguide", element: <PolicyGuide/> },
      { path: "/riskplanningtools", element: <RiskPlanningTools /> },
      { path: "/impactcalculator", element: <ImpactCalculator /> },
      { path: "/riskcalculator", element: <RiskCalculator /> },
      { path: "/incidentresponseplanning", element: <IncidentResponsePlanning /> },
      { path: "/securitymonitoringtools", element: <SecurityMonitoringTools /> },
      { path: "/wazuhmonitoringtool", element: <WazuhMonitoringTool /> },
      { path: "/suricatamonitoringtool", element: <SuricataMonitoringTool /> },
      { path: "/monitoringguidance", element: <MonitoringGuidance /> },
      { path: "/detectionresponseplaybook", element: <DetectionResponsePlaybook /> },
      { path: "/ransomwareresponseplaybook", element: <RansomwareResponsePlaybook /> },

      // Playbook detail pages
      { path: "/securityreadiness", element: <SecurityReadiness /> },
      { path: "/playbook1", element: <Playbook1 /> },
      { path: "/playbook2", element: <Playbook2 /> },
      { path: "/playbook3", element: <Playbook3 /> },
      { path: "/playbook4", element: <Playbook4 /> },
      { path: "/playbook5", element: <TrainingCampaign /> },
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