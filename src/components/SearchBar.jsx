import React, { useState, useRef } from "react";
import "../styles/searchbar.css";
import searchIcon from "/images/icon-search.svg" with { type: "svg" };
import bubblesIcon from "/images/icon-bubbles.svg" with { type: "svg" };
import listIcon from "/images/icon-list.svg" with { type: "svg" };
import leafIcon from "/images/icon-leaf.svg" with { type: "svg" };

export default function SearchBar({ onOpenControlCenter, onOpenUserMenu, isControlCenterOpen }) {
  const [query, setQuery] = useState("");
  const [additionalResults, setAdditionalResults] = useState([]);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpResults, setFollowUpResults] = useState([]);
  const [notificationBrief, setNotificationBrief] = useState(null);
  const [isBriefVisible, setIsBriefVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [activeTab, setActiveTab] = useState("list");
  const [inputWidth, setInputWidth] = useState(650);
  
  const circleContainerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const followUpInputRef = useRef(null);


  const handleInputChange = (event) => {
    const text = event.target.value;
    setQuery(text);
    setAdditionalResults([]);
    setSearchMessage("");

    if (circleContainerRef.current) {
      circleContainerRef.current.scrollLeft = 0;
    }

    if (event.target) {
      event.target.style.height = "auto";
      event.target.style.height = `${event.target.scrollHeight}px`;
      event.target.scrollTop = 0;
    }

    const measurer = document.createElement("span");
    measurer.className = "search-width-measurer";
    measurer.innerText = text || "W";
    document.body.appendChild(measurer);
    const newWidth = Math.min(measurer.offsetWidth + 60, window.innerWidth * 0.8);
    setInputWidth(newWidth);
    document.body.removeChild(measurer);
  };

  const handleSearch = async (searchQuery, setResults, setLoading, previousResults = []) => {
    if (searchQuery.trim() === "") return;
    setLoading(true);

    try {
      const response = await fetch(`http://15.223.63.70:3001/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, previousResults }),
      });

      const data = await response.json();
      if (response.ok && data.documents.length > 0) {
        setResults([...previousResults, ...data.documents]);
        setSearchMessage(`${data.documents.length} results found for "${searchQuery}"`);
      } else {
        setResults([]);
        setSearchMessage(`No results matching "${searchQuery}". Try rephrasing your search.`);
      }
    } catch (error) {
      setSearchMessage("Error retrieving search results.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpSearch = async (searchQuery) => {
    if (searchQuery.trim() === "") return;
    setIsFollowUpLoading(true);
    setNotificationBrief(null);

    try {
      const response = await fetch(`http://localhost:3001/api/notification-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, previousResults: additionalResults }),
      });

      const data = await response.json();
      if (response.ok && data.notificationBrief) {
        setNotificationBrief(data.notificationBrief);
        setIsBriefVisible(true);
      } else {
        setNotificationBrief("No relevant results found. Try refining your follow-up question.");
      }
    } catch (error) {
      setNotificationBrief("Error retrieving follow-up results.");
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Dragging functionality for circles
  const handleMouseDown = (e) => {
    isDragging.current = true;
    startX.current = e.pageX - circleContainerRef.current.offsetLeft;
    scrollLeft.current = circleContainerRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - circleContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 2; // Adjust scroll speed
    circleContainerRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
  };

  const formatNotificationBrief = (briefText) => {
    if (!briefText || typeof briefText !== "string") return null;
  
    // Use regex to correctly extract sections that start with "**"
    const sections = briefText.split(/\*\*(.*?)\*\*/g).filter(section => section.trim() !== "");
  
    let formattedSections = [];
  
    for (let i = 0; i < sections.length; i += 2) {
      let heading = sections[i]?.trim();
      let content = sections[i + 1]?.trim() || "No content available."; // Default if no content
  
      if (heading && content) {
        formattedSections.push(
          <div key={i} className="notification-section">
            <h2>{heading}</h2>
            <p>{content}</p>
          </div>
        );
      }
    }
  
    return formattedSections;
  };
  

  return (
    <div className="searchbar-container">
      <div className="cc-icon" onClick={onOpenControlCenter}></div>
      <div className="searchbar-wrapper">
        {!isControlCenterOpen && (
          <>
            <form className="search-bar" style={{ width: `${inputWidth}px`, maxWidth: "80%" }}>
              <textarea
                placeholder="Welcome. Search and you will find"
                value={query}
                onChange={handleInputChange}
                className="search-input"
                rows="1"
              />
              <img src={searchIcon} alt="Search" className="search-button" onClick={() => handleSearch(query, setAdditionalResults, setIsLoading)} />
            </form>

            {isLoading && <div className="preloader-container"><div className="spinner"></div></div>}

            {searchMessage && <div className="search-message"><p>{searchMessage}</p></div>}

            {additionalResults.length > 0 && (
              <div className="additional-results">
                <div className="results-tabs">
                  <button className={`tab-button ${activeTab === "list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>
                    <img src={listIcon} alt="List" className="tab-icon" />
                  </button>
                  <button className={`tab-button ${activeTab === "circles" ? "active" : ""}`} onClick={() => setActiveTab("circles")}>
                    <img src={bubblesIcon} alt="Circles" className="tab-icon" />
                  </button>
                </div>

                {activeTab === "list" && (
                  <div className="search-results">
                    {additionalResults.map((doc) => (
                      <div key={doc.id} className="search-result-item">
                        <p>{doc.title}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "circles" && (
                  <div
                    className="circle-container"
                    ref={circleContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUpOrLeave}
                    onMouseLeave={handleMouseUpOrLeave}
                  >
                    {additionalResults.map((doc) => (
                      <div key={doc.id} className="circle">
                        <img src={leafIcon} alt="Leaf" className="circle-icon" />
                        <span className="circle-text">{doc.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ✅ Follow-Up Search - Outside of Additional Results Div */}
            {additionalResults.length > 0 && (
              <div className="follow-up-search">
                <form className="search-bar follow-up" style={{ width: `${inputWidth}px`, maxWidth: "80%" }}>
                  <textarea
                    ref={followUpInputRef}
                    placeholder="Ask a follow-up question..."
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); // Prevent new line
                        handleFollowUpSearch(followUpQuery, setFollowUpResults, setIsFollowUpLoading, additionalResults);
                      }
                    }}
                    className="search-input"
                  />
                  <img
                    src={searchIcon}
                    alt="Search"
                    className="search-button"
                    onClick={() => handleSearch(followUpQuery, setFollowUpResults, setIsFollowUpLoading, additionalResults)}
                  />
                </form>

                {isFollowUpLoading && (
                  <div className="preloader-container">
                    <div className="spinner"></div>
                  </div>
                )}
              </div>
            )}

            {/* ✅ Follow-Up Search Results */}
            {followUpResults.length > 0 && (
              <div className="search-results">
                {followUpResults.map((doc) => (
                  <div key={doc.id} className="search-result-item">
                    <p>{doc.title}</p>
                  </div>
                ))}
              </div>
            )}

            {notificationBrief && (
              <div className="notification-brief-container">
                <button onClick={() => setIsBriefVisible(!isBriefVisible)}>
                  {isBriefVisible ? "Hide Brief" : "Show Brief"}
                </button>

                {isBriefVisible && (
                  <div className="notification-brief">
                    {isFollowUpLoading ? (
                      <div className="preloader-container">
                        <div className="spinner"></div>
                      </div>
                    ) : (
                      <div className="notification-content">
                        {formatNotificationBrief(notificationBrief)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

          </>
        )}
      </div>
      <div className="menu-icon" onClick={onOpenUserMenu}></div>
    </div>
  );
}
