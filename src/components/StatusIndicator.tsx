import { useEffect, useState } from "react";
import { Wifi, WifiOff, Bot, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusIndicatorProps {
  className?: string;
}

export const StatusIndicator = ({ className }: StatusIndicatorProps) => {
  const [backendStatus, setBackendStatus] = useState<"online" | "offline" | "checking">("checking");
  const [modelStatus, setModelStatus] = useState<"ready" | "loading" | "error">("ready");

  useEffect(() => {
    // Simulate backend check
    const checkBackend = async () => {
      try {
        // In a real app, you'd ping the backend
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setBackendStatus("online");
        setModelStatus("ready");
      } catch {
        setBackendStatus("offline");
        setModelStatus("error");
      }
    };

    checkBackend();

    // Re-check every 30 seconds
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Backend Status */}
      <div className="flex items-center gap-2">
        {backendStatus === "online" ? (
          <Wifi className="w-4 h-4 text-primary" />
        ) : backendStatus === "offline" ? (
          <WifiOff className="w-4 h-4 text-neon-red" />
        ) : (
          <Wifi className="w-4 h-4 text-muted-foreground animate-pulse" />
        )}
        <span
          className={cn(
            "text-xs font-mono uppercase",
            backendStatus === "online" && "text-primary",
            backendStatus === "offline" && "text-neon-red",
            backendStatus === "checking" && "text-muted-foreground"
          )}
        >
          {backendStatus === "online" && "BACKEND ONLINE"}
          {backendStatus === "offline" && "BACKEND OFFLINE"}
          {backendStatus === "checking" && "CHECKING..."}
        </span>
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            backendStatus === "online" && "bg-primary animate-pulse",
            backendStatus === "offline" && "bg-neon-red",
            backendStatus === "checking" && "bg-muted-foreground animate-pulse"
          )}
        />
      </div>

      <div className="w-px h-4 bg-border" />

      {/* Model Status */}
      <div className="flex items-center gap-2">
        {modelStatus === "ready" ? (
          <Bot className="w-4 h-4 text-primary" />
        ) : modelStatus === "error" ? (
          <AlertCircle className="w-4 h-4 text-neon-red" />
        ) : (
          <Bot className="w-4 h-4 text-muted-foreground animate-pulse" />
        )}
        <span
          className={cn(
            "text-xs font-mono uppercase",
            modelStatus === "ready" && "text-primary",
            modelStatus === "error" && "text-neon-red",
            modelStatus === "loading" && "text-muted-foreground"
          )}
        >
          {modelStatus === "ready" && "AI MODEL READY"}
          {modelStatus === "error" && "MODEL ERROR"}
          {modelStatus === "loading" && "LOADING MODEL..."}
        </span>
        <div
          className={cn(
            "w-2 h-2 rounded-full",
            modelStatus === "ready" && "bg-primary animate-pulse",
            modelStatus === "error" && "bg-neon-red",
            modelStatus === "loading" && "bg-muted-foreground animate-pulse"
          )}
        />
      </div>
    </div>
  );
};
