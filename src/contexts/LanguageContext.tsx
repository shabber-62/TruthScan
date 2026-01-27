import { createContext, useContext, useState, ReactNode } from "react";

type Language = "en" | "te";

interface Translations {
  // Common
  truthScan: string;
  aiDetection: string;
  detectFakeNews: string;
  checkNews: string;
  analyzing: string;
  downloadReport: string;
  clear: string;
  
  // Results
  verifiedReal: string;
  fakeDetected: string;
  misleadingDetected: string;
  unverified: string;
  analysisComplete: string;
  confidenceScore: string;
  
  // Sections
  reason: string;
  reasonExplanation: string;
  sources: string;
  sourcesExplanation: string;
  contribution: string;
  
  // Source Types
  factCheck: string;
  news: string;
  database: string;
  web: string;
  official: string;
  
  // Text Detection
  textAnalysis: string;
  enterTextToAnalyze: string;
  textPlaceholder: string;
  
  // Image Detection
  imageDetection: string;
  uploadImage: string;
  clickToUpload: string;
  contextOptional: string;
  contextPlaceholder: string;
  detectImage: string;
  scanningImage: string;
  
  // Social Media
  socialMediaTroll: string;
  detectTrolls: string;
  selectPlatform: string;
  pastePostContent: string;
  socialPlaceholder: string;
  detectTroll: string;
  scanningTroll: string;
  
  // Live Scan
  liveScan: string;
  captureContent: string;
  captureImage: string;
  retake: string;
  verifyImage: string;
  
  // Settings
  settings: string;
  language: string;
  resetHistory: string;
  aboutSystem: string;
  aboutDescription: string;
  close: string;
  
  // Navigation
  goBack: string;
  home: string;
  
  // Features
  textNews: string;
  textNewsDesc: string;
  imageVerify: string;
  imageVerifyDesc: string;
  liveCamera: string;
  liveCameraDesc: string;
  socialMedia: string;
  socialMediaDesc: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // Common
    truthScan: "TRUTHSCAN",
    aiDetection: "AI-POWERED FAKE NEWS DETECTION",
    detectFakeNews: "Detect fake news, manipulated images, and misinformation with advanced AI",
    checkNews: "CHECK NEWS",
    analyzing: "ANALYZING...",
    downloadReport: "DOWNLOAD REPORT",
    clear: "CLEAR",
    
    // Results
    verifiedReal: "VERIFIED REAL",
    fakeDetected: "FAKE DETECTED",
    misleadingDetected: "MISLEADING",
    unverified: "UNVERIFIED",
    analysisComplete: "ANALYSIS COMPLETE",
    confidenceScore: "Confidence Score",
    
    // Sections
    reason: "REASON",
    reasonExplanation: "Why this content is classified as",
    sources: "VERIFICATION SOURCES",
    sourcesExplanation: "Trusted sources used for verification",
    contribution: "contribution",
    
    // Source Types
    factCheck: "Fact-Check",
    news: "News",
    database: "Database",
    web: "Web",
    official: "Official",
    
    // Text Detection
    textAnalysis: "TEXT ANALYSIS",
    enterTextToAnalyze: "ENTER TEXT TO ANALYZE",
    textPlaceholder: "Paste the news article, social media post, or any text content you want to verify...",
    
    // Image Detection
    imageDetection: "IMAGE DETECTION",
    uploadImage: "Upload images to detect manipulation and deepfakes",
    clickToUpload: "Click to upload or drag and drop",
    contextOptional: "CONTEXT (OPTIONAL)",
    contextPlaceholder: "Provide any context about this image (e.g., claimed source, date, event)...",
    detectImage: "DETECT IMAGE",
    scanningImage: "SCANNING IMAGE FOR MANIPULATION",
    
    // Social Media
    socialMediaTroll: "SOCIAL MEDIA TROLL",
    detectTrolls: "Detect trolls, bots, and misinformation campaigns",
    selectPlatform: "SELECT PLATFORM",
    pastePostContent: "PASTE POST CONTENT",
    socialPlaceholder: "Paste the social media post, username, or URL you want to analyze for troll behavior...",
    detectTroll: "DETECT TROLL",
    scanningTroll: "SCANNING FOR TROLL ACTIVITY",
    
    // Live Scan
    liveScan: "LIVE SCAN",
    captureContent: "Capture and verify content in real-time",
    captureImage: "CAPTURE IMAGE",
    retake: "RETAKE",
    verifyImage: "VERIFY IMAGE",
    
    // Settings
    settings: "Settings",
    language: "Language",
    resetHistory: "Reset History",
    aboutSystem: "About System",
    aboutDescription: "TruthScan is a government-level fact-checking system powered by dual AI engines (Gemini + OpenAI) for accurate, source-backed verification.",
    close: "Close",
    
    // Navigation
    goBack: "Go Back",
    home: "Home",
    
