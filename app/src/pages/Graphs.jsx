import { useOutletContext } from "react-router-dom";

export default function Graphs() {
  const { selected } = useOutletContext();

  return (
    <>
      <h2>Graphs</h2>
      <p>Current box: <strong>{selected}</strong></p>

      {/* Example conditional render (replace with real charts/components) */}
      {selected === "box1" && <div>Line chart goes here</div>}
      {selected === "box2" && <div>Bar chart goes here</div>}
      {selected === "box3" && <div>Scatter chart goes here</div>}
      {selected === "box4" && <div>Heatmap goes here</div>}
    </>
  );
}
