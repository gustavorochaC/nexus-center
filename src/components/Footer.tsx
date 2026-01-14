import { Link } from "react-router-dom";
import { useSettingsModal } from "@/contexts/SettingsModalContext";

export function Footer() {
  const { isOpen } = useSettingsModal();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`fixed bottom-4 left-0 right-0 z-50 pointer-events-none transition-opacity duration-200 ${
      isOpen ? 'opacity-50' : ''
    }`}>
      <div className="container mx-auto px-4 pointer-events-auto">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-sm text-muted-foreground">
          <Link to="/dashboard" className="flex items-center gap-2 hover:text-foreground transition-colors">
            <img 
              src="/flexi-logo.png" 
              alt="Flexibase" 
              className="h-8 object-contain"
            />
          </Link>
          <span className="hidden sm:inline">•</span>
          <span>© {currentYear} Flexibase. Todos os direitos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
