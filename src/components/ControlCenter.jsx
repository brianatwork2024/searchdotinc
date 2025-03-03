import React, { useState } from "react";
import "../styles/controlcenter.css";

export default function ControlCenter({ isOpen, onClose, handleLogin }) {
  const [activePanel, setActivePanel] = useState("default");
  const [activeSetting, setActiveSetting] = useState("manual");
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });

  const [selectedControls, setSelectedControls] = useState({
    "Username Data": "off",
    "Location": "off",
    "Social Media Activity": "off",
    "Media Rich Search": "off",
  });

  const [isNuclearHovered, setIsNuclearHovered] = useState(false);

  const [isUsernameHovered, setIsUsernameHovered] = useState(false);
  const [usernameTooltipPosition, setUsernameTooltipPosition] = useState({ x: 0, y: 0 });

  const [isAccuracyHovered, setIsAccuracyHovered] = useState(false);
  const [accuracyTooltipPosition, setAccuracyTooltipPosition] = useState({ x: 0, y: 0 });
  
  const [isLocationHovered, setIsLocationHovered] = useState(false);
  const [locationTooltipPosition, setLocationTooltipPosition] = useState({ x: 0, y: 0 });

  const [isSocialMediaHovered, setIsSocialMediaHovered] = useState(false);
  const [socialMediaTooltipPosition, setSocialMediaTooltipPosition] = useState({ x: 0, y: 0 });

  const [isMediaRichHovered, setIsMediaRichHovered] = useState(false);
  const [mediaRichTooltipPosition, setMediaRichTooltipPosition] = useState({ x: 0, y: 0 });


  // ✅ Function to Calculate Accuracy Score
  const calculateAccuracyScore = () => {
    let score = 86; // Default base score
    if (selectedControls["Username Data"] === "on") {
      score += 6; // Increase by 6% if Username Data is ON
    }
    if (selectedControls["Location"] === "on") {
      score += 4; // ✅ Increase by 4% if Location is ON
    }  
    if (selectedControls["Social Media Activity"] === "on") {
      score += 2; // ✅ Increase by 4% if Location is ON
    }
    if (selectedControls["Media Rich Search"] === "on") {
      score += 2; // ✅ Increase by 4% if Location is ON
    } 
    return score;
  };

  const handleControlChange = (setting, value) => {
    setSelectedControls((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleAccuracyMouseMove = (event) => {
    setAccuracyTooltipPosition({ x: event.clientX + 10, y: event.clientY - 200 });
  };

  const handleUsernameMouseMove = (event) => {
    setUsernameTooltipPosition({ x: event.clientX + 10, y: event.clientY + 15 });
  };

  const handleLocationMouseMove = (event) => {
    setLocationTooltipPosition({ x: event.clientX + 10, y: event.clientY - 200 });
  };

  const handleSocialMediaMouseMove = (event) => {
    setSocialMediaTooltipPosition({ x: event.clientX + 10, y: event.clientY - 200 });
  };  

  const handleMouseMove = (event) => {
    setCursorPosition({ x: event.clientX + 10, y: event.clientY + 15 });
  };

  if (!isOpen) return null;

  return (
    <div className="control-center-overlay" onClick={onClose}>
      <div className="control-center" onClick={(e) => e.stopPropagation()}>

        <div className="cc-title">
          <div className="cc-avatar">
            <img src="/images/icon-avatar.svg" alt="avatar" className="icon-avatar" />
          </div>

          <div className="cc-user-info">
            <div className="cc-message">
              <h2>
                {activePanel === "accuracy"
                  ? "Maverick, these are your Accuracy Controls"
                  : activePanel === "nuclear"
                  ? "Maverick, this is the Nuclear Option"
                  : activePanel === "usernameData"
                  ? "Maverick, this is Username Data"
                  : "Maverick, this is your Control Centre"}
              </h2>
            </div>
            <button className="signout-submit" onClick={handleLogin}>SIGN OUT</button>
          </div>

          {activePanel === "default" && (
            <button className="control-center-close" onClick={onClose}>✕</button>
          )}

          {activePanel !== "default" && (
            <button className="control-center-back" onClick={() => setActivePanel("default")}>
              <img src="/images/icon-back.svg" alt="Back" />
            </button>
          )}
        </div>

        {activePanel === "default" && (
          <div className="cc-buttons">
            <button className="cc-button">Session History</button>
            <button className="cc-button" onClick={() => setActivePanel("accuracy")}>
              Accuracy Controls
            </button>
            <button className="cc-button">Revenue Share Tracker</button>
            <button className="cc-button">Subscription Controls</button>
          </div>
        )}

        {activePanel === "accuracy" && (
          <>
            <div className="accuracy-controls">
              <div className="accuracy-columns">

                <div className="accuracy-column">
                  <h3>CONTROL SETTINGS</h3>
                  <div className="control-settings-options">
                    {["max", "auto", "manual"].map((setting) => (
                      <div className="control-option" key={setting}>
                        <span className={`checkmark ${activeSetting === setting ? "active" : ""}`}>✔</span>
                        <button
                          className={`control-settings-option ${activeSetting === setting ? "active" : ""}`}
                          onClick={() => setActiveSetting(setting)}
                        >
                          {setting.toUpperCase()}
                        </button>
                      </div>
                    ))}
                  </div>

                  <div 
                    className="accuracy-score-container"
                    onMouseEnter={() => setIsAccuracyHovered(true)}
                    onMouseLeave={() => setIsAccuracyHovered(false)}
                    onMouseMove={handleAccuracyMouseMove} // ✅ Now updates position dynamically
                  >
                    <div className="accuracy-score">{calculateAccuracyScore()}%</div>
                    <span className="accuracy-score-label">Accuracy Score</span>

                    {isAccuracyHovered && (
                      <div 
                        className="tooltip accuracy-tooltip"
                        style={{
                          left: accuracyTooltipPosition.x - 200,
                          top: accuracyTooltipPosition.y - 800,
                        }}
                      >
                        <strong>Your Accuracy Score</strong>
                        <p>
                          The most fundamental aspect of search engine accuracy is understanding what you are looking for.
                          How you write your query and how our proprietary AI agent understands and applies your intent 
                          is the biggest factor in accuracy.
                        </p>
                        <p>
                          Your accuracy score is comprised of many things you control. Interestingly, your “search history” 
                          only contributes a small amount to overall accuracy. But some people (nudge, nudge, wink, wink) 
                          make billions by selling your information. We don’t. <span className="hashtag">#justsayin</span>
                        </p>
                      </div>
                    )}
                  </div>

                </div>

                <div className="accuracy-column">
                <h3>DATA TYPE</h3>
                <div className="data-type-container">
                  {Object.keys(selectedControls).map((setting, index) => (
                    <div 
                      key={index} 
                      className={`data-type-row 
                        ${setting === "Username Data" ? "username-data-container" : ""} 
                        ${setting === "Location" ? "location-data-container" : ""} 
                        ${setting === "Social Media Activity" ? "social-media-data-container" : ""} 
                        ${setting === "Media Rich Search" ? "media-rich-data-container" : ""}
                      `}
                      onMouseEnter={() => {
                        if (setting === "Username Data") setIsUsernameHovered(true);
                        if (setting === "Location") setIsLocationHovered(true);
                        if (setting === "Social Media Activity") setIsSocialMediaHovered(true);
                        if (setting === "Media Rich Search") setIsMediaRichHovered(true);
                      }}
                      onMouseLeave={() => {
                        if (setting === "Username Data") setIsUsernameHovered(false);
                        if (setting === "Location") setIsLocationHovered(false);
                        if (setting === "Social Media Activity") setIsSocialMediaHovered(false);
                        if (setting === "Media Rich Search") setIsMediaRichHovered(false);
                      }}
                      onMouseMove={(event) => {
                        if (setting === "Username Data") setUsernameTooltipPosition({ x: event.clientX + 10, y: event.clientY - 600 });
                        if (setting === "Location") setLocationTooltipPosition({ x: event.clientX + 10, y: event.clientY - 500 });
                        if (setting === "Social Media Activity") setSocialMediaTooltipPosition({ x: event.clientX + 10, y: event.clientY - 550 });
                        if (setting === "Media Rich Search") setMediaRichTooltipPosition({ x: event.clientX + 10, y: event.clientY - 475 });
                      }}
                    >
                      <button
                        className="data-type-button"
                        onClick={() => setActivePanel(setting === "Username Data" ? "usernameData" : "accuracy")}
                      >
                        {setting}
                      </button>

                      {/* Tooltip for Username Data */}
                      {setting === "Username Data" && isUsernameHovered && (
                        <div 
                          className="tooltip username-tooltip"
                          style={{
                            left: usernameTooltipPosition.x,
                            top: usernameTooltipPosition.y,
                          }}
                        >
                          <strong>Username Data (~6%)</strong>
                          <p><strong>Click-Through Rates:</strong> High correlation between results clicked and relevance, helping to refine future rankings.</p>
                          <p><strong>Time Spent on Pages (Dwell Time):</strong> Indicates the usefulness and engagement level of a page.</p>
                          <p><strong>Bounce Rate:</strong> High bounce rates signal poor content or irrelevant results.</p>
                          <p><strong>Search Session Patterns:</strong> Helps understand multi-step queries or searches with multiple facets.</p>
                          <p><strong>Search History:</strong> Helps refine personalized and repeated queries, though more secondary.</p>
                        </div>
                      )}

                      {/* Tooltip for Location Data */}
                      {setting === "Location" && isLocationHovered && (
                        <div 
                          className="tooltip location-tooltip"
                          style={{
                            left: locationTooltipPosition.x,
                            top: locationTooltipPosition.y,
                          }}
                        >
                          <strong>Location (~4%)</strong>
                          <p>Kinda important if you want to know how to locate or get somewhere. It’s essential for providing localized results for queries with geographic intent.</p>
                          <p><strong>Local Search Patterns:</strong> Helps boost regional relevance, e.g., trending topics in a specific area or categories like food, entertainment, etc.</p>
                        </div>
                      )}

                      {/* Tooltip for Social Media Activity */}
                      {setting === "Social Media Activity" && isSocialMediaHovered && (
                        <div 
                          className="tooltip social-media-tooltip"
                          style={{
                            left: socialMediaTooltipPosition.x,
                            top: socialMediaTooltipPosition.y,
                          }}
                        >
                          <strong>Social Media Activity (~5%)</strong>
                          <p><strong>Engagement Metrics:</strong> Tracks shares, likes, and comments to gauge content popularity.</p>
                          <p><strong>Trending Topics:</strong> Helps personalize search results based on real-time trends from social platforms.</p>
                          <p><strong>Influencer Impact:</strong> Identifies trusted sources and their credibility based on social reach.</p>
                        </div>
                      )}

                      {/* Tooltip for Media Rich Search */}
                      {setting === "Media Rich Search" && isMediaRichHovered && (
                        <div 
                          className="tooltip media-rich-tooltip"
                          style={{
                            left: mediaRichTooltipPosition.x,
                            top: mediaRichTooltipPosition.y,
                          }}
                        >
                          <strong>Media Rich, Image or media content. (~2%)</strong>
                          <p><strong>Image / video / audio search patterns:</strong> Assesses alternative media consumption patterns.</p>
                          <p><strong>Share / commentary sentiment:</strong> Can also help mitigate social bias.</p>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>




                <div className="accuracy-column">
                  <h3>YOUR CONTROLS</h3>
                  {Object.keys(selectedControls).map((setting, index) => (
                    <div key={index} className="control-row">
                      <div className="radio-group">
                        {["on", "off", "delete"].map((value) => (
                          <label key={value} className="radio-option">
                            <input 
                              type="radio" 
                              name={`control-${index}`} 
                              value={value} 
                              checked={selectedControls[setting] === value} 
                              onChange={() => handleControlChange(setting, value)} 
                            />
                            <span className="radio-label">{value.toUpperCase()}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

            {/* ✅ Go Nuclear Button is BACK! */}
            <div 
              className="nuclear-icon-container"
              onMouseEnter={() => setIsNuclearHovered(true)}
              onMouseLeave={() => setIsNuclearHovered(false)}
              onClick={() => setActivePanel("nuclear")}
            >
              <img src="/images/icon-nuclear.svg" alt="Nuclear Icon" className="nuclear-icon" />
            </div>
          </>
        )}

        {activePanel === "nuclear" && (
          <div className="nuclear-option">
            <p>Delete all data saved to your User Name from our system.</p>
            <div className="go-nuclear-container">
              <img 
                src="/images/icon-go-nuclear.svg" 
                alt="Go Nuclear" 
                className="go-nuclear-button"
              />
              <p>Once you hit the big red button, your data is deleted and cannot be retrieved. That being said, you have the <em>“right to be forgotten.”</em></p>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
