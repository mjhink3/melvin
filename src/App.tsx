/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './firebaseClient';
import { setUserId } from './memoryService';
import MelvinConsole from './components/MelvinConsole';
import LoginScreen from './components/LoginScreen';
import { getRandomMelvinOpening, getIntroductionOpening, MELVIN_OPENINGS } from './seeds';
import { Message, PersonalitySettings } from './types';
import { Download, Sparkles, RefreshCcw, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { loadMemory, saveMemory, EMPTY_MEMORY, MelvinMemory } from './memoryService';
import PrivacyPage from './components/PrivacyPage';
import InvitePanel from './components/InvitePanel';
import { redeemInvite, getOrCreateInviteProfile, getPendingInvite, clearPendingInvite } from './inviteService';
import { saveSessionSummary, loadRecentSummaries, formatHistoryForPrompt, setHistoryUserId, SessionSummary } from './historyService';
import melvinIcon from './assets/images/melvin_app_icon.png';

const LOCAL_STORAGE_SESSION_KEY = 'melvin_chat_history_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'melvin_personality_settings_v1';
const LOCAL_STORAGE_MEMORY_KEY = 'melvin_memory_v3';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showInvitePanel, setShowInvitePanel] = useState(false);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const [recentHistory, setRecentHistory] = useState<SessionSummary[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [memory, setMemory] = useState<MelvinMemory>(EMPTY_MEMORY);

  // Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setUserId(firebaseUser.uid);
        setHistoryUserId(firebaseUser.uid);
        // Redeem pending invite if present
        const pendingToken = getPendingInvite();
        if (pendingToken) {
          redeemInvite(pendingToken, firebaseUser.uid).then(name => {
            if (name) setInviterName(name);
            clearPendingInvite();
          });
        }
        // Ensure invite profile exists
        getOrCreateInviteProfile(firebaseUser.uid, firebaseUser.displayName || undefined);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Initialize after auth
  useEffect(() => {
    if (!user) return;

    const savedSettings = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) {}
    }

    const savedHistory = localStorage.getItem(LOCAL_STORAGE_SESSION_KEY);
    if (savedHistory) {
      try {
        let parsed: Message[] = JSON.parse(savedHistory);
        parsed = parsed.filter(msg =>
          !msg.content.includes("temporary system static") &&
          !msg.content.includes("check your network") &&
          !msg.content.includes("Vocal static crackles")
        );
        if (parsed.length > 0 && parsed[0].role === 'assistant') {
          if (!MELVIN_OPENINGS.includes(parsed[0].content)) {
            parsed[0].content = "Hey. Good to hear from you.";
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
      } catch (e) {}
    } else {
      const firstGreeting: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: inviterName ? getIntroductionOpening(inviterName) : getRandomMelvinOpening(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([firstGreeting]);
      localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify([firstGreeting]));
    }

    // Load memory -- Firestore first, fall back to localStorage
    // Load recent session history for context injection
    loadRecentSummaries(5).then(summaries => {
      setRecentHistory(summaries);
    });

    loadMemory().then((cloudMemory) => {
      if (cloudMemory && cloudMemory.identity) {
        setMemory(cloudMemory);
        localStorage.setItem(LOCAL_STORAGE_MEMORY_KEY, JSON.stringify(cloudMemory));
      } else {
        const localMemory = localStorage.getItem(LOCAL_STORAGE_MEMORY_KEY);
        if (localMemory) {
          try { setMemory(JSON.parse(localMemory)); } catch (e) {}
        }
      }
    });
  }, [user]);

  const triggerMemoryExtraction = async (messagesList: Message[], currentMemory: MelvinMemory) => {
    if (messagesList.length === 0) return;
    setIsExtracting(true);
    try {
      const res = await fetch('/api/melvin/extract-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesList, currentMemory })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.memory) {
        setMemory(data.memory);
        localStorage.setItem(LOCAL_STORAGE_MEMORY_KEY, JSON.stringify(data.memory));
        await saveMemory(data.memory);
      }
    } catch (err) {
      console.warn("Memory extraction failed:", err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveSettings = (newSettings: PersonalitySettings) => {
    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(newSettings));
  };

  const handleMemoryUpdate = async (updated: MelvinMemory) => {
    setMemory(updated);
    localStorage.setItem(LOCAL_STORAGE_MEMORY_KEY, JSON.stringify(updated));
    await saveMemory(updated);
  };

  const saveHistoryToStorage = (history: Message[]) => {
    localStorage.setItem(LOCAL_STORAGE_SESSION_KEY, JSON.stringify(history));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

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
        body: JSON.stringify({ messages: updatedMessages, settings, memory, recentHistory })
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          // Fire text mode transition
          window.dispatchEvent(new Event('melvin:ratelimit'));
          return;
        }
        throw new Error(errorData.error || "Failed to connect.");
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

      if (finalMessages.length % 2 === 0) {
        triggerMemoryExtraction(finalMessages, memory);
      }

    } catch (err: any) {
      console.error(err);
      const systemErrorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "Something went sideways on my end. Give me a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalMessages = [...updatedMessages, systemErrorMsg];
      setMessages(finalMessages);
      saveHistoryToStorage(finalMessages);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSessionSummary = async (messagesList: Message[]) => {
    if (messagesList.length < 4) return;
    try {
      const res = await fetch('/api/melvin/summarize-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messagesList })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.summary) {
        await saveSessionSummary(data.summary);
        setHistoryRefreshTrigger(p => p + 1);
        // Update recent history for context
        loadRecentSummaries(5).then(setRecentHistory);
      }
    } catch (err) {
      console.warn('Session summary failed:', err);
    }
  };

  const handleClearSession = () => {
    if (confirm("Clear your current call history with Melvin?")) {
      // Generate session summary before clearing
      generateSessionSummary(messages);
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
    if (confirm("Reset Melvin completely? This will clear all memory and history.")) {
      setMessages([]);
      setMemory(EMPTY_MEMORY);
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SETTINGS_KEY);
      localStorage.removeItem(LOCAL_STORAGE_MEMORY_KEY);
      showToast("Melvin reset.");
      // Start fresh with a greeting
      const firstGreeting: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: getRandomMelvinOpening(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([firstGreeting]);
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) { showToast("No call history to export."); return; }
    const textDump = messages.map(m =>
      `${m.role === 'user' ? 'YOU' : 'MELVIN'} [${m.timestamp}]:\n${m.content}\n`
    ).join('\n---\n\n');
    const blob = new Blob([textDump], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `melvin_transcript_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    showToast("Transcript downloaded.");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setMessages([]);
    setMemory(EMPTY_MEMORY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#141211] flex items-center justify-center">
        <div className="text-stone-500 font-mono text-xs uppercase tracking-widest animate-pulse">Connecting...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-[#141211] text-stone-100 relative flex flex-col font-sans md:border-8 md:border-stone-900">

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

      <header className="border-b-4 border-stone-900 bg-[#E8E4DE] text-stone-900 z-30 hidden md:block">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3 select-none">
            <div className="w-9 h-9 overflow-hidden rounded-lg border border-stone-900 shrink-0">
              <img src={melvinIcon} alt="Melvin" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-display font-black text-xl text-stone-900 tracking-tighter uppercase italic">Melvin</h1>
                <span className="font-mono text-[8.5px] font-black text-purple-700 bg-purple-100 border border-stone-900 px-1.5 uppercase">VOICE LINE</span>
              </div>
              <p className="text-[9px] text-[#7C3AED] font-mono tracking-wider font-extrabold uppercase">The first person you call</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <AnimatePresence>
              {isExtracting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 border border-purple-200"
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-1.5 h-1.5 bg-purple-500 rounded-full"
                  />
                  <span className="text-[8px] font-mono font-black uppercase tracking-wider text-purple-600">Filing...</span>
                </motion.div>
              )}
            </AnimatePresence>

            <button onClick={() => setShowInvitePanel(true)}
              className="px-2.5 py-1.5 border border-stone-900 bg-purple-700 hover:bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer">
              Invite
            </button>
            <button onClick={() => setShowAboutModal(true)}
              className="px-2.5 py-1.5 border border-stone-900 bg-white hover:bg-stone-50 text-stone-900 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer">
              Info
            </button>
            <button onClick={handleExportChat}
              className="p-1.5 bg-white border border-stone-900 text-stone-900 hover:bg-stone-50 transition-all cursor-pointer" title="Export transcript">
              <Download className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleResetCalibration}
              className="p-1.5 bg-rose-50 border border-stone-900 text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer" title="Reset Melvin">
              <RefreshCcw className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleSignOut}
              className="p-1.5 bg-white border border-stone-900 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all cursor-pointer" title="Sign out">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center md:px-4 md:py-6 p-0 overflow-hidden">
        <MelvinConsole
          messages={messages}
          settings={settings}
          onUpdateSettings={handleSaveSettings}
          onSendMessage={handleSendMessage}
          onClearSession={handleClearSession}
          isGenerating={isGenerating}
          onQuickTopic={handleSendMessage}
          memory={memory}
          isExtracting={isExtracting}
          onMemoryUpdate={handleMemoryUpdate}
          userId={user?.uid}
          historyRefreshTrigger={historyRefreshTrigger}
        />
      </main>

      <AnimatePresence>
        {showAboutModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-stone-950 border-4 border-stone-900 max-w-md w-full p-6 text-stone-300 space-y-4 shadow-2xl"
            >
              <div className="flex items-center space-x-3.5 border-b border-stone-900 pb-3">
                <img src={melvinIcon} alt="Melvin" className="w-7 h-7 rounded-md object-cover" />
                <div>
                  <h3 className="font-display font-black text-lg text-white uppercase tracking-tight">Melvin</h3>
                  <p className="font-mono text-[9px] uppercase font-bold text-purple-400 tracking-widest">The first person you call</p>
                </div>
              </div>
              <div className="space-y-3 text-xs text-stone-300 leading-relaxed">
                <p>Melvin is a thoughtful, funny, emotionally intelligent British companion who remembers what matters.</p>
                <div className="border border-stone-900 bg-[#7C3AED]/10 p-3.5 space-y-1.5">
                  <span className="font-mono text-[9.5px] font-black uppercase text-purple-400 block tracking-wider">Your data stays yours:</span>
                  <p className="font-medium">Your conversations are private by design. Melvin remembers you. We don't read what you tell him.</p>
                </div>
                <p>Speak into your microphone and Melvin will respond. He remembers across every conversation.</p>
              </div>
              <div className="pt-2 flex justify-end">
                <button type="button" onClick={() => setShowAboutModal(false)}
                  className="bg-[#7C3AED] hover:bg-purple-600 text-white border border-purple-500 font-display font-black text-xs uppercase tracking-widest py-2.5 px-5 transition-all cursor-pointer">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="border-t border-stone-900 bg-stone-950 py-4 text-center text-[9px] text-stone-500 font-mono font-bold uppercase tracking-widest hidden md:block">
        <p>© 2026 Melvin. No dashboards. Just companionship. <button onClick={() => setShowPrivacy(true)} className="underline text-stone-500 hover:text-stone-300 cursor-pointer transition-colors">Privacy</button></p>
      </footer>
      <AnimatePresence>
        {showPrivacy && <PrivacyPage onClose={() => setShowPrivacy(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showInvitePanel && user && (
          <InvitePanel
            uid={user.uid}
            displayName={user.displayName || 'Melvin user'}
            onClose={() => setShowInvitePanel(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}