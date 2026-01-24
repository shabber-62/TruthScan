import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  confidence: number;
  isReal: boolean;
  className?: string;
}

export const ConfidenceMeter = ({ confidence, isReal, className }: ConfidenceMeterProps) => {
  const getColor = () => {
    if (isReal) return "bg-primary";
    return "bg-neon-red";
  };

  const getGlowClass = () => {
    if (isReal) return "box-glow-green";
    return "box-glow-red";
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-mono text-muted-foreground">CONFIDENCE LEVEL</span>
        <span className={cn(
          "font-display font-bold text-lg",
          isReal ? "text-primary text-glow-green" : "text-neon-red text-glow-red"
        )}>
          {confidence.toFixed(1)}%
        </span>
      </div>
      
      <div className={cn("relative h-4 bg-muted rounded-full overflow-hidden", getGlowClass())}>
        {/* Background grid pattern */}
        <div className="absolute inset-0 opacity-20">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-foreground/20"
              style={{ left: `${i * 5}%` }}
            />
          ))}
        </div>
        
        {/* Progress bar */}
        <div
          className={cn(
            "h-full transition-all duration-1000 ease-out relative",
            getColor()
          )}
          style={{ width: `${confidence}%` }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/20 to-transparent animate-pulse" />
        </div>
      </div>
      
      {/* Tick marks */}
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
};
