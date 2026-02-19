import React from 'react';

export default function Footer() {
  return (
    <footer className="app-footer">
      <p>
        &copy; 2026 <strong>Team ETS</strong> • Built for <span style={{color: 'var(--accent-primary)'}}>RIFT Hackathon</span>
      </p>
      <div className="footer-links">
        <span>Deepakmaseeh</span>
        <span>•</span>
        <span>Internal Tool</span>
      </div>
    </footer>
  );
}
