import { Routes, Route, Navigate } from "react-router-dom";
import Shell from "./components/Shell.jsx";
import Home from "./pages/Home.jsx";
import Graphs from "./pages/Graphs.jsx";
import Train from "./pages/Train.jsx";
import Data from "./pages/Data.jsx";
import AuthGate from "./auth/AuthGate.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<AuthGate><Shell /></AuthGate>}>
        <Route path="/" element={<Home />} />
        <Route path="/graphs" element={<Graphs />} />
        <Route path="/train" element={<Train />} />
        <Route path="/data" element={<Data />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
