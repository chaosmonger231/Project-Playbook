import { useOutletContext } from "react-router-dom";

export default function Data() {
  const { selected } = useOutletContext();
  return (
    <>
      <h2>Data</h2>
      <p>Current box: <strong>{selected}</strong></p>
      {/* show table/filter/etc based on selected */}
    </>
  );
}
