import { useOutletContext } from "react-router-dom";

// Following imports for testing Firestore connection. Comment it out when done.
// import { db } from "../auth/firebase";
// import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const { selected } = useOutletContext();

  // Start of DB connection Test Function. Comment it out when done
  /* 
  async function testFirestore() {
  try {
    const ref = doc(db, "_connectionTest", "testDoc");

    await setDoc(ref, {
      message: "Test Hello From Home",
      testedTime: serverTimestamp(), 
    });

    alert("Firestore test worked!");
  } catch (e) {
    console.error("Firestore Connection Test Failed:", e);
    alert("Firestore Test Failed - Check Console.");
  }
}
   */
  // END of Test Function. Comment it out when done.


  return (
    <>
      <h2>Home</h2>
      <p>Current box: <strong>{selected}</strong></p>
      {/* render home-specific content based on selected */}

      {/* Test Button below comment out when done*/}

      {/* <button onClick={testFirestore}>Test Firestore</button> */}
    </>
  );
}
