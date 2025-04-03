import React from 'react';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Heights Token Interface</p>
        <div className="footer-links">
          <a 
            href="https://github.com/your-repo/heights-token"
            target="_blank" 
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              window.open('https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS', '_blank');
            }}
          >
            Contract
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;