import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CyberCard } from "@/components/ui/cyber-card";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  to: string;
  variant?: "default" | "cyan" | "magenta" | "red";
  glowClass?: string;
  textGlowClass?: string;
}

export const FeatureCard = ({
  title,
  description,
  icon,
  to,
  variant = "default",
  glowClass = "text-glow-green",
  textGlowClass = "text-primary",
}: FeatureCardProps) => {
  return (
    <Link to={to} className="block group">
      <CyberCard
        variant={variant}
        className="h-full cursor-pointer transform transition-transform duration-300 hover:scale-[1.02] hover:-translate-y-1"
      >
        {/* Icon */}
        <div
          className={cn(
            "w-16 h-16 rounded-lg flex items-center justify-center mb-4 transition-all duration-300",
            "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30",
            "group-hover:from-primary/30 group-hover:to-primary/10"
          )}
        >
          <div className={cn("text-primary transition-transform duration-300 group-hover:scale-110", glowClass)}>
            {icon}
          </div>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "font-display text-xl font-bold uppercase tracking-wide mb-2 transition-all duration-300",
            textGlowClass,
            "group-hover:" + glowClass
          )}
        >
          {title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm font-mono leading-relaxed mb-4">
          {description}
        </p>

        {/* Arrow indicator */}
        <div className="flex items-center gap-2 text-primary font-mono text-sm group-hover:gap-4 transition-all duration-300">
          <span>SCAN NOW</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </CyberCard>
    </Link>
  );
};
