import React, { useState, useRef } from "react";
import "../styles/searchbar.css";
import searchIcon from "/images/icon-search.svg" with { type: "svg" };
import bubblesIcon from "/images/icon-bubbles.svg" with { type: "svg" };
import listIcon from "/images/icon-list.svg" with { type: "svg" };
import leafIcon from "/images/icon-leaf.svg" with { type: "svg" };

export default function SearchBar({ onOpenControlCenter, onOpenUserMenu, isControlCenterOpen }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [additionalResults, setAdditionalResults] = useState([]);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [followUpResults, setFollowUpResults] = useState([]);
  const [notificationBrief, setNotificationBrief] = useState(null);
  const [isBriefVisible, setIsBriefVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const inputRef = useRef(null);
  const followUpInputRef = useRef(null);
  const formRef = useRef(null);
  const [inputWidth, setInputWidth] = useState(650);

  const handleInputChange = (event) => {
    const text = event.target.value;
    setQuery(text);
    setResult("");
    setAdditionalResults([]);
    setSearchMessage("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
      inputRef.current.scrollTop = 0;
    }

    if (formRef.current && inputRef.current) {
      const measurer = document.createElement("span");
      measurer.className = "search-width-measurer";
      measurer.innerText = text || "W";
      document.body.appendChild(measurer);
      const newWidth = Math.min(measurer.offsetWidth + 60, window.innerWidth * 0.8);
      setInputWidth(newWidth);
      document.body.removeChild(measurer);
    }
  };

  const handleSearch = async (searchQuery, setResults, setLoading, previousResults = []) => {
    if (searchQuery.trim() === "") return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, previousResults }),
      });
      const data = await response.json();
      
      if (response.ok && data.documents.length > 0) {
        setResults([...previousResults, ...data.documents]);
        setSearchMessage(`${data.documents.length} results found for "${searchQuery}"`);
      } else {
        setResults([]); // Ensure previous results are cleared if none are found
        setSearchMessage(`No results matching "${searchQuery}". Please try rephrasing your search.`);
      }
    } catch (error) {
      setResults(previousResults);
      setSearchMessage("Error retrieving search results.");
    } finally {
      setLoading(false);
    }
  };
  

  const handleFollowUpSearch = async (searchQuery) => {
    if (searchQuery.trim() === "") return;
  
    setIsFollowUpLoading(true);  // ✅ Ensure preloader shows up
    setNotificationBrief(null);  // ✅ Clear previous results while loading
  
    const summaryKeywords = ["summarize", "explain", "overview", "brief", "highlight", "context", "details"];
    const isSummaryRequest = summaryKeywords.some(keyword => searchQuery.toLowerCase().includes(keyword));
  
    if (!isSummaryRequest) {
      setTimeout(() => {
        setNotificationBrief("No results found. Try rephrasing your follow-up query.");
        setIsFollowUpLoading(false);
      }, 1000);
      return;
    }
  
    try {
      const response = await fetch(`http://localhost:3001/api/notification-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, previousResults: additionalResults }),
      });
  
      const data = await response.json();
  
      setTimeout(() => {  // ✅ Simulating API response time for better UI feedback
        if (response.ok && data.notificationBrief) {
          setNotificationBrief(data.notificationBrief);
          setIsBriefVisible(true);
        } else {
          setNotificationBrief("No relevant results found. Try refining your follow-up question.");
        }
        setIsFollowUpLoading(false);
      }, 1500);  // ✅ Keep loading visible for a smooth UX
    } catch (error) {
      setNotificationBrief("Error retrieving follow-up results. Please try again.");
      setIsFollowUpLoading(false);
    }
  };
  
  
  
  
  

  const formatNotificationBrief = (briefText) => {
    if (!briefText || typeof briefText !== "string") return null;
  
    // Use regex to correctly extract sections that start with **
    const sections = briefText.split(/\*\*(.*?)\*\*/g).filter(section => section.trim() !== "");
  
    let formattedSections = [];
  
    for (let i = 0; i < sections.length; i += 2) {
      let heading = sections[i]?.trim();
      let content = sections[i + 1]?.trim() || "No content available."; // Default if no content
  
      if (heading && content) {
        formattedSections.push(
          <div key={i} className="notification-section">
            <h3>{heading}</h3>
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
            <form ref={formRef} className="search-bar" style={{ width: `${inputWidth}px`, maxWidth: "80%" }}>
              <textarea
                ref={inputRef}
                placeholder="Welcome. Search and you will find"
                value={query}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault(); // Prevent new line
                    handleSearch(query, setAdditionalResults, setIsLoading);
                  }
                }}
                className="search-input"
                rows="1"
              />

              <img src={searchIcon} alt="Search" className="search-button" onClick={() => handleSearch(query, setAdditionalResults, setIsLoading)} />
            </form>

            {isLoading && (
              <div className="preloader-container">
                <div className="spinner"></div>
              </div>
            )}

            {searchMessage && (
              <div className="search-results">
                <p className="search-message">{searchMessage}</p>
                {additionalResults.length > 0 ? (
                  additionalResults.map((doc) => (
                    <div key={doc.id} className="search-result-item">
                      <p>{doc.title}</p>
                    </div>
                  ))
                ) : null}
              </div>
            )}


            {additionalResults.length > 0 && (
              <div className="follow-up-search">
                <form className="search-bar follow-up" style={{ width: `${inputWidth}px`, maxWidth: "80%" }}>
                  <textarea
                    ref={followUpInputRef}
                    type="text"
                    placeholder="Ask a follow-up question..."
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); // Prevent new line
                        handleFollowUpSearch(followUpQuery);
                      }
                    }}
                    className="search-input"
                  />
                  <img
                    src={searchIcon}
                    alt="Search"
                    className="search-button"
                    onClick={() => handleFollowUpSearch(followUpQuery)}
                  />
                </form>

                {/* ✅ Preloader should be visible when follow-up search is running */}
                {isFollowUpLoading && (
                  <div className="preloader-container">
                    <div className="spinner"></div>
                  </div>
                )}
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
                        <div className="spinner"></div> {/* 🔄 Preloader */}
                      </div>
                    ) : (
                      formatNotificationBrief(notificationBrief)
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
