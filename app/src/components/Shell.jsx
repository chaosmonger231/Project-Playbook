import { Outlet } from "react-router-dom";
import TopNav from "./TopNav.jsx";
import Footer from "./Footer.jsx";

export default function Shell() {
  return (
    <div className="app">
      <TopNav />
      <main className="content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}