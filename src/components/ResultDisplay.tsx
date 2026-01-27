import { CheckCircle, XCircle, Download, AlertTriangle, BookOpen, ExternalLink, HelpCircle } from "lucide-react";
import { CyberCard } from "@/components/ui/cyber-card";
import { CyberButton } from "@/components/ui/cyber-button";
import { ConfidenceMeter } from "./ConfidenceMeter";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface SourceInfo {
  name: string;
  url: string;
  type: "fact-check" | "news" | "database" | "web" | "official";
  contribution: number;
}

interface ResultDisplayProps {
  isReal: boolean;
  confidence: number;
  reason: string;
  reasonPoints?: string[];
  sources?: string | SourceInfo[];
  verdict?: "REAL" | "FAKE" | "MISLEADING" | "UNVERIFIED";
  onDownloadReport: () => void;
  category?: string;
}

const getSourceTypeLabel = (type: string, t: any): string => {
  switch (type) {
    case "fact-check": return t.factCheck;
    case "news": return t.news;
    case "database": return t.database;
    case "web": return t.web;
    case "official": return t.official;
    default: return type;
  }
};

const getSourceTypeColor = (type: string): string => {
  switch (type) {
    case "fact-check": return "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/30";
    case "news": return "text-blue-400 bg-blue-400/10 border-blue-400/30";
    case "database": return "text-purple-400 bg-purple-400/10 border-purple-400/30";
    case "official": return "text-primary bg-primary/10 border-primary/30";
    default: return "text-muted-foreground bg-muted/10 border-border/30";
  }
};

export const ResultDisplay = ({
  isReal,
  confidence,
  reason,
  reasonPoints,
  sources,
  verdict,
  onDownloadReport,
  category = "NEWS",
}: ResultDisplayProps) => {
  const { t } = useLanguage();

  const getVerdictDisplay = () => {
    switch (verdict) {
      case "REAL": return { text: t.verifiedReal, color: "text-primary text-glow-green" };
      case "FAKE": return { text: t.fakeDetected, color: "text-neon-red text-glow-red" };
      case "MISLEADING": return { text: t.misleadingDetected, color: "text-yellow-400" };
      case "UNVERIFIED": return { text: t.unverified, color: "text-orange-400" };
      default: return isReal 
        ? { text: t.verifiedReal, color: "text-primary text-glow-green" }
        : { text: t.fakeDetected, color: "text-neon-red text-glow-red" };
    }
  };

  const verdictDisplay = getVerdictDisplay();
  const isPositive = verdict === "REAL" || (isReal && !verdict);

  // Parse sources - handle both string and array formats
  const parsedSources: SourceInfo[] = (() => {
    if (!sources) return [];
    if (typeof sources === "string") {
      // Legacy string format - convert to structured
      return [{
        name: sources,
        url: "#",
        type: "web" as const,
        contribution: 100
      }];
    }
    return sources;
  })();

  return (
    <CyberCard variant={isPositive ? "success" : "danger"} size="lg" className="space-y-6">
      {/* Status Header */}
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "p-3 rounded-full",
            isPositive ? "bg-primary/20" : "bg-neon-red/20"
          )}
        >
          {isPositive ? (
            <CheckCircle className="w-8 h-8 text-primary animate-pulse-glow" />
          ) : verdict === "MISLEADING" ? (
            <AlertTriangle className="w-8 h-8 text-yellow-400 animate-pulse-glow" />
          ) : verdict === "UNVERIFIED" ? (
            <HelpCircle className="w-8 h-8 text-orange-400 animate-pulse-glow" />
          ) : (
            <XCircle className="w-8 h-8 text-neon-red animate-pulse-glow" />
          )}
        </div>
        <div>
          <div className={cn("font-display text-3xl font-bold uppercase tracking-wider", verdictDisplay.color)}>
            {verdictDisplay.text}
          </div>
          <div className="text-muted-foreground font-mono text-sm">
            {category} {t.analysisComplete}
          </div>
        </div>
      </div>

      {/* Confidence Meter */}
      <ConfidenceMeter confidence={confidence} isReal={isPositive} />

      {/* Reason Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
          <AlertTriangle className="w-4 h-4" />
          {t.reason}
        </div>
        <div className="text-xs text-muted-foreground/70 font-mono">
          {t.reasonExplanation} {verdictDisplay.text}
        </div>
        
        {/* Main reason summary */}
        <div
          className={cn(
            "p-4 rounded-lg border font-mono text-sm leading-relaxed",
            isPositive
              ? "bg-primary/5 border-primary/30 text-foreground"
              : "bg-neon-red/5 border-neon-red/30 text-foreground"
          )}
        >
          {reason}
        </div>

        {/* Bullet point reasons */}
        {reasonPoints && reasonPoints.length > 0 && (
          <ul className="space-y-2 pl-4">
            {reasonPoints.map((point, index) => (
              <li
                key={index}
                className={cn(
                  "flex items-start gap-2 font-mono text-sm",
                  isPositive ? "text-foreground" : "text-foreground"
                )}
              >
                <span className={cn(
                  "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5",
                  isPositive ? "bg-primary/20 text-primary" : "bg-neon-red/20 text-neon-red"
                )}>
                  {index + 1}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Sources Section */}
      {parsedSources.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            {t.sources}
          </div>
          <div className="text-xs text-muted-foreground/70 font-mono">
            {t.sourcesExplanation}
          </div>
          
          <div className="grid gap-2">
            {parsedSources.map((source, index) => (
              <div
                key={index}
                className={cn(
                  "p-3 rounded-lg border flex items-center justify-between gap-3",
                  isPositive
                    ? "bg-primary/5 border-primary/20"
                    : "bg-neon-red/5 border-neon-red/20"
                )}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Source Name */}
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium text-foreground truncate">
                      {source.name}
                    </div>
                    {source.url && source.url !== "#" && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "font-mono text-xs hover:underline flex items-center gap-1",
                          isPositive ? "text-primary" : "text-neon-red"
                        )}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {source.url.replace(/^https?:\/\//, "").split("/")[0]}
                      </a>
                    )}
                  </div>

                  {/* Source Type Badge */}
                  <span className={cn(
                    "px-2 py-0.5 rounded text-xs font-mono border",
                    getSourceTypeColor(source.type)
                  )}>
                    {getSourceTypeLabel(source.type, t)}
                  </span>
                </div>

                {/* Contribution */}
                <div className="text-right flex-shrink-0">
                  <div className={cn(
                    "font-display text-lg font-bold",
                    isPositive ? "text-primary" : "text-neon-red"
                  )}>
                    {source.contribution}%
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {t.contribution}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Download Report Button */}
      <CyberButton
        variant={isPositive ? "default" : "destructive"}
        onClick={onDownloadReport}
        className="w-full"
      >
        <Download className="w-4 h-4" />
        {t.downloadReport}
      </CyberButton>
    </CyberCard>
  );
};
