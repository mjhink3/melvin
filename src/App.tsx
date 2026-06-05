/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import OnboardingFlow from './components/OnboardingFlow';
import MelvinConsole from './components/MelvinConsole';
import MemoryBankPanel from './components/MemoryBankPanel';
import { DEFAULT_LIFEMAP, getRandomMelvinOpening, MELVIN_OPENINGS } from './seeds';
import { Message, PersonalitySettings, LifeMap } from './types';
import { 
  Info, 
  BrainCircuit, 
  Download, 
  Sparkles,
  RefreshCcw,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_SESSION_KEY = 'melvin_chat_history_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'melvin_personality_settings_v1';
const LOCAL_STORAGE_ONBOARD_KEY = 'melvin_onboarding_completed_v1';
const LOCAL_STORAGE_LIFEMAP_KEY = 'melvin_lifemap_v2';

export default function App() {
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [settings, setSettings] = useState<PersonalitySettings>({
    challenge_level: 'medium',
    humor: 'medium',
    warmth: 'high',
    directness: 'medium',
    career_focus: true,
    personal_growth_focus: true,
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [lifeMap, setLifeMap] = useState<LifeMap>(DEFAULT_LIFEMAP);
  const [showMemoryBank, setShowMemoryBank] = useState<boolean>(true);

  // Initialize from LocalStorage
  useEffect(() => {
    const onboardedValue = localStorage.getItem(LOCAL_STORAGE_ONBOARD_KEY);
    if (onboardedValue === 'true') {
      setIsOnboarded(true);
    }

    const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.warn("Failed to load saved personality settings.", e);
      }
    }

    const savedHistory = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (savedHistory) {
      try {
        let parsed: Message[] = JSON.parse(savedHistory);
        // Clean up any legacy system error/static messages from history so they don't persist
        parsed = parsed.filter(msg => 
          !msg.content.includes("temporary system static") && 
          !msg.content.includes("check your network") &&
          !msg.content.includes("Vocal static crackles")
        );
        // Force the first message to be a friendly opening from MELVIN_OPENINGS
        if (parsed.length > 0 && parsed[0].role === 'assistant') {
          if (!MELVIN_OPENINGS.includes(parsed[0].content)) {
            parsed[0].content = "Hey Michael. How's it going? How can I be of help today, friend?";
          }
        } else if (parsed.length === 0) {
          parsed = [{
            id: crypto.randomUUID(),
            role: 'assistant',
            content: getRandomMelvinOpening(),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }];
        }
        localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(parsed));
        setMessages(parsed);
      } catch (e) {
        console.warn("Failed to load saved message history.", e);
      }
    } else if (onboardedValue === 'true') {
      const firstGreeting: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getRandomMelvinOpening(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([firstGreeting]);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify([firstGreeting]));
    }

    const savedLifeMap = localStorage.getItem(LOCAL_STORAGE_LIFEMAP_KEY);
    if (savedLifeMap) {
      try {
        const parsed = JSON.parse(savedLifeMap);
        // Wipe historical memory of observations and timeline breakthroughs completely
        parsed.observations = [];
        parsed.timeline = [];
        localStorage.setItem(LOCAL_STORAGE_LIFEMAP_KEY, JSON.stringify(parsed));
        setLifeMap(parsed);
      } catch (e) {
        console.warn("Failed to load saved Life Map.", e);
      }
    }
  }, []);

  const triggerLifeMapExtraction = async (messagesList: Message[], curLifeMap: LifeMap) => {
    if (messagesList.length === 0) return;
    try {
      const res = await fetch('/api/melvin/extract-lifemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesList,
          currentLifeMap: curLifeMap
        })
      });

      if (!res.ok) {
        throw new Error("Extraction response error.");
      }

      const data = await res.json();
      if (data.lifeMap) {
        setLifeMap(data.lifeMap);
        localStorage.setItem(LOCAL_STORAGE_LIFEMAP_KEY, JSON.stringify(data.lifeMap));
        showToast("Melvin personal context synchronized.");
      }
    } catch (err) {
      console.warn("Background life map sync failed:", err);
    }
  };

  // Save changes to localStorage
  const handleSaveSettings = (newSettings: PersonalitySettings) => {
    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleCompleteOnboarding = (initSettings: PersonalitySettings) => {
    setSettings(initSettings);
    setIsOnboarded(true);
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(initSettings));
    localStorage.setItem(LOCAL_STORAGE_ONBOARD_KEY, 'true');
    showToast("Melvin Voice Line connected successfully.");

    const firstGreeting: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: getRandomMelvinOpening(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([firstGreeting]);
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify([firstGreeting]));
  };

  const saveHistoryToStorage = (history: Message[]) => {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(history));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Chat API Call proxying Express backend
  const handleSendMessage = async (rawContent: string) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: rawContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveHistoryToStorage(updatedMessages);
    setIsGenerating(true);

    try {
      const response = await fetch('/api/melvin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          settings: settings,
          lifeMap: lifeMap
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || "Failed to connect voice stream.");
      }

      const data = await response.json();
      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = [...updatedMessages, assistantMsg];
      setMessages(finalMessages);
      saveHistoryToStorage(finalMessages);

      // Auto-extract Life Map background thread!
      triggerLifeMapExtraction(finalMessages, lifeMap);
    } catch (err: any) {
      console.error(err);
      const systemErrorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `*Vocal static crackles softly*\n\n"I ran into some temporary system static trying to stream. Check your network or make sure your api keys are set."`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalMessages = [...updatedMessages, systemErrorMsg];
      setMessages(finalMessages);
      saveHistoryToStorage(finalMessages);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearSession = () => {
    if (confirm("Are you sure you want to clear your current call history with Melvin? This will reset the current dialogue stream.")) {
      const firstGreeting: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getRandomMelvinOpening(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([firstGreeting]);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify([firstGreeting]));
      showToast("Call stream refreshed.");
    }
  };

  const handleResetCalibration = () => {
    if (confirm("Reset Melvin to raw factory configurations? This will return you to call setup and clear Melvin's persistent memory.")) {
      setIsOnboarded(false);
      setMessages([]);
      setLifeMap(DEFAULT_LIFEMAP);
      localStorage.removeItem(LOCAL_STORAGE_ONBOARD_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_LIFEMAP_KEY);
      showToast("Melvin companion reset completed.");
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) {
      showToast("No active call history to export.");
      return;
    }
    const textDump = messages.map(m => `${m.role === 'user' ? 'YOU' : 'MELVIN'} [${m.timestamp}]:\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([textDump], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `melvin_call_transcript_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    showToast("Transcript downloaded as text file.");
  };

  return (
    <div className="min-h-screen bg-[#141211] text-stone-100 relative flex flex-col font-sans transition-all border-8 border-stone-900">
      
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#7C3AED] border-2 border-stone-800 text-white font-mono text-[10.5px] px-4 py-2.5 brutalist-shadow flex items-center space-x-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#A7F3D0] animate-pulse" />
            <span className="font-bold uppercase tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Header */}
      <header className="border-b-4 border-stone-900 bg-[#E8E4DE] text-stone-900 z-30 shadow-none">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 select-none">
            <div className="p-2 bg-[#7C3AED] border border-stone-900 text-white">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-black text-xl text-stone-900 tracking-tighter uppercase italic">Melvin</h1>
                <span className="font-mono text-[8.5px] font-black text-purple-700 bg-purple-100 border border-stone-900 px-1.5 py-0.2 uppercase">VOICE LINE</span>
              </div>
              <p className="text-[9px] text-[#7C3AED] font-mono tracking-wider font-extrabold uppercase">
                EMOTIONAL SUPPORT GOAT • HONEST COMPANY
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAboutModal(true)}
              className="px-2.5 py-1.5 border border-stone-900 bg-white hover:bg-stone-50 text-stone-900 text-[10px] font-black uppercase tracking-wider font-display transition-all cursor-pointer flex items-center gap-1 shadow-xs"
            >
              Info
            </button>
            {isOnboarded && (
              <>
                <button
                  onClick={() => setShowMemoryBank(!showMemoryBank)}
                  title="Toggle Cognitive Memory Bank notebook panel"
                  className={`px-2.5 py-1.5 border border-stone-900 text-[10px] font-black uppercase tracking-wider font-display transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    showMemoryBank 
                      ? 'bg-[#7C3AED] hover:bg-purple-800 text-white border-stone-900' 
                      : 'bg-white hover:bg-stone-55 text-stone-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{showMemoryBank ? 'Hide Records' : 'Memory Bank'}</span>
                </button>
                <button
                  onClick={handleExportChat}
                  title="Export dialogue transcript"
                  className="p-1.5 bg-white border border-stone-900 text-stone-900 hover:bg-stone-55 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetCalibration}
                  title="Reset Melvin memory & line calibration"
                  className="p-1.5 bg-rose-50 border border-stone-900 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                >
                  <RefreshCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main FaceTime Center Layout */}
      <main className={`flex-1 w-full mx-auto px-4 py-6 flex flex-col justify-center transition-all duration-300 ${
        isOnboarded && showMemoryBank ? 'max-w-6xl' : 'max-w-4xl'
      }`}>
        {!isOnboarded ? (
          <div className="w-full py-4 text-stone-900 max-w-4xl mx-auto">
            <OnboardingFlow onComplete={handleCompleteOnboarding} />
          </div>
        ) : (
          <div className={`grid grid-cols-1 ${showMemoryBank ? 'lg:grid-cols-12' : 'max-w-xl mx-auto'} gap-6 w-full items-start`}>
            <div className={`${showMemoryBank ? 'lg:col-span-6 xl:col-span-5 w-full' : 'w-full'}`}>
              <MelvinConsole 
                messages={messages}
                settings={settings}
                onUpdateSettings={handleSaveSettings}
                onSendMessage={handleSendMessage}
                onClearSession={handleClearSession}
                isGenerating={isGenerating}
                onQuickTopic={handleSendMessage}
              />
            </div>
            
            {showMemoryBank && (
              <div className="lg:col-span-6 xl:col-span-7 w-full h-[680px]">
                <MemoryBankPanel 
                  lifeMap={lifeMap} 
                  onSendMessage={handleSendMessage}
                />
              </div>
            )}
          </div>
        )}
      </main>

      {/* About Melvin Modal */}
      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-950 border-4 border-stone-900 rounded-none max-w-md w-full overflow-hidden p-6 text-stone-300 relative space-y-4 shadow-2xl"
            >
              <div className="flex items-center space-x-3.5 border-b border-stone-900 pb-3">
                <BrainCircuit className="h-7 w-7 text-[#7C3AED]" />
                <div>
                  <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">Melvin, the Voice Companion</h3>
                  <p className="font-mono text-[9px] uppercase font-bold text-purple-400 tracking-widest">Active Memory & Conversation Node</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs text-stone-300 leading-relaxed">
                <p>
                  Melvin is an emotionally intelligent retro AI companion modeled as awise 16-bit anthropomorphic goat. He values direct self-reflection over dry software productivity tracking.
                </p>
                <div className="border border-stone-900 bg-[#7C3AED]/10 p-3.5 text-stone-200 space-y-1.5">
                  <span className="font-mono text-[9.5px] font-black uppercase text-purple-400 block tracking-wider">Natural Conversation:</span>
                  <p className="font-medium">
                    He keeps a full, silent context model in his gears, allowing him to reference your background goals, blind spots, and contradictions organic during calls rather than in dry metrics dashboards.
                  </p>
                </div>
                <p>
                  Speak clearly into your microphone when you activate the call. Connect deeper, examine personal truths, and receive dry, honest wit in a warm, trustworthy FaceTime phone loop.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAboutModal(false)}
                  className="bg-[#7C3AED] hover:bg-purple-600 text-white border border-purple-500 font-display font-black text-xs uppercase tracking-widest py-2.5 px-5 transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-stone-900 bg-stone-950 py-4 text-center text-[9px] text-stone-500 font-mono font-bold uppercase tracking-widest">
        <p>© 2026 Melvin companion. No software analytics dashboards. Just companionship.</p>
      </footer>
    </div>
  );
}
