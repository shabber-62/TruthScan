import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SettingsPanel } from "@/components/SettingsPanel";
import Index from "./pages/Index";
import TextDetection from "./pages/TextDetection";
import ImageDetection from "./pages/ImageDetection";
import LiveScan from "./pages/LiveScan";
import SocialMediaDetection from "./pages/SocialMediaDetection";
import AiAssistant from "./pages/AiAssistant";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/text-detection" element={<TextDetection />} />
            <Route path="/image-detection" element={<ImageDetection />} />
            <Route path="/live-scan" element={<LiveScan />} />
            <Route path="/social-media" element={<SocialMediaDetection />} />
            <Route path="/ai-mode" element={<AiAssistant />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <SettingsPanel />
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
