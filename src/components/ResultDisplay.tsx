import { CheckCircle, XCircle, Download, AlertTriangle, BookOpen } from "lucide-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { CyberButton } from "@/components/ui/cyber-button";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { cn } from "@/lib/utils";

interface ResultDisplayProps {
  isReal: boolean;
  confidence: number;
  reason: string;
  sources?: string;
  onDownloadReport: () => void;
  category?: string;
}

export const ResultDisplay = ({
  isReal,
  confidence,
  reason,
  sources,
  onDownloadReport,
  category = "NEWS",
}: ResultDisplayProps) => {
  return (
    <CyberCard variant={isReal ? "success" : "danger"} size="lg" className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "p-3 rounded-full",
            isReal ? "bg-primary/20" : "bg-neon-red/20"
          )}
        >
          {isReal ? (
            <CheckCircle className="w-8 h-8 text-primary animate-pulse-glow" />
          ) : (
            <XCircle className="w-8 h-8 text-neon-red animate-pulse-glow" />
          )}
        </div>
        <div>
          <div
            className={cn(
              "font-display text-3xl font-bold uppercase tracking-wider",
              isReal ? "text-primary text-glow-green" : "text-neon-red text-glow-red"
            )}
          >
            {isReal ? "VERIFIED REAL" : "FAKE DETECTED"}
          </div>
          <div className="text-muted-foreground font-mono text-sm">
            {category} ANALYSIS COMPLETE
          </div>
        </div>
      </div>

      {/* Confidence Meter */}
      <ConfidenceMeter confidence={confidence} isReal={isReal} />

      {/* Reason */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <AlertTriangle className="w-4 h-4" />
          ANALYSIS REASONING
        </div>
        <div
          className={cn(
            "p-4 rounded-lg border font-mono text-sm leading-relaxed",
            isReal
              ? "bg-primary/5 border-primary/30 text-foreground"
              : "bg-neon-red/5 border-neon-red/30 text-foreground"
          )}
        >
          {reason}
        </div>
      </div>

      {/* Sources */}
      {sources && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            VERIFICATION SOURCES
          </div>
          <div
            className={cn(
              "p-3 rounded-lg border font-mono text-xs",
              isReal
                ? "bg-primary/5 border-primary/20 text-primary"
                : "bg-neon-red/5 border-neon-red/20 text-neon-red"
            )}
          >
            {sources}
          </div>
        </div>
      )}

      {/* Download Report Button */}
      <CyberButton
        variant={isReal ? "default" : "destructive"}
        onClick={onDownloadReport}
        className="w-full"
      >
        <Download className="w-4 h-4" />
        DOWNLOAD REPORT
      </CyberButton>
    </CyberCard>
  );
};
