import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cyberCardVariants = cva(
  "relative overflow-hidden rounded-lg border transition-all duration-300",
  {
    variants: {
      variant: {
        default:
          "bg-card border-border/50 hover:border-primary/50 hover:box-glow-green",
        cyan: "bg-card border-neon-cyan/30 hover:border-neon-cyan/70 hover:box-glow-cyan",
        magenta:
          "bg-card border-neon-magenta/30 hover:border-neon-magenta/70 hover:box-glow-magenta",
        red: "bg-card border-neon-red/30 hover:border-neon-red/70 hover:box-glow-red",
        success:
          "bg-card border-primary/50 box-glow-green",
        danger:
          "bg-card border-neon-red/50 box-glow-red",
      },
      size: {
        default: "p-6",
        lg: "p-8",
        sm: "p-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CyberCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cyberCardVariants> {
  glowColor?: "green" | "cyan" | "magenta" | "red";
}

const CyberCard = React.forwardRef<HTMLDivElement, CyberCardProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(cyberCardVariants({ variant, size, className }))}
        {...props}
      >
        {/* Scanline overlay */}
        <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
        
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50" />
      </div>
    );
  }
);
CyberCard.displayName = "CyberCard";

export { CyberCard, cyberCardVariants };
