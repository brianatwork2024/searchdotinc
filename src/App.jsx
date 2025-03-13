import { useState } from "react";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // Import Footer

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Global login state

  return (
    <div className="app">
      {/* Pass isLoggedIn state to Navbar & Home */}
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Home isLoggedIn={isLoggedIn} />

      <Footer />
    </div>
  );
}
