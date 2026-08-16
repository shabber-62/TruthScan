import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Header } from "@/components/Header";
import { CyberCard } from "@/components/ui/cyber-card";
import { CyberButton } from "@/components/ui/cyber-button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Trash2, Bot, User, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface Source { title: string; url: string; snippet: string }
interface ImageHit { url: string; thumbnail: string; sourceUrl: string; sourceDomain: string; title: string; }
interface ChatMessage { role: "user" | "assistant"; content: string; sources?: Source[]; images?: ImageHit[] }

const AiAssistant = () => {
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageHit | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const question = input.trim();
    if (!question || loading) return;

    const next: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          language,
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setMessages([...next, { role: "assistant", content: data.content, sources: data.sources, images: data.images }]);
    } catch (e) {
      console.error(e);
      toast.error(
        language === "en"
          ? "Failed to get an answer. Please try again."
          : "సమాధానం పొందడంలో విఫలమైంది. మళ్ళీ ప్రయత్నించండి.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid flex flex-col">
      <div className="fixed inset-0 scanline pointer-events-none z-50 opacity-20" />
      <Header showBack />

      <main className="container mx-auto px-4 py-6 max-w-3xl flex-1 flex flex-col">
        <div className="text-center mb-6">
          <h1 className="font-display text-3xl font-bold text-neon-cyan text-glow-cyan tracking-wider mb-2">
            AI MODE
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            {language === "en"
              ? "Ask anything — live web research for today's news, holidays, facts, and images"
              : "ఏదైనా అడగండి — నేటి వార్తలు, సెలవులు, వాస్తవాలు మరియు చిత్రాల కోసం లైవ్ వెబ్ పరిశోధన"}
          </p>
        </div>

        <div className="flex-1 space-y-4 mb-4">
          {messages.length === 0 && !loading && (
            <CyberCard size="lg">
              <div className="font-mono text-sm text-muted-foreground space-y-2">
                <p className="text-primary">$ assistant --ready</p>
                <p>{language === "en" ? "Try asking:" : "ఇలా అడగండి:"}</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Is today a public holiday in India?</li>
                  <li>What are today's top news headlines?</li>
                  <li>Show me photos of Hyderabad</li>
                </ul>
              </div>
            </CyberCard>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="shrink-0 p-2 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                  <Bot className="w-4 h-4 text-neon-cyan" />
                </div>
              )}
              <div
                className={`rounded-lg border p-4 max-w-[85%] ${
                  m.role === "user"
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card/60 border-border/50 w-full"
                }`}
              >
                {m.images && m.images.length > 0 && (
                  <div className="mb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {m.images.map((img, idx) => (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedImage(img)}
                        className="relative group overflow-hidden rounded-lg border border-border/50 block aspect-square bg-black/50 text-left"
                        title={img.title}
                      >
                        <img 
                          src={img.thumbnail || img.url} 
                          alt={img.title} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          onError={(e) => {
                            // If thumbnail fails, try original URL, otherwise hide the broken image
                            if (e.currentTarget.src !== img.url) {
                              e.currentTarget.src = img.url;
                            } else {
                              e.currentTarget.style.display = 'none';
                            }
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 px-2 text-[10px] text-neon-cyan truncate transform translate-y-full group-hover:translate-y-0 transition-transform">
                          {img.sourceDomain || 'View Image'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                <div className="prose prose-sm prose-invert max-w-none font-mono prose-headings:text-primary prose-a:text-neon-cyan">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                </div>

                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                    <p className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <Globe className="w-3 h-3" /> {language === "en" ? "Web sources" : "వెబ్ మూలాలు"}
                    </p>
                    {m.sources.slice(0, 5).map((s, idx) => (
                      <a
                        key={idx}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs font-mono text-neon-cyan hover:underline truncate"
                      >
                        {s.title || s.url}
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="shrink-0 p-2 h-9 rounded-lg bg-primary/10 border border-primary/30">
                  <User className="w-4 h-4 text-primary" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3 font-mono text-sm text-muted-foreground">
              <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                <Bot className="w-4 h-4 text-neon-cyan animate-pulse" />
              </div>
              <span className="animate-pulse">
                {language === "en" ? "Researching..." : "పరిశోధిస్తోంది..."}
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="sticky bottom-4">
          <CyberCard>
            <div className="flex gap-3 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder={language === "en" ? "Ask me anything..." : "నన్ను ఏదైనా అడగండి..."}
                className="min-h-[56px] max-h-40 bg-muted/50 border-border/50 font-mono resize-none focus:border-primary focus:ring-primary"
                disabled={loading}
              />
              <div className="flex flex-col gap-2">
                <CyberButton onClick={send} disabled={loading || !input.trim()}>
                  <Send className="w-4 h-4" />
                </CyberButton>
                <CyberButton
                  variant="outline"
                  onClick={() => setMessages([])}
                  disabled={loading || messages.length === 0}
                >
                  <Trash2 className="w-4 h-4" />
                </CyberButton>
              </div>
            </div>
          </CyberCard>
        </div>
      </main>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl flex justify-between items-center mb-4">
            <h3 className="text-neon-cyan font-mono truncate mr-4">
              {selectedImage.title}
            </h3>
            <button 
              onClick={() => setSelectedImage(null)}
              className="text-muted-foreground hover:text-white shrink-0 p-2"
            >
              Close
            </button>
          </div>
          
          <div className="relative w-full max-w-4xl max-h-[70vh] flex items-center justify-center bg-black/50 border border-border/50 rounded-lg overflow-hidden">
            <img 
              src={selectedImage.url} 
              alt={selectedImage.title} 
              className="max-w-full max-h-[70vh] object-contain"
              onError={(e) => {
                if (e.currentTarget.src !== selectedImage.thumbnail) {
                   e.currentTarget.src = selectedImage.thumbnail;
                }
              }}
            />
          </div>

          <div className="w-full max-w-4xl mt-4 flex justify-between items-center text-sm font-mono">
            <span className="text-muted-foreground">Source: {selectedImage.sourceDomain}</span>
            <a 
              href={selectedImage.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 border border-primary/50 rounded transition-colors flex items-center gap-2"
            >
              <Globe className="w-4 h-4" />
              View Original Source
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistant;
