import { useOutletContext } from "react-router-dom";

export default function Train() {
  const { selected } = useOutletContext();
  return (
    <>
      <h2>Train</h2>
      <p>Current box: <strong>{selected}</strong></p>
      {/* switch UI based on selected */}
    </>
  );
}