    // Features
    textNews: "TEXT / NEWS",
    textNewsDesc: "Analyze articles and text for misinformation",
    imageVerify: "IMAGE VERIFY",
    imageVerifyDesc: "Detect manipulated or AI-generated images",
    liveCamera: "LIVE CAMERA",
    liveCameraDesc: "Real-time verification using camera",
    socialMedia: "SOCIAL MEDIA",
    socialMediaDesc: "Detect trolls and bot accounts",
  },
  te: {
    // Common
    truthScan: "ట్రూత్‌స్కాన్",
    aiDetection: "AI-ఆధారిత ఫేక్ న్యూస్ డిటెక్షన్",
    detectFakeNews: "అధునాతన AI తో నకిలీ వార్తలు, మార్పు చేసిన చిత్రాలు మరియు తప్పుడు సమాచారాన్ని గుర్తించండి",
    checkNews: "వార్తలు తనిఖీ చేయండి",
    analyzing: "విశ్లేషిస్తోంది...",
    downloadReport: "నివేదిక డౌన్‌లోడ్ చేయండి",
    clear: "క్లియర్",
    
    // Results
    verifiedReal: "ధృవీకరించబడిన నిజం",
    fakeDetected: "నకిలీ గుర్తించబడింది",
    misleadingDetected: "తప్పుదారి పట్టించేది",
    unverified: "ధృవీకరించబడలేదు",
    analysisComplete: "విశ్లేషణ పూర్తయింది",
    confidenceScore: "నమ్మకం స్కోర్",
    
    // Sections
    reason: "కారణం",
    reasonExplanation: "ఈ కంటెంట్ ఎందుకు వర్గీకరించబడింది",
    sources: "ధృవీకరణ మూలాలు",
    sourcesExplanation: "ధృవీకరణ కోసం ఉపయోగించిన విశ్వసనీయ మూలాలు",
    contribution: "సహకారం",
    
    // Source Types
    factCheck: "ఫ్యాక్ట్-చెక్",
    news: "వార్తలు",
    database: "డేటాబేస్",
    web: "వెబ్",
    official: "అధికారిక",
    
    // Text Detection
    textAnalysis: "టెక్స్ట్ విశ్లేషణ",
    enterTextToAnalyze: "విశ్లేషించడానికి టెక్స్ట్ నమోదు చేయండి",
    textPlaceholder: "మీరు ధృవీకరించాలనుకుంటున్న వార్తా కథనం, సోషల్ మీడియా పోస్ట్ లేదా ఏదైనా టెక్స్ట్ కంటెంట్‌ను పేస్ట్ చేయండి...",
    
    // Image Detection
    imageDetection: "చిత్ర గుర్తింపు",
    uploadImage: "మానిప్యులేషన్ మరియు డీప్‌ఫేక్‌లను గుర్తించడానికి చిత్రాలను అప్‌లోడ్ చేయండి",
    clickToUpload: "అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి లేదా డ్రాగ్ అండ్ డ్రాప్ చేయండి",
    contextOptional: "సందర్భం (ఐచ్ఛికం)",
    contextPlaceholder: "ఈ చిత్రం గురించి ఏదైనా సందర్భాన్ని అందించండి (ఉదా., క్లెయిమ్ చేసిన మూలం, తేదీ, ఈవెంట్)...",
    detectImage: "చిత్రాన్ని గుర్తించండి",
    scanningImage: "మానిప్యులేషన్ కోసం చిత్రాన్ని స్కాన్ చేస్తోంది",
    
    // Social Media
    socialMediaTroll: "సోషల్ మీడియా ట్రోల్",
    detectTrolls: "ట్రోల్స్, బాట్లు మరియు తప్పుడు సమాచార ప్రచారాలను గుర్తించండి",
    selectPlatform: "ప్లాట్‌ఫారమ్ ఎంచుకోండి",
    pastePostContent: "పోస్ట్ కంటెంట్ పేస్ట్ చేయండి",
    socialPlaceholder: "ట్రోల్ ప్రవర్తన కోసం మీరు విశ్లేషించాలనుకుంటున్న సోషల్ మీడియా పోస్ట్, యూజర్‌నేమ్ లేదా URL ను పేస్ట్ చేయండి...",
    detectTroll: "ట్రోల్ గుర్తించండి",
    scanningTroll: "ట్రోల్ కార్యకలాపం కోసం స్కాన్ చేస్తోంది",
    
    // Live Scan
    liveScan: "లైవ్ స్కాన్",
    captureContent: "నిజ సమయంలో కంటెంట్‌ను క్యాప్చర్ చేసి ధృవీకరించండి",
    captureImage: "చిత్రాన్ని క్యాప్చర్ చేయండి",
    retake: "మళ్ళీ తీయండి",
    verifyImage: "చిత్రాన్ని ధృవీకరించండి",
    
    // Settings
    settings: "సెట్టింగ్‌లు",
    language: "భాష",
    resetHistory: "చరిత్రను రీసెట్ చేయండి",
    aboutSystem: "సిస్టమ్ గురించి",
    aboutDescription: "TruthScan అనేది ఖచ్చితమైన, మూలం-ఆధారిత ధృవీకరణ కోసం డ్యూయల్ AI ఇంజిన్‌లు (Gemini + OpenAI) ద్వారా ఆధారితమైన ప్రభుత్వ-స్థాయి ఫాక్ట్-చెకింగ్ సిస్టమ్.",
    close: "మూసివేయండి",
    
    // Navigation
    goBack: "వెనక్కి వెళ్ళు",
    home: "హోమ్",
    
    // Features
    textNews: "టెక్స్ట్ / వార్తలు",
    textNewsDesc: "తప్పుడు సమాచారం కోసం వ్యాసాలు మరియు టెక్స్ట్‌ను విశ్లేషించండి",
    imageVerify: "చిత్ర ధృవీకరణ",
    imageVerifyDesc: "మార్పు చేసిన లేదా AI-ఉత్పత్తి చిత్రాలను గుర్తించండి",
    liveCamera: "లైవ్ కెమెరా",
    liveCameraDesc: "కెమెరా ఉపయోగించి నిజ సమయ ధృవీకరణ",
    socialMedia: "సోషల్ మీడియా",
    socialMediaDesc: "ట్రోల్స్ మరియు బాట్ ఖాతాలను గుర్తించండి",
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("truthscan-language");
    return (saved as Language) || "en";
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("truthscan-language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
