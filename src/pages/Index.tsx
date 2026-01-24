import { FileText, Image, Camera, MessageCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { FeatureCard } from "@/components/FeatureCard";
import { StatusIndicator } from "@/components/StatusIndicator";

const Index = () => {
  return (
    <div className="min-h-screen bg-background cyber-grid">
      {/* Fixed scanline overlay */}
      <div className="fixed inset-0 scanline pointer-events-none z-50 opacity-20" />
      
      <Header />

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary font-mono text-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            SYSTEM ONLINE
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-bold text-primary text-glow-green tracking-wider">
            FAKE NEWS DETECTOR
          </h1>
          
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto text-lg">
            Advanced AI-powered system to detect misinformation, manipulated images, 
            and social media trolls. Protect yourself from digital deception.
          </p>

          {/* Mobile status */}
          <div className="md:hidden flex justify-center">
            <StatusIndicator />
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <FeatureCard
            title="Text Analysis"
            description="Paste any news article or text content to verify its authenticity. Our AI analyzes linguistic patterns, fact-checks claims, and identifies potential misinformation."
            icon={<FileText className="w-8 h-8" />}
            to="/text-detection"
            variant="default"
            glowClass="text-glow-green"
            textGlowClass="text-primary"
          />

          <FeatureCard
            title="Image Detection"
            description="Upload images to detect manipulation, deepfakes, and AI-generated content. Advanced forensic analysis reveals hidden modifications."
            icon={<Image className="w-8 h-8" />}
            to="/image-detection"
            variant="cyan"
            glowClass="text-glow-cyan"
            textGlowClass="text-neon-cyan"
          />

          <FeatureCard
            title="Live Scan"
            description="Capture photos directly from your camera for real-time analysis. Instant verification of documents, screenshots, and media content."
            icon={<Camera className="w-8 h-8" />}
            to="/live-scan"
            variant="magenta"
            glowClass="text-glow-magenta"
            textGlowClass="text-neon-magenta"
          />

          <FeatureCard
            title="Social Media Troll"
            description="Analyze social media posts from Instagram, Twitter, and Facebook to detect trolls, bots, and coordinated misinformation campaigns."
            icon={<MessageCircle className="w-8 h-8" />}
            to="/social-media"
            variant="red"
            glowClass="text-glow-red"
            textGlowClass="text-neon-red"
          />
        </div>

        {/* Terminal-style footer */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-card/50 rounded-lg border border-border/50 p-4 font-mono text-sm">
            <div className="flex items-center gap-2 mb-2 text-muted-foreground">
              <span className="text-primary">$</span>
              <span className="animate-typing">system.status --check-all</span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div><span className="text-primary">[OK]</span> AI Detection Engine: ACTIVE</div>
              <div><span className="text-primary">[OK]</span> Image Analysis Module: LOADED</div>
              <div><span className="text-primary">[OK]</span> NLP Processing Unit: READY</div>
              <div><span className="text-primary">[OK]</span> Social Media Scanner: STANDBY</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
