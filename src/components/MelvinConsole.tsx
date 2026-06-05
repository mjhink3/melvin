/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Message, PersonalitySettings } from '../types';
import { 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Keyboard, 
  Send, 
  SlidersHorizontal,
  ChevronDown,
  Info,
  CheckCircle2,
  PhoneCall,
  Loader2,
  Settings,
  HelpCircle,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import melvinAvatar from '../assets/images/melvin_avatar_1780176074703.png';
import MelvinCharacter from './MelvinCharacter';

interface MelvinConsoleProps {
  messages: Message[];
  settings: PersonalitySettings;
  onUpdateSettings: (newSettings: PersonalitySettings) => void;
  onSendMessage: (message: string) => void;
  onClearSession: () => void;
  isGenerating: boolean;
  onQuickTopic: (topic: string) => void;
}

export default function MelvinConsole({
  messages,
  settings,
  onUpdateSettings,
  onSendMessage,
  onClearSession,
  isGenerating,
  onQuickTopic
}: MelvinConsoleProps) {
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false); // Default to unmuted voice call output!
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMelvinSpeaking, setIsMelvinSpeaking] = useState(false);
  const [themeMode, setThemeMode] = useState<'facetime' | 'audio-wave'>('facetime');
  const [showAccessibilityFallback, setShowAccessibilityFallback] = useState(false);
  const [showDialsDrawer, setShowDialsDrawer] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState('Connecting Call...');
  const [isBlinking, setIsBlinking] = useState(false);

  // Living presence - periodic randomized slow blinks
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 160); // organic 160ms blink duration
      
      const nextInterval = 4000 + Math.random() * 6500; // blink every 4 to 10.5 seconds
      blinkTimeout = setTimeout(triggerBlink, nextInterval);
    };
    
    blinkTimeout = setTimeout(triggerBlink, 3500);
    return () => clearTimeout(blinkTimeout);
  }, []);

  const speechUttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');

  // Call duration counter
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Web Speech API - Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
        setCallStatus('Melvin listening...');
      };

      rec.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const text = result[0].transcript;
        transcriptBufferRef.current = text;
      };

      rec.onerror = (event: any) => {
        console.warn('Speech recognition error', event.error);
        setIsListening(false);
        // Don't auto-stop call for minor noises
      };

      rec.onend = () => {
        setIsListening(false);
        const finalSpeech = transcriptBufferRef.current.trim();
        if (finalSpeech) {
          onSendMessage(finalSpeech);
          transcriptBufferRef.current = '';
        } else {
          setCallStatus(isMelvinSpeaking ? 'Melvin speaking...' : 'Connected');
        }
      };

      recognitionRef.current = rec;
    }
  }, [onSendMessage, isMelvinSpeaking]);

  // Voice listening toggle
  const startVoiceInput = () => {
    if (isMicMuted || isGenerating || isMelvinSpeaking) return;
    if (recognitionRef.current) {
      try {
        window.speechSynthesis.cancel(); // Stop talking to listen
        setIsMelvinSpeaking(false);
        recognitionRef.current.start();
      } catch (e) {
        console.warn('Microphone starting issue', e);
      }
    } else {
      setCallStatus('Speech recognition not supported in browser');
    }
  };

  // Speech Helper - Text to Speech
  const speakText = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) {
      setCallStatus('Connected');
      return;
    }
    try {
      window.speechSynthesis.cancel();
      // Remove deep formatting/markdown to read out cleanly
      const cleanText = text
        .replace(/[*#_~`>]/g, ' ')
        .replace(/- \s*/g, ' ')
        .replace(/\n+/g, ' . ');

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.98; // Relaxed, authentic pacing
      utterance.pitch = 0.82; // Warm, intelligent, deep voice alignment

      const voices = window.speechSynthesis.getVoices();
      const idealVoice = voices.find(
        (v) =>
          v.lang.startsWith('en') &&
          (v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Male'))
      );
      if (idealVoice) {
        utterance.voice = idealVoice;
      }

      utterance.onstart = () => {
        setIsMelvinSpeaking(true);
        setCallStatus('Melvin speaking...');
      };

      utterance.onend = () => {
        setIsMelvinSpeaking(false);
        setCallStatus('Connected');
        // Auto-mic listening after Melvin completes his phrase to cultivate active conversation flows!
        if (!isMicMuted && recognitionRef.current && !showAccessibilityFallback) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.warn('Auto talk failed to start', e);
          }
        }
      };

      utterance.onerror = () => {
        setIsMelvinSpeaking(false);
        setCallStatus('Connected');
      };

      speechUttRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS vocal output failed', e);
      setIsMelvinSpeaking(false);
      setCallStatus('Connected');
    }
  };

  // Automatically trigger Melvin's deep voice output on incoming reply
  useEffect(() => {
    if (messages.length > 0 && !isGenerating) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.role === 'assistant') {
        speakText(lastMsg.content);
      }
    }
  }, [messages, isGenerating, isMuted]);

  // Handle manual typing submit inside the accessibility overlay
  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleTune = (key: keyof PersonalitySettings, value: any) => {
    onUpdateSettings({
      ...settings,
      [key]: value
    });
  };

  const toggleMic = () => {
    if (!isMicMuted) {
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
    setIsMicMuted(!isMicMuted);
  };

  const toggleMute = () => {
    if (!isMuted) {
      window.speechSynthesis.cancel();
      setIsMelvinSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="bg-[#121110] border-4 border-stone-900 rounded-none overflow-hidden font-sans relative w-full h-[680px] flex flex-col justify-between text-white brutalist-shadow-lg select-none">
      
      {/* Top Banner: Status Header bar */}
      <div className="p-4 bg-stone-950/90 border-b border-stone-900 flex justify-between items-center z-20 backdrop-blur-md">
        <div className="flex items-center space-x-3.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 bg-green-500 rounded-full block animate-pulse"></span>
            <span className="absolute -inset-0.5 bg-green-500/45 rounded-full animate-ping"></span>
          </div>
          
          <div className="flex items-center space-x-2 font-mono text-xs text-stone-300">
            <span className="font-sans font-bold text-stone-100 antialiased">Voice Call</span>
            <span className="text-stone-600">•</span>
            <span className="tabular-nums text-stone-200 font-semibold">{formatDuration(callDuration)}</span>
            <span className="text-stone-600">•</span>
            <span className={`font-black uppercase tracking-wider text-[10px] ${
              isGenerating ? 'text-amber-400' : isMelvinSpeaking ? 'text-[#a855f7]' : isListening ? 'text-emerald-400' : 'text-stone-400'
            }`}>
              {isGenerating ? 'Thinking' : isMelvinSpeaking ? 'Speaking' : isListening ? 'Listening' : 'Connected'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Personality settings tuner button */}
          <button
            onClick={() => setShowDialsDrawer(!showDialsDrawer)}
            className={`p-1.5 transition-all cursor-pointer border rounded-none text-[10px] font-mono flex items-center space-x-1 ${
              showDialsDrawer 
                ? 'bg-purple-700 text-white border-purple-500' 
                : 'bg-stone-900 border-stone-800 text-stone-300 hover:text-white'
            }`}
            title="Calibrate Voice Personality"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden sm:inline">Voice Tone</span>
          </button>
        </div>
      </div>

      {/* Dynamic Voice Calibration Drawer (Overlay) */}
      <AnimatePresence>
        {showDialsDrawer && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-[64px] left-0 right-0 bg-stone-900 border-b-4 border-stone-950 z-30 p-4 text-xs font-mono space-y-3.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Directness dial */}
              <div className="space-y-1">
                <span className="text-stone-400 text-[10px] font-bold block uppercase tracking-wider">Tone Directness:</span>
                <div className="flex bg-stone-950 p-1 border border-stone-800">
                  {['low', 'medium', 'high'].map(d => (
                    <button
                      key={d}
                      onClick={() => handleTune('directness', d)}
                      className={`flex-1 py-1 text-[9.5px] uppercase font-black cursor-pointer ${
                        settings.directness === d ? 'bg-purple-700 text-white' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {d === 'low' ? 'Diplomacy' : d === 'medium' ? 'Honest' : 'Raw'}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Challenge dial */}
              <div className="space-y-1">
                <span className="text-stone-400 text-[10px] font-bold block uppercase tracking-wider">Rigor / Challenge:</span>
                <div className="flex bg-stone-950 p-1 border border-stone-800">
                  {['low', 'medium', 'high'].map(c => (
                    <button
                      key={c}
                      onClick={() => handleTune('challenge_level', c)}
                      className={`flex-1 py-1 text-[9.5px] uppercase font-black cursor-pointer ${
                        settings.challenge_level === c ? 'bg-purple-700 text-white' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {c === 'low' ? 'Gentle' : c === 'medium' ? 'Active' : 'Insight'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Humour dial */}
              <div className="space-y-1">
                <span className="text-stone-400 text-[10px] font-bold block uppercase tracking-wider">Dry Amusement:</span>
                <div className="flex bg-stone-950 p-1 border border-stone-800">
                  {['low', 'medium', 'high'].map(h => (
                    <button
                      key={h}
                      onClick={() => handleTune('humor', h)}
                      className={`flex-1 py-1 text-[9.5px] uppercase font-black cursor-pointer ${
                        settings.humor === h ? 'bg-purple-700 text-white' : 'text-stone-400 hover:text-white'
                      }`}
                    >
                      {h === 'low' ? 'Stoic' : h === 'medium' ? 'Witty' : 'High Wit'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[9px] text-stone-500 pt-1">
              <span>Calibration adjusts Melvin's conversational response rules.</span>
              <button onClick={() => setShowDialsDrawer(false)} className="underline font-bold text-stone-405 hover:text-white cursor-pointer uppercase">Done</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FaceTime Center Area (Full-screen Video Call Framing) */}
      <div className="flex-1 w-full bg-stone-950 relative flex flex-col justify-between p-4 min-h-0 overflow-hidden">
        
        {/* Full-Frame Video Stream Background representing Melvin's physical presence */}
        <MelvinCharacter
          isSpeaking={isMelvinSpeaking}
          isListening={isListening}
          isThinking={isGenerating}
          isMuted={isMuted}
          isMicMuted={isMicMuted}
        />

          {/* Live Reactive Edge Glow representing current stream flow states */}
          <AnimatePresence>
            {isMelvinSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.35, 0.65, 0.35] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="absolute inset-0 border-[4px] border-purple-600/30 ring-4 ring-purple-600/10 pointer-events-none"
              />
            )}
            {isListening && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="absolute inset-0 border-[4px] border-emerald-500/30 ring-4 ring-emerald-500/10 pointer-events-none"
              />
            )}
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.4 }}
                className="absolute inset-0 border-[4px] border-amber-500/30 ring-4 ring-amber-500/10 pointer-events-none"
              />
            )}
          </AnimatePresence>

        {/* Bottom-aligned Overlays: Modern, semi-transparent borderless cinematic captions */}
        <div className="w-full z-10 flex flex-col items-center mb-1 pointer-events-none">
          <div className="w-full max-w-lg min-h-[3.5rem] flex items-center justify-center px-4 select-text">
            <AnimatePresence mode="wait">
              {isMelvinSpeaking && lastMessage && lastMessage.role === 'assistant' ? (
                <motion.div 
                  key={lastMessage.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-lg shadow-lg w-full text-center"
                >
                  <p className="text-white text-xs sm:text-sm font-medium tracking-wide leading-relaxed">
                    "{lastMessage.content.length > 130 ? `${lastMessage.content.slice(0, 130)}...` : lastMessage.content}"
                  </p>
                </motion.div>
              ) : isListening ? (
                <motion.div 
                  key="captions-listening"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-black/55 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md text-emerald-400 text-[10px] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Listening...
                </motion.div>
              ) : isGenerating ? (
                <motion.div 
                  key="captions-generating"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.75, 1, 0.75] }}
                  transition={{ repeat: Infinity, duration: 1.4 }}
                  className="bg-black/55 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-md text-[#a855f7] text-[10px] font-sans font-bold uppercase tracking-widest flex items-center gap-1.5"
                >
                  <Loader2 className="w-3 h-3 text-[#a855f7] animate-spin" />
                  Thinking...
                </motion.div>
              ) : (
                <div key="captions-idle" className="bg-black/35 backdrop-blur-sm px-3.5 py-1 rounded-full shadow-xs">
                  <p className="text-stone-300 text-[9.5px] font-sans uppercase tracking-widest text-center font-medium">
                    Tap Mic to Talk
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* Slide-out Accessibility fallback panel */}
      <AnimatePresence>
        {showAccessibilityFallback && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "40%", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-stone-900 border-t-2 border-stone-800 z-10 flex flex-col justify-between overflow-hidden shrink-0"
          >
            <div className="p-3.5 bg-stone-950 border-b border-stone-800 text-[10px] font-mono text-stone-400 flex justify-between items-center select-none">
              <span className="uppercase font-bold tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-3.5 h-3.5 text-purple-400" /> Accessibility Text Terminal
              </span>
              <button 
                onClick={() => setShowAccessibilityFallback(false)} 
                className="hover:text-white cursor-pointer underline uppercase font-bold flex items-center"
              >
                Hide <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>
            </div>
            
            {/* Compact Chat Feed fallback */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.length === 0 ? (
                <p className="text-stone-500 italic">No captions yet. Type below or speak to start the call conversation.</p>
              ) : (
                messages.slice(-8).map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-mono text-stone-500 mb-0.5 uppercase tracking-wide font-black">
                      {msg.role === 'user' ? 'You' : 'Melvin'}
                    </span>
                    <p className={`p-2.5 rounded-none max-w-[85%] font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-purple-700 text-stone-100 border border-purple-600' 
                        : 'bg-stone-950 text-stone-200 border border-stone-850'
                    }`}>
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Fallback Text Input Area */}
            <form onSubmit={handleTypedSubmit} className="p-3 bg-stone-950/90 border-t border-stone-850 flex gap-2.5">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message as fallback..."
                disabled={isGenerating}
                className="flex-1 bg-stone-900 border border-stone-750 px-3 py-2 text-xs text-stone-100 outline-none focus:border-purple-600 font-medium placeholder-stone-500"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isGenerating}
                className="bg-purple-700 hover:bg-purple-600 text-white p-2 border border-purple-500 cursor-pointer transition-all shrink-0 flex items-center justify-center w-9 h-9"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Immersive Phone Call Controls bar (Similar to iOS call buttons) */}
      <div className="p-5 bg-stone-950 border-t border-stone-900 flex flex-col items-center justify-center space-y-4 shrink-0 z-20">
        
        {/* Sleek, softened, and integrated visual soundwaves (no technical subtitles blocking face) */}
        <div className="flex space-x-1 justify-center items-center h-4 px-4 py-1">
          {isMelvinSpeaking ? (
            Array.from({ length: 16 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [4, 18, 4] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.35 + Math.random() * 0.45, 
                  delay: i * 0.02
                }}
                className="w-0.75 bg-[#a855f7] rounded-full"
              />
            ))
          ) : isListening ? (
            Array.from({ length: 16 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [4, 14, 4] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.3 + Math.random() * 0.3, 
                  delay: i * 0.025 
                }}
                className="w-0.75 bg-emerald-500 rounded-full"
              />
            ))
          ) : isGenerating ? (
            Array.from({ length: 16 }).map((_, i) => (
              <motion.div 
                key={i}
                animate={{ height: [4, 10, 4] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.5 + Math.random() * 0.5, 
                  delay: i * 0.03
                }}
                className="w-0.75 bg-amber-500 rounded-full opacity-60"
              />
            ))
          ) : (
            <div className="w-16 h-0.5 bg-stone-800 rounded-full" />
          )}
        </div>

        {/* Rounded interactive FaceTime buttons arrangement */}
        <div className="flex items-center justify-center space-x-6 sm:space-x-8">
          
          {/* Audio read-aloud toggle */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isMuted 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 hover:bg-rose-500/30' 
                : 'bg-stone-900 text-stone-200 border-stone-800 hover:bg-stone-850'
            }`}
            title={isMuted ? "Unmute vocal voice speaker" : "Mute voice speaker"}
          >
            {isMuted ? <VolumeX className="w-5 h-5 animate-pulse" /> : <Volume2 className="w-5 h-5" />}
          </button>

          {/* Microphone mute switcher */}
          <button
            onClick={toggleMic}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              isMicMuted 
                ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/30' 
                : 'bg-stone-900 text-stone-200 border-stone-800 hover:bg-stone-850'
            }`}
            title={isMicMuted ? "Enable mic voice capture" : "Mute microphone"}
          >
            {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
          </button>

          {/* Core Speak / Transcribe Manual Button */}
          {!isMicMuted && (
            <button
              onClick={startVoiceInput}
              disabled={isGenerating || isMelvinSpeaking || isListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer border shadow-lg ${
                isListening 
                  ? 'bg-green-600 text-white border-green-500 shadow-green-950/50 scale-105' 
                  : isGenerating || isMelvinSpeaking
                  ? 'bg-stone-850 text-stone-500 border-stone-800 cursor-not-allowed opacity-50'
                  : 'bg-purple-700 hover:bg-purple-600 text-white border-purple-500 hover:scale-105 active:scale-95'
              }`}
              title="Hold conversation manually"
            >
              {isListening ? (
                <div className="flex space-x-1 justify-center items-center h-4">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping delay-75" />
                </div>
              ) : (
                <Mic className="w-6 h-6 animate-pulse" />
              )}
            </button>
          )}

          {/* Keypad text-mode toggle accessibility */}
          <button
            onClick={() => setShowAccessibilityFallback(!showAccessibilityFallback)}
            className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
              showAccessibilityFallback 
                ? 'bg-purple-700 text-white border-purple-500' 
                : 'bg-stone-900 text-stone-200 border-stone-800 hover:bg-stone-850'
            }`}
            title="Toggle Accessibility Subtitles Panel"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          {/* Circular Red Phone Off / End Call Button */}
          <button
            onClick={onClearSession}
            className="w-12 h-12 rounded-full bg-rose-600 hover:bg-rose-500 border border-rose-500 flex items-center justify-center text-white transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-rose-950/50"
            title="Restart Melvin companion dialogue"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

        </div>

        {/* Small subtitle suggestion loop */}
        {!isListening && !isGenerating && !isMelvinSpeaking && (
          <div className="flex flex-wrap gap-2 justify-center py-1 opacity-75">
            <span className="text-[9px] font-mono text-stone-500 uppercase font-black uppercase self-center mr-1">Topics:</span>
            <button 
              onClick={() => onQuickTopic("Let's talk about what is on my mind today")} 
              className="text-[10px] text-stone-400 hover:text-white hover:underline cursor-pointer font-medium"
            >
              What's on my mind
            </button>
            <span className="text-stone-700">•</span>
            <button 
              onClick={() => onQuickTopic("Let's do a friendly check-in on my creative ideas")} 
              className="text-[10px] text-stone-400 hover:text-white hover:underline cursor-pointer font-medium"
            >
              Check-in on goals
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
