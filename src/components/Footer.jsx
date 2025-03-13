import React from "react";
import "../styles/footer.css"; // Import styles

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="/privacy-policy" className="footer-link">Privacy Policy</a>
        <a href="/terms-of-service" className="footer-link">Terms of Service</a>
        <a href="/ethics-policy" className="footer-link">Ethics Policy</a>
      </div>
      <div className="footer-icons">
        <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-icon linkedin"></a>
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-icon x-icon"></a>
      </div>
    </footer>
  );
}
