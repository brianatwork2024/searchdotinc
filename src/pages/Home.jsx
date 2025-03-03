import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import ControlCenter from "../components/ControlCenter";
import UserMenu from "../components/UserMenu"; // ✅ Import UserMenu
import "../styles/home.css"; // Ensure this file is correctly imported

export default function Home({ isLoggedIn }) {
  const [isControlCenterOpen, setControlCenterOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="home-container">
      {/* ✅ Background Video */}
      <video autoPlay loop muted className="video-background">
        <source src="/videos/bg-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* ✅ Content Overlay */}
      <div>
        {/* ✅ Show Search Bar only when neither menu is open */}
        {!isControlCenterOpen && !isUserMenuOpen && (
          <SearchBar 
            onOpenControlCenter={() => setControlCenterOpen(true)} 
            onOpenUserMenu={() => setUserMenuOpen(true)} 
          />
        )}

        {/* ✅ Control Center - Covers Search Bar when open */}
        {isControlCenterOpen && (
          <ControlCenter 
            isOpen={isControlCenterOpen} 
            onClose={() => setControlCenterOpen(false)} 
          />
        )}

        {/* ✅ User Menu - Covers Search Bar when open */}
        {isUserMenuOpen && (
          <UserMenu 
            isOpen={isUserMenuOpen} 
            onClose={() => setUserMenuOpen(false)} 
          />
        )}
      </div>
    </div>
  );
}
