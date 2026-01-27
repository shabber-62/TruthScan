import { useState } from "react";
import { Settings, X, Globe, RotateCcw, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const SettingsPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const handleResetHistory = () => {
    localStorage.removeItem("truthscan-history");
    toast.success(language === "en" ? "History cleared" : "చరిత్ర క్లియర్ చేయబడింది");
  };

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 p-3 rounded-full",
          "bg-muted/80 backdrop-blur-sm border border-border/50",
          "hover:bg-muted hover:border-primary/50 transition-all duration-300",
          "shadow-lg hover:shadow-primary/20"
        )}
        aria-label="Settings"
      >
        <Settings className="w-5 h-5 text-primary" />
      </button>

      {/* Settings Panel Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          <div className={cn(
            "relative w-full max-w-md",
            "bg-card border border-primary/30 rounded-lg",
            "shadow-2xl shadow-primary/10",
            "animate-in fade-in-0 zoom-in-95 duration-200"
          )}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h2 className="font-display text-xl font-bold text-primary tracking-wider">
                {t.settings}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                  <Globe className="w-4 h-4" />
                  {t.language}
                </label>
                <div className="flex gap-2">
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    onClick={() => setLanguage("en")}
                    className="flex-1 font-mono"
                  >
                    English
                  </Button>
                  <Button
                    variant={language === "te" ? "default" : "outline"}
                    onClick={() => setLanguage("te")}
                    className="flex-1 font-mono"
                  >
                    తెలుగు
                  </Button>
                </div>
              </div>

              {/* Reset History */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                  <RotateCcw className="w-4 h-4" />
                  {t.resetHistory}
                </label>
                <Button
                  variant="outline"
                  onClick={handleResetHistory}
                  className="w-full font-mono border-neon-red/30 text-neon-red hover:bg-neon-red/10"
                >
                  {t.resetHistory}
                </Button>
              </div>

              {/* About */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
                  <Info className="w-4 h-4" />
                  {t.aboutSystem}
                </label>
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-sm font-mono text-foreground leading-relaxed">
                    {t.aboutDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border/50">
              <Button
                onClick={() => setIsOpen(false)}
                className="w-full"
              >
                {t.close}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
