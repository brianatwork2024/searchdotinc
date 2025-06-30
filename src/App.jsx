import { useState } from "react";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // Import Footer
import "./styles/password-gate.css"; // optional custom styles

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Global login state
  const [isAuthorized, setIsAuthorized] = useState(true); // Site-wide access gate
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const correctPassword = "StarTech";

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const cleanedUser = authUsername.trim().toLowerCase();
    const cleanedPass = authPassword.trim();

    if (cleanedUser === "startech" && cleanedPass === "StarTech") {
      setIsAuthorized(true);
      setLoginError("");
    } else {
      setLoginError("Invalid username or password.");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="password-gate">
        <form className="password-form" onSubmit={handleAuthSubmit}>
          <h2>Enter Access Credentials</h2>
          <input
            type="text"
            placeholder="Username"
            value={authUsername}
            onChange={(e) => setAuthUsername(e.target.value)}
            className="input-field"
          />
          <input
            type="password"
            placeholder="Password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            className="input-field"
          />
          {loginError && <p className="login-error">{loginError}</p>}
          <button type="submit">Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Pass isLoggedIn state to Navbar & Home */}
      <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
      <Home isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />

      <Footer />
    </div>
  );
}
