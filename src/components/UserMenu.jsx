import React, { useState } from "react";
import "../styles/usermenu.css";

export default function UserMenu({ isOpen, onClose, handleLogout }) {
  const [activeView, setActiveView] = useState("default"); // Tracks the current view

  if (!isOpen) return null; // Prevents rendering when closed

  return (
    <div className="user-menu-overlay" onClick={onClose}>
      <div className="user-menu" onClick={(e) => e.stopPropagation()}>

        {/* User Menu Header */}
        <div className="um-title">
          <div className="um-avatar">
            <img src="/images/icon-avatar.svg" alt="avatar" className="icon-avatar" />
          </div>

          {/* User Info Section */}
          <div className="um-user-info">
            <div className="um-message">
              <h2>
                {activeView === "whySearchInc" 
                  ? "Maverick, Why Search Inc?"
                  : activeView === "comparisonTable"
                  ? "Maverick, Search Engine Comparison"
                  : "Maverick, this is your Menu"}
              </h2>
            </div>

            {/* ✅ Sign Out Button (Always Visible) */}
            <div className="um-sign-out">
              <button className="um-signout-submit" onClick={handleLogout}>SIGN OUT</button>
            </div>
          </div>

          {/* Close Button (Only in Default View) */}
          {activeView === "default" && (
            <button className="user-menu-close" onClick={onClose}>✕</button>
          )}

          {/* Back Button (Appears in other views, Top-Right Corner) */}
          {activeView !== "default" && (
            <button className="user-menu-back" onClick={() => setActiveView("default")}>
              <img src="/images/icon-back.svg" alt="Back" />
            </button>
          )}
        </div>

        {/* Default User Menu View */}
        {activeView === "default" && (
          <div className="user-menu-buttons">
            <button className="user-menu-button">Revenue Share Terms</button>
            <button className="user-menu-button" onClick={() => setActiveView("whySearchInc")}>
              Why Search Inc?
            </button>
            <button className="user-menu-button" onClick={() => setActiveView("comparisonTable")}>
              Search Engine Comparison Table
            </button>
          </div>
        )}

        {/* Why Search Inc View */}
        {activeView === "whySearchInc" && (
          <div className="why-search-inc">
            <img 
              src="/images/image-why-search-inc.png" 
              alt="Why Search Inc" 
              className="why-search-inc-image"
            />
          </div>
        )}

        {/* Search Engine Comparison Table View */}
        {activeView === "comparisonTable" && (
          <div className="comparison-table">
            <img 
              src="/images/image-comparison-table.png" 
              alt="Search Engine Comparison Table" 
              className="comparison-table-image"
            />
          </div>
        )}

      </div>
    </div>
  );
}
