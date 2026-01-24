import { Link } from "react-router-dom";
import { Shield, ArrowLeft } from "lucide-react";
import { StatusIndicator } from "./StatusIndicator";
import { cn } from "@/lib/utils";

interface HeaderProps {
  showBack?: boolean;
  backTo?: string;
}

export const Header = ({ showBack = false, backTo = "/" }: HeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {showBack && (
              <Link
                to={backTo}
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-mono text-sm hidden sm:inline">BACK</span>
              </Link>
            )}
            
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2 rounded-lg bg-primary/20 border border-primary/30 group-hover:box-glow-green transition-all duration-300">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-primary text-glow-green tracking-wider">
                  TRUTHSCAN
                </h1>
                <p className="text-xs text-muted-foreground font-mono hidden sm:block">
                  AI-POWERED FAKE NEWS DETECTION
                </p>
              </div>
            </Link>
          </div>

          {/* Right side - Status */}
          <div className="hidden md:block">
            <StatusIndicator />
          </div>
        </div>
      </div>
    </header>
  );
};
