import { useEffect, useState } from "react";

interface LoadingScannerProps {
  text?: string;
}

export const LoadingScanner = ({ text = "ANALYZING..." }: LoadingScannerProps) => {
  const [dots, setDots] = useState("");
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    const progressInterval = setInterval(() => {
      setScanProgress((prev) => (prev >= 100 ? 0 : prev + Math.random() * 15));
    }, 200);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-6">
      {/* Scanning animation */}
      <div className="relative w-32 h-32">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
        
        {/* Middle ring */}
        <div className="absolute inset-2 rounded-full border-2 border-primary/50 animate-spin" style={{ animationDuration: "3s" }} />
        
        {/* Inner ring */}
        <div className="absolute inset-4 rounded-full border-2 border-primary animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-primary animate-pulse-glow" />
        </div>

        {/* Scan line */}
        <div 
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan"
          style={{ top: "50%" }}
        />
      </div>

      {/* Progress bar */}
      <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary via-neon-cyan to-primary transition-all duration-200"
          style={{ width: `${Math.min(scanProgress, 100)}%` }}
        />
      </div>

      {/* Text */}
      <div className="font-display text-primary text-glow-green text-lg">
        {text}{dots}
      </div>

      {/* Binary decoration */}
      <div className="text-xs text-muted-foreground font-mono opacity-50 overflow-hidden whitespace-nowrap animate-typing">
        01001000 01000001 01000011 01001011 01000101 01010010
      </div>
    </div>
  );
};
