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
      
    </footer>
  );
}
