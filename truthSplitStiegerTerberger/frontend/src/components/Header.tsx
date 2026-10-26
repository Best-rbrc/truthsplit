import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Split } from "lucide-react";

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Split className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Truth<span className="text-primary">Split</span></span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <button 
            onClick={() => scrollToSection('hero')}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Home
          </button>
          <Link 
            to="/about"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About the Project
          </Link>
          <Link 
            to="/analyze?tutorial=true"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Tutorial
          </Link>
          <Link to="/analyze">
            <Button>Start Analysis</Button>
          </Link>
        </nav>

        <div className="md:hidden">
          <Link to="/analyze">
            <Button size="sm">Analyze</Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
