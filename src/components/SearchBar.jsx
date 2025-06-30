import React, { useState, useRef, useEffect } from "react";  // ✅ Import useEffect
import "../styles/searchbar.css";
import searchIcon from "/images/icon-search.svg" with { type: "svg" };
import bubblesIcon from "/images/icon-bubbles.svg" with { type: "svg" };
import bubblesIconHover from "/images/icon-bubbles-hover.svg";
import listIcon from "/images/icon-list.svg" with { type: "svg" };
import leafIcon from "/images/icon-leaf.svg" with { type: "svg" };

export default function SearchBar({ isLoggedIn, onOpenControlCenter, onOpenUserMenu, isControlCenterOpen }) {
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
  const [followUpHtml, setFollowUpHtml] = useState(""); // ✅ Store HTML follow-up
  const [searchHistory, setSearchHistory] = useState([]); // ⬅️ add this
  const [initialSearchBlock, setInitialSearchBlock] = useState(null);




  
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
    setFollowUpHtml(""); // ✅ Clear follow-up brief

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
  setAiSummary("");
  setSearchIntent("");
  setShowBrief(false); // hide any old brief by default

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery }),
    });

    const data = await response.json();

    console.log("📩 API Response:", data);

    if (data.intent) setSearchIntent(data.intent);
    if (data.showBrief) setShowBrief(true);

    const resultBlock = {
      query: searchQuery,
      intent: data.intent,
      documents: data.documents || [],
      aiSummary: data.aiSummary,
      notificationBrief: data.notificationBrief,
    };

    setInitialSearchBlock(resultBlock);
    setFollowUpResults([]);

    // ✅ Append to history
    setSearchHistory([ resultBlock ]);

    // Still update latest visible results if needed
    setAdditionalResults(data.documents || []);
    if (data.notificationBrief && data.notificationBrief !== "No notification brief available.")
      setNotificationBrief(data.notificationBrief);
    if (data.aiSummary && data.aiSummary !== "No AI summary available.")
      setAiSummary(data.aiSummary);

    // AI message (optional for first result only)
    if (data.intent !== "General Question") {
      //const aiMessage = await generateSearchMessage(searchQuery, data.documents.length);
      //setSearchMessage(aiMessage);
    }
  } catch (error) {
    console.error("❌ Search Error:", error);
    setSearchMessage("⚠️ Something went wrong while searching.");
  } finally {
    setIsLoading(false);
  }
};
  

  const handleFollowUpSearch = async (searchQuery) => {
  if (searchQuery.trim() === "") return;

  setFollowUpQuery(""); // Clear input
  setIsFollowUpLoading(true);
  setFollowUpHtml(""); // Clear previous follow-up
  setFollowUpResults([]); // Clear previous follow-up results

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: searchQuery }),
    });

    const data = await response.json();

    console.log("📩 Follow-Up API Response:", data);

    // build a follow-up block
const followUpBlock = {
  query: searchQuery,
  intent: data.intent,
  documents: data.documents || [],
  notificationBrief: data.notificationBrief,
  aiSummary: data.aiSummary,
  // if it’s a General Question, the AI answer is in documents[0].content
  html:
    data.intent === "General Question"
      ? data.documents?.[0]?.content || ""
      : // otherwise prefer aiSummary, then notificationBrief (if non-default)
      data.aiSummary ||
        (data.notificationBrief &&
          data.notificationBrief !== "No notification brief available."
          ? data.notificationBrief
          : "")
};


// append it to your history array
setSearchHistory(prev => [...prev, followUpBlock]);

  } catch (error) {
    console.error("❌ Follow-up error:", error);
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
      <div
        className={`cc-icon${showCCIcon ? " visible" : ""}${!isLoggedIn ? " disabled" : ""}`}
        onClick={isLoggedIn ? onOpenControlCenter : undefined}
      />

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
              <img src={searchIcon} alt="Search" className="search-button" onClick={() => handleSearch(query)} />
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
                    {searchHistory.length > 0 ? (
                      <>
                        {/* … initial-results code above … */}

                        {/* render the summary */}
                        {(() => {
                          const brief = searchHistory[0].notificationBrief;
                          const html  = searchHistory[0].aiSummary;
                          const hasRealBrief = brief && brief !== "No notification brief available.";
                          const toShow = hasRealBrief ? brief : html;
                          const cls    = hasRealBrief ? "cmb2" : "cmb1";
                          return toShow ? (
                            <div
                              className={`notification-brief ${cls}`}
                              dangerouslySetInnerHTML={{ __html: toShow }}
                            />
                          ) : null;
                        })()}

                        {/* … follow-up input + follow-up-blocks … */}
                      </>
                    ) : (
                      <p className="no-results">No search results found.</p>
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
  <>
    {/* Follow-Up Input */}
    <div className="follow-up-search">
      <form
        className="search-bar follow-up"
        style={{ width: `${inputWidth}px`, maxWidth: "80%" }}
        onSubmit={e => {
          e.preventDefault();
          handleFollowUpSearch(followUpQuery);
        }}
      >
        <textarea
          ref={followUpInputRef}
          placeholder="Ask a follow-up question..."
          value={followUpQuery}
          onChange={e => setFollowUpQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          <img src={searchIcon} alt="Search" />
        </button>
      </form>
      {isFollowUpLoading && (
        <div className="preloader-container">
          <div className="spinner" />
        </div>
      )}
    </div>

    {/* Render each appended follow-up answer */}
    {searchHistory.slice(1).map((block, idx) => {
  return (
    <div key={idx} className="follow-up-block">
      <h4>Answer to: “{block.query}”</h4>

      {/* Document links */}
      {block.documents.length > 0 && (
        <div className="follow-up-results">
          {block.documents.map((doc, i) => (
            <div key={i} className="search-result-item">
              {doc.link ? (
                <a href={doc.link} target="_blank" rel="noopener noreferrer">
                  {doc.title}
                </a>
              ) : (
                <span>{doc.title}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* HTML summary, preferring aiSummary */}
      {block.html && (
  <div
    className="notification-brief follow-up-summary"
    dangerouslySetInnerHTML={{ __html: block.html }}
  />
)}

      {/* Nested follow-up bar */}
      <div className="follow-up-search nested">
        <form
          className="search-bar follow-up"
          style={{ width: `${inputWidth}px`, maxWidth: "80%" }}
          onSubmit={(e) => {
            e.preventDefault();
            handleFollowUpSearch(followUpQuery);
          }}
        >
          <textarea
            ref={followUpInputRef}
            placeholder="Ask another follow-up…"
            value={followUpQuery}
            onChange={(e) => setFollowUpQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-button">
            <img src={searchIcon} alt="Search" />
          </button>
        </form>
        {isFollowUpLoading && (
          <div className="preloader-container">
            <div className="spinner" />
          </div>
        )}
      </div>
    </div>
  );
})}

  </>
)}

            {/* ✅ Show AI Summary if it was generated by a follow-up query */}
            {followUpQuery && aiSummary && searchIntent === "General Question" && (
              <div className="notification-brief follow-up-summary">
                <div dangerouslySetInnerHTML={{ __html: aiSummary }} />
              </div>
            )}

          </>
        )}
      </div>
      <div
        className={`menu-icon${showMenuIcon ? " visible" : ""}${!isLoggedIn ? " disabled" : ""}`}
        onClick={isLoggedIn ? onOpenUserMenu : undefined}
      />
    </div>
  );
}
