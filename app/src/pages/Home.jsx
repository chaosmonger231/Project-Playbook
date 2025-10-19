import { useOutletContext } from "react-router-dom";

export default function Home() {
  const { selected } = useOutletContext();
  return (
    <>
      <h2>Home</h2>
      <p>Current box: <strong>{selected}</strong></p>
      {/* render home-specific content based on selected */}
    </>
  );
}
