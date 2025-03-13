import React, { useState } from "react";
import "../styles/navbar.css"; // Import styles
import profilePic from "/images/icon-logged-in.svg"; // Logged-in profile icon
import signInIcon from "/images/sign-in-icon.svg"; // Default sign-in icon
import signInIconHover from "/images/sign-in-icon-hover.svg"; // Hover state icon

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const [showModal, setShowModal] = useState(false); // Control modal visibility
  const [isHovered, setIsHovered] = useState(false); // Track hover state

  // Simulate login action
  const handleLogin = () => {
    setIsLoggedIn(true);
    setShowModal(false); // Close modal after logging in
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <img src="/images/logo-search-popup.svg" alt="Sign In" className="icon-logo" />
            <input type="text" placeholder="Username" className="input-field" />
            <input type="password" placeholder="Password" className="input-field" />
            <button className="signin-submit" onClick={handleLogin}>SIGN IN</button>
            <button className="modal-close" onClick={() => setShowModal(false)}>X</button>
          </div>
        </div>
      )}
    </>
  );
}
