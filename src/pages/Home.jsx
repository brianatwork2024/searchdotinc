import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import ControlCenter from "../components/ControlCenter";
import UserMenu from "../components/UserMenu";
import "../styles/home.css";

export default function Home({ isLoggedIn, setIsLoggedIn }) {
  const [isControlCenterOpen, setControlCenterOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);

  const handleOpenControlCenter = () => {
    if (isLoggedIn) setControlCenterOpen(true);
  };

  const handleOpenUserMenu = () => {
    if (isLoggedIn) setUserMenuOpen(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserMenuOpen(false); // Close menu after sign out
    setControlCenterOpen(false);
  };

  return (
    <div className="home-container">
      {/* ✅ Background Video */}
      <video autoPlay loop muted className="video-background">
        <source src="/videos/bg-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* ✅ Content Overlay */}
      <div>
        {/* ✅ SearchBar shown when no overlay menus are open */}
        {!isControlCenterOpen && !isUserMenuOpen && (
          <SearchBar
            isLoggedIn={isLoggedIn}
            onOpenControlCenter={handleOpenControlCenter}
            onOpenUserMenu={handleOpenUserMenu}
          />
        )}

        {/* ✅ Control Center overlay */}
        {isControlCenterOpen && (
          <ControlCenter
            isOpen={isControlCenterOpen}
            onClose={() => setControlCenterOpen(false)}
            handleLogout={handleLogout}
          />
        )}

        {/* ✅ User Menu overlay */}
        {isUserMenuOpen && (
          <UserMenu
            isOpen={isUserMenuOpen}
            onClose={() => setUserMenuOpen(false)}
            handleLogout={handleLogout}
          />
        )}
      </div>
    </div>
  );
}
