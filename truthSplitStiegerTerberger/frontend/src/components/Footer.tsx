import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Truth<span className="text-primary">Split</span></h3>
            <p className="text-sm text-muted-foreground">
              Analyze arguments through multiple philosophical perspectives.
            </p>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Product</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link 
                  to="/analyze" 
                  className="hover:text-foreground transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Start Analysis
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="hover:text-foreground transition-colors"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  About the Project
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Truth<span className="text-primary">Split</span>. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
