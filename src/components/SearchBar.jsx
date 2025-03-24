import React, { useState, useRef, useEffect } from "react";  // ✅ Import useEffect
import "../styles/searchbar.css";
import searchIcon from "/images/icon-search.svg" with { type: "svg" };
import bubblesIcon from "/images/icon-bubbles.svg" with { type: "svg" };
import bubblesIconHover from "/images/icon-bubbles-hover.svg";
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
  const [showCCIcon, setShowCCIcon] = useState(false);
  const [showMenuIcon, setShowMenuIcon] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [aiSummary, setAiSummary] = useState(""); // ✅ Add this line
  const [searchIntent, setSearchIntent] = useState(""); // Track search intent
  const [showBrief, setShowBrief] = useState(false);



  
  const circleContainerRef = useRef(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const followUpInputRef = useRef(null);

  const inputRef = useRef(null); // ✅ Create a reference for the input field

  const isLocal = window.location.hostname === "localhost"; // Determines if running locally
  const apiUrl = isLocal
  ? "http://localhost:3001/api/search"
  : "http://15.223.63.70:3001/api/search";

  useEffect(() => {
    setTimeout(() => {
      setShowCCIcon(true);  // ✅ Trigger CC icon animation
    }, 100);

    setTimeout(() => {
      setShowMenuIcon(true);  // ✅ Trigger menu icon animation
    }, 200);  // Slight delay for a staggered effect

    // ✅ Auto-focus the search input when the page loads
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);


  const handleInputChange = (event) => {
    const text = event.target.value;
    setQuery(text);
    setAdditionalResults([]);
    setSearchMessage("");
    setNotificationBrief(null); // ✅ Clear AI summary results
    setFollowUpQuery(""); // ✅ Clear the follow-up input field

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

  const generateSearchMessage = async (query, count) => {
    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=YOUR_GEMINI_API_KEY",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Generate a concise, engaging search result message based on:
                      - Search Query: "${query}"
                      - Number of Results: ${count}
                      - If no results, generate a message like "No matching results found. Try refining your search."
                      - If AI provided an answer, say "AI Answer provided."`
                  },
                ],
              },
            ],
          }),
        }
      );
  
      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || `${count} results found for "${query}".`;
    } catch (error) {
      console.error("❌ Error generating AI search message:", error);
      return `${count} results found for "${query}".`; // Fallback message
    }
  };
  
  
  

  const handleSearch = async (searchQuery) => {
    if (searchQuery.trim() === "") return;
  
    setIsLoading(true);
    setSearchMessage(""); 
    setNotificationBrief(null);
    setAiSummary("");  // ✅ Reset AI Summary before new search
    setSearchIntent(""); // ✅ Reset intent before making a new search
    
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
  
      if (!response.ok) {
        console.error("❌ API Response Error:", response.status, response.statusText);
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
  
      let data;
      try {
        data = await response.json(); 
      } catch (jsonError) {
        console.error("❌ JSON Parsing Error:", jsonError);
        throw new Error("Invalid JSON response from server.");
      }
  
      console.log("📩 API Response:", data);

      // ✅ Store detected search intent
      if (data.intent) {
        setSearchIntent(data.intent);
      }

      if (data.showBrief) {
        setShowBrief(true);
      } else {
        setShowBrief(false);
      }
  
      // ✅ Store documents
      if (data.documents && Array.isArray(data.documents)) {
        setAdditionalResults(data.documents);
      } else {
        setAdditionalResults([]);
      }
  
      // ✅ Store AI Summary
      if (data.aiSummary && data.aiSummary !== "No AI summary available.") {
        setAiSummary(data.aiSummary);
      }

      if (data.notificationBrief && data.notificationBrief !== "No notification brief available.") {
        setNotificationBrief(data.notificationBrief);
        setIsBriefVisible(true); // show by default
      }
  
      // ✅ Generate Search Message only if NOT "General Question"
      if (data.intent !== "General Question") {
        try {
          const aiMessage = await generateSearchMessageWithGemini(searchQuery, data.documents.length);
          setSearchMessage(aiMessage);
        } catch (aiError) {
          console.warn("⚠️ AI Message Generation Failed:", aiError);
          setSearchMessage(`Found ${data.documents.length} results for "${searchQuery}".`);
        }
      }
  
    } catch (error) {
      console.error("❌ Search Error:", error);
      setSearchMessage("⚠️ Something went wrong while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleFollowUpSearch = async (searchQuery) => {
    if (searchQuery.trim() === "") return;
  
    setIsFollowUpLoading(true);
    setNotificationBrief(null);
  
    console.log("🔍 Follow-Up Query:", searchQuery);
    console.log("📜 Sending Previous Results:", additionalResults);
  
    try {
      const response = await fetch("http://15.223.63.70:3001/api/notification-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, previousResults: additionalResults }),
      });

      // const response = await fetch("http://localhost:3001/api/notification-brief", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ query: searchQuery, previousResults: additionalResults }),
      // });
  
      const data = await response.json();
  
      console.log("📩 API Response:", data);
      
  
      if (response.ok && data.notificationBrief) {
        setNotificationBrief(data.notificationBrief);
        setIsBriefVisible(true);
      } else {
        setNotificationBrief("No relevant results found. Try rephrasing your question.");
      }
    } catch (error) {
      console.error("❌ Error fetching follow-up search results:", error);
      setNotificationBrief("Error retrieving follow-up results. Please try again.");
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
  
    const regex = /\*\*(.*?)\*\*/g;
    const matches = [...briefText.matchAll(regex)];
  
    const formattedSections = [];
  
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      const heading = currentMatch[1]?.trim();
  
      const contentStart = currentMatch.index + currentMatch[0].length;
      const contentEnd = i + 1 < matches.length ? matches[i + 1].index : briefText.length;
  
      const content = briefText.substring(contentStart, contentEnd).trim();
  
      formattedSections.push(
        <div key={i} className="notification-section">
          <h3>{heading}</h3>
          <p>{content}</p>
        </div>
      );
    }
  
    return formattedSections;
  };
  
  
  

  return (
    <div className="searchbar-container">
      <div className={`cc-icon ${showCCIcon ? "visible" : ""}`} onClick={onOpenControlCenter}></div>
      <div className="searchbar-wrapper">
        {!isControlCenterOpen && (
          <>
            <form className="search-bar" style={{ width: `${inputWidth}px`, maxWidth: "80%" }}>
              <textarea
                ref={inputRef}
                placeholder="Welcome. Search and you will find"
                value={query}
                onChange={handleInputChange}
                className="search-input"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault(); // Prevent new line
                    handleSearch(query, setAdditionalResults, setIsLoading);
                  }
                }}
              />
              <img src={searchIcon} alt="Search" className="search-button" onClick={() => handleSearch(query, setAdditionalResults, setIsLoading)} />
            </form>

            {isLoading && <div className="preloader-container"><div className="spinner"></div></div>}

            {searchMessage && searchIntent !== "General Question" && (
              <div className="search-message">
                <p>{searchMessage}</p>
              </div>
            )}

            {additionalResults.length > 0 && (
              <div className="additional-results">
                <div className="results-tabs">
                  {/* Bubbles Tab */}
                  <button
                    className={`tab-button ${activeTab === "circles" ? "active" : ""}`}
                    onClick={() => setActiveTab("circles")}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <div className="tab-icon-wrapper bubbles">
                      <div className={`tab-icon bubbles-off ${isHovered || activeTab === "circles" ? "hidden" : ""}`}></div>
                      <div className={`tab-icon bubbles-hover ${isHovered || activeTab === "circles" ? "visible" : ""}`}></div>
                    </div>
                  </button>

                  {/* List Tab */}
                  <button
                    className={`tab-button ${activeTab === "list" ? "active" : ""}`}
                    onClick={() => setActiveTab("list")}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <div className="tab-icon-wrapper list">
                      <div className={`tab-icon list-off ${isHovered || activeTab === "list" ? "hidden" : ""}`}></div>
                      <div className={`tab-icon list-hover ${isHovered || activeTab === "list" ? "visible" : ""}`}></div>
                    </div>
                  </button>



                </div>

                {activeTab === "list" && (
                  <div className="search-results">
                    {/* ✅ Ensure we have results before rendering */}
                    {additionalResults.length > 0 ? (
                      additionalResults.map((doc, index) => (
                        <div key={index} className="search-result-item">
                          {/* ✅ Display AI Response for General Questions */}
                          {doc.id === "ai-answer" ? (
                            <div className="ai-answer" dangerouslySetInnerHTML={{ __html: doc.content }} />
                          ) : (
                            /* ✅ Display document search results */
                            <p>
                              {doc.link ? (
                                <a href={doc.link} target="_blank" rel="noopener noreferrer" className="search-title-link">
                                  {doc.title}
                                </a>
                              ) : (
                                <span>{doc.title}</span>
                              )}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      /* ✅ Display message if no results are found */
                      <p className="no-results">No search results found.</p>
                    )}

                    {/* ✅ Display AI Summary if it's available */}
                    {showBrief && notificationBrief && searchIntent === "Combination of Both" ? (
                      <div className="notification-brief cmb2">
                        <div className="notification-content">{formatNotificationBrief(notificationBrief)}</div>
                      </div>
                    ) : (
                      aiSummary && aiSummary.trim() !== "" && (
                        <div
                          className={`notification-brief cmb1 ${searchIntent === "General Question" ? "html-format" : ""}`}
                          dangerouslySetInnerHTML={{ __html: aiSummary }}
                        />
                      )
                    )}


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
                        <span className="search-tag">CANADA.CA</span>
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
                    onClick={() => handleFollowUpSearch(followUpQuery, setFollowUpResults, setIsFollowUpLoading, additionalResults)}
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

            

          </>
        )}
      </div>
      <div className={`menu-icon ${showMenuIcon ? "visible" : ""}`} onClick={onOpenUserMenu}></div>
    </div>
  );
}
