import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cyberButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium font-display uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 box-glow-green border border-primary/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 box-glow-magenta border border-secondary/50",
        outline:
          "border-2 border-primary bg-transparent text-primary hover:bg-primary/10 hover:box-glow-green",
        ghost:
          "text-primary hover:bg-primary/10 hover:text-primary",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 box-glow-red border border-destructive/50",
        cyan:
          "bg-neon-cyan text-background hover:bg-neon-cyan/90 box-glow-cyan border border-neon-cyan/50",
      },
      size: {
        default: "h-11 px-6 py-2 rounded-md",
        sm: "h-9 rounded-md px-4",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface CyberButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof cyberButtonVariants> {
  asChild?: boolean;
}

const CyberButton = React.forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(cyberButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
CyberButton.displayName = "CyberButton";

export { CyberButton, cyberButtonVariants };
