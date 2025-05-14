import React, { useState } from "react";
import "../styles/navbar.css";
import profilePic from "/images/icon-logged-in.svg";
import signInIcon from "/images/sign-in-icon.svg";
import signInIconHover from "/images/sign-in-icon-hover.svg";

export default function Navbar({ isLoggedIn, setIsLoggedIn }) {
  const [showModal, setShowModal] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");


  const handleLogin = () => {
    const cleanedUsername = username.trim().toLowerCase();
    const cleanedPassword = password.trim();
    
    if (cleanedUsername === "startech" && cleanedPassword === "StarTech") {
      setIsLoggedIn(true);
      setShowModal(false);
      setUsername("");
      setPassword("");
      setLoginError(""); // Clear error on success
    } else {
      setLoginError("Invalid credentials. Please try again.");
    }
  };

  return (
    <>
      <nav className="navbar">
        {/* Logo on the Left */}
        <div className="logo-container">
          <img src="/images/logo.svg" alt="Logo" className="logo" />
          <div className="logo-tooltip">
            One of Google's most important self-professed Core&nbsp;Values "Don't be Evil"
            was part of their brand values since it started. It was quietly removed in 2018.
            For Tru. Look it up &#40;with us&#41; Compare us vs the rest.
          </div>
        </div>

        {/* Sign In or Profile Picture */}
        <div className="signin-container">
          {isLoggedIn ? (
            <img src={profilePic} alt="Profile" className="profile-icon" />
          ) : (
            <button
              className="signin-button"
              onClick={() => setShowModal(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <img
                src={isHovered ? signInIconHover : signInIcon}
                alt="Sign In"
                className="signin-icon"
              />
            </button>
          )}
        </div>
      </nav>

      {/* Sign-In Modal */}
      {showModal && !isLoggedIn && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <form
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <img src="/images/logo-search-popup.svg" alt="Sign In" className="icon-logo" />

            <input
              type="text"
              placeholder="Username"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {loginError && <p className="login-error">{loginError}</p>}

            <button type="submit" className="signin-submit">
              SIGN IN
            </button>

            <button type="button" className="modal-close" onClick={() => setShowModal(false)}>
              X
            </button>
          </form>
        </div>
      )}

    </>
  );
}
