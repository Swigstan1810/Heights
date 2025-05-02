export function Footer() {
  return (
    <footer className="bg-card/30 border-t border-border">
      <div className="max-w-7xl mx-auto py-12 px-4 md:px-8 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center">
              <svg viewBox="0 0 24 24" className="h-6 w-6 mr-2">
                <path
                  d="M4,12 L8,8 L12,12 L16,8 L20,12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4,16 L8,12 L12,16 L16,12 L20,16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-xl font-bold">Heights</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Elevate your trading experience with Heights, the next generation trading platform for global markets and cryptocurrency.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Products</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Crypto Trading</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Stock Trading</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Portfolio Management</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Market Insights</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Learning Center</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Market Analysis</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Documentation</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Press</a></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 Heights Trading. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}