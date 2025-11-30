import { useEffect, useMemo, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import TopNav from "./TopNav";
import Sidebar from "./Sidebar";

export default function Shell() {

  const [selected, setSelected] = useState("box1"); // default
  const location = useLocation();

  const items = useMemo(() => {
    if (location.pathname.startsWith("/graphs"))  return ["box1","box2","box3","box4"];
    if (location.pathname.startsWith("/train"))   return ["box1","box2","box3","box4"];
    if (location.pathname.startsWith("/data"))    return ["box1","box2","box3","box4"];
    return ["box1","box2","box3"]; // default for Home or anything else
  }, [location.pathname]);

  // Optional: when route changes and the current selection isn't in the new set, reset.
  useEffect(() => {
    if (!items.includes(selected)) setSelected(items[0]);
  }, [items, selected]);

  return (
    <div className="app">
      <TopNav />
      <div className="layout">
        <Sidebar selected={selected} onSelect={setSelected} items={items} />
        <main className="content">
          <div className="box">
            {/* Pass the current selection down to pages */}
            <Outlet context={{ selected, items }} />
          </div>
        </main>
      </div>
    </div>
  );
}
