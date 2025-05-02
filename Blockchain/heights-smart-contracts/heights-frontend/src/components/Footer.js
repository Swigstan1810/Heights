import React from 'react';

function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} Heights Token Interface</p>
        <div className="footer-links">
          <a 
            href="https://github.com/Swigstan1810/Heights"
            target="_blank" 
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <a 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              window.open('https://sepolia.etherscan.io/address/0x51cDdeBb33814F660415dF040Afd6d6124670682', '_blank');
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