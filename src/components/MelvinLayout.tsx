/**
 * MelvinLayout.tsx
 * Responsive three-panel layout.
 * Desktop: [Melvin PIP | Agent Workspace | Memory Panel]
 * Mobile: [Full face / Agent] + bottom tab bar + scrollable memory
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Keyboard, Send, Loader2, MessageSquare, Zap, Video } from 'lucide-react';
import MelvinCharacter from './MelvinCharacter';
import MemoryPanel, { MemoryBuckets } from './MemoryPanel';
import AgentPanel, { AgentTask } from './AgentPanel';
import TextMode from './TextMode';
import { Message, PersonalitySettings } from '../types';

// Mobile tab type
type MobileTab = 'call' | 'memory' | 'tasks';

interface MelvinLayoutProps {
  // Core
  messages: Message[];
  isGenerating: boolean;
  isExtracting: boolean;
  memory: MemoryBuckets;
  userId?: string;
  historyRefreshTrigger?: number;

  // Voice
  isMelvinSpeaking: boolean;
  isListening: boolean;
  isMuted: boolean;
  isMicMuted: boolean;
  spaceHeld: boolean;
  callDuration: number;
  isTextMode: boolean;

  // Agent
  currentTask: AgentTask | null;
  taskHistory: AgentTask[];

  // Handlers
  onSendMessage: (text: string) => void;
  onMicTap: () => void;
  onMicRelease: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onClearSession: () => void;
  onToggleTextMode: () => void;
  onMemoryUpdate?: (updated: MemoryBuckets) => void;
  onQuickTopic: (topic: string) => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

// Small PIP face for agent/collapsed mode
function MelvinPIP({ isSpeaking, isListening, isThinking, onClick }: {
  isSpeaking: boolean; isListening: boolean; isThinking: boolean; onClick?: () => void;
}) {
  return (
    <motion.div
      layout
      onClick={onClick}
      className="relative overflow-hidden bg-[#0A0908] border-2 border-stone-800 cursor-pointer shrink-0"
      style={{ width: 80, height: 80, borderRadius: 8 }}
      whileHover={{ scale: 1.02 }}
    >
      <MelvinCharacter
        isSpeaking={isSpeaking}
        isListening={isListening}
        isThinking={isThinking}
      />
      {/* Active indicator */}
      {(isSpeaking || isListening) && (
        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-400 border border-stone-900" />
      )}
    </motion.div>
  );
}

// Voice controls strip
function VoiceControls({
  isMuted, isMicMuted, isListening, isMelvinSpeaking, isGenerating,
  spaceHeld, isTextMode,
  onMicTap, onMicRelease, onToggleMute, onToggleMic, onClearSession, onToggleTextMode,
  compact = false
}: any) {
  return (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3 justify-center'}`}>
      <button onClick={onToggleMute}
        className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border flex items-center justify-center transition-all cursor-pointer ${
          isMuted ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-stone-900 text-stone-300 border-stone-800 hover:border-stone-600'
        }`}>
        {isMuted ? <VolumeX className={compact ? 'w-3 h-3' : 'w-4 h-4'} /> : <Volume2 className={compact ? 'w-3 h-3' : 'w-4 h-4'} />}
      </button>

      <button onClick={onToggleMic}
        className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border flex items-center justify-center transition-all cursor-pointer ${
          isMicMuted ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-stone-900 text-emerald-400 border-stone-800'
        }`}>
        {isMicMuted ? <MicOff className={compact ? 'w-3 h-3' : 'w-4 h-4'} /> : <Mic className={compact ? 'w-3 h-3' : 'w-4 h-4'} />}
      </button>

      <motion.button
        onMouseDown={onMicTap}
        onMouseUp={onMicRelease}
        onTouchStart={onMicTap}
        onTouchEnd={onMicRelease}
        disabled={isGenerating || isMelvinSpeaking || isMicMuted}
        animate={isListening ? { scale: [1, 1.08, 1] } : { scale: 1 }}
        transition={{ repeat: isListening ? Infinity : 0, duration: 0.8 }}
        className={`${compact ? 'w-10 h-10' : 'w-14 h-14'} rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
          isListening ? 'bg-emerald-600 border-emerald-400'
          : isMicMuted || isGenerating || isMelvinSpeaking ? 'bg-stone-900 border-stone-800 opacity-40 cursor-not-allowed'
          : 'bg-[#7C3AED] border-purple-500 hover:bg-purple-600'
        }`}>
        {isListening
          ? <div className="flex gap-1"><span className={`${compact ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-white rounded-full animate-ping`} /></div>
          : <Mic className={`${compact ? 'w-3.5 h-3.5' : 'w-5 h-5'} text-white`} />
        }
      </motion.button>

      <button onClick={onToggleTextMode}
        className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full border flex items-center justify-center transition-all cursor-pointer ${
          isTextMode ? 'bg-purple-700 text-white border-purple-500' : 'bg-stone-900 text-stone-300 border-stone-800'
        }`}>
        <Keyboard className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>

      <button onClick={onClearSession}
        className={`${compact ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-rose-600 border border-rose-500 flex items-center justify-center text-white cursor-pointer hover:bg-rose-500`}>
        <PhoneOff className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
      </button>
    </div>
  );
}

export default function MelvinLayout(props: MelvinLayoutProps) {
  const {
    messages, isGenerating, isExtracting, memory, userId, historyRefreshTrigger,
    isMelvinSpeaking, isListening, isMuted, isMicMuted, spaceHeld, callDuration, isTextMode,
    currentTask, taskHistory,
    onSendMessage, onMicTap, onMicRelease, onToggleMute, onToggleMic,
    onClearSession, onToggleTextMode, onMemoryUpdate, onQuickTopic,
  } = props;

  const [mobileTab, setMobileTab] = useState<MobileTab>('call');
  const [inputText, setInputText] = useState('');
  const [agentMode, setAgentMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auto-switch to tasks tab when agent task starts
  useEffect(() => {
    if (currentTask && currentTask.status === 'running') {
      setAgentMode(true);
      if (isMobile) setMobileTab('tasks');
    }
  }, [currentTask?.status]);

  const callStatus = isGenerating ? 'THINKING' : isMelvinSpeaking ? 'SPEAKING' : isListening ? 'LISTENING' : 'CONNECTED';
  const statusColor = isGenerating ? 'text-amber-400' : isMelvinSpeaking ? 'text-purple-400' : isListening ? 'text-emerald-400' : 'text-stone-500';
  const lastMsg = messages[messages.length - 1];

  const handleTypedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // ── MOBILE LAYOUT ──────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex flex-col bg-[#0D0C0B] overflow-hidden" style={{ height: "100dvh", width: "100vw", position: "fixed", top: 0, left: 0 }}>

        {/* Top area -- changes based on tab */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="wait">

            {/* Call tab */}
            {mobileTab === 'call' && (
              <motion.div key="call" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col">
                {/* Status bar */}
                <div className="flex items-center gap-2 px-3 py-2 bg-[#E8E4DE] border-b-2 border-stone-900 shrink-0 z-10">
                  <div className="w-7 h-7 overflow-hidden rounded-lg border border-stone-900 shrink-0">
                    <img src="/src/assets/images/melvin_app_icon.png" alt="Melvin" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-xs text-stone-900 uppercase italic tracking-tight">Melvin</span>
                      <span className="font-mono text-[7px] font-black text-purple-700 bg-purple-100 border border-stone-900 px-1 uppercase">VOICE LINE</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                      <span className={`font-mono text-[8px] font-black uppercase tracking-wider ${statusColor}`}>{callStatus}</span>
                      <span className="text-stone-400 text-[8px] font-mono">{formatDuration(callDuration)}</span>
                    </div>
                  </div>
                  <button onClick={() => { setAgentMode(true); setMobileTab('tasks'); }}
                    className="flex items-center gap-1 px-2 py-1.5 bg-[#7C3AED] border border-purple-500 text-white text-[8px] font-mono font-black uppercase tracking-wider cursor-pointer rounded">
                    <Zap className="w-2.5 h-2.5" />
                    Tasks
                  </button>
                </div>

                {/* Face */}
                <div className="flex-1 relative">
                  {isTextMode ? (
                    <TextMode messages={messages} onSendMessage={onSendMessage} onReturnToVoice={onToggleTextMode} isGenerating={isGenerating} />
                  ) : (
                    <>
                      <MelvinCharacter isSpeaking={isMelvinSpeaking} isListening={isListening} isThinking={isGenerating} isMuted={isMuted} isMicMuted={isMicMuted} />
                      {/* Caption */}
                      <div className="absolute bottom-2 left-0 right-0 px-3 pointer-events-none flex justify-center">
                        <AnimatePresence mode="wait">
                          {isMelvinSpeaking && lastMsg?.role === 'assistant' ? (
                            <motion.div key={lastMsg.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                              className="bg-black/65 backdrop-blur-md px-3 py-2 w-full text-center">
                              <p className="text-white text-[11px] leading-relaxed">
                                "{lastMsg.content.length > 100 ? lastMsg.content.slice(0, 100) + '...' : lastMsg.content}"
                              </p>
                            </motion.div>
                          ) : isListening ? (
                            <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                              className="bg-black/55 px-3 py-1.5 flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                              <span className="text-emerald-400 text-[9px] font-mono uppercase tracking-widest">Listening...</span>
                            </motion.div>
                          ) : isGenerating ? (
                            <motion.div key="thinking" animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.4 }}
                              className="bg-black/55 px-3 py-1.5 flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                              <span className="text-purple-400 text-[9px] font-mono uppercase tracking-widest">Thinking...</span>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    </>
                  )}
                </div>

                {/* Controls */}
                <div className="px-4 py-4 bg-stone-950 border-t border-stone-900 shrink-0">
                  <div className="flex justify-center items-end h-4 gap-px mb-3">
                    {isMelvinSpeaking || isListening || isGenerating ? (
                      Array.from({ length: 16 }).map((_, i) => (
                        <motion.div key={i}
                          animate={{ height: [3, isMelvinSpeaking ? 16 : 12, 3] }}
                          transition={{ repeat: Infinity, duration: 0.3 + Math.random() * 0.4, delay: i * 0.02 }}
                          className={`w-0.5 rounded-full ${isMelvinSpeaking ? 'bg-purple-500' : isListening ? 'bg-emerald-500' : 'bg-amber-500 opacity-50'}`}
                        />
                      ))
                    ) : <div className="w-10 h-px bg-stone-800" />}
                  </div>
                  <VoiceControls {...{ isMuted, isMicMuted, isListening, isMelvinSpeaking, isGenerating, spaceHeld, isTextMode }}
                    onMicTap={onMicTap} onMicRelease={onMicRelease} onToggleMute={onToggleMute}
                    onToggleMic={onToggleMic} onClearSession={onClearSession} onToggleTextMode={onToggleTextMode} />
                  <div className="flex items-center justify-center gap-2 mt-2.5">
                    <span className="text-[8px] font-mono text-stone-600 uppercase">Hold</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 text-stone-400 text-[7px] font-mono rounded">SPACE</kbd>
                    <span className="text-[8px] font-mono text-stone-600 uppercase">to talk</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Memory tab */}
            {mobileTab === 'memory' && (
              <motion.div key="memory" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 bg-[#F5F0E8]">
                <MemoryPanel memory={memory} onAsk={(q) => { onQuickTopic(q); setMobileTab('call'); }}
                  isExtracting={isExtracting} onMemoryUpdate={onMemoryUpdate}
                  userId={userId} historyRefreshTrigger={historyRefreshTrigger} />
              </motion.div>
            )}

            {/* Tasks tab */}
            {mobileTab === 'tasks' && (
              <motion.div key="tasks" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 flex flex-col">
                {/* PIP in tasks mode */}
                <div className="flex items-center gap-3 px-4 py-3 bg-stone-950 border-b border-stone-800 shrink-0">
                  <MelvinPIP isSpeaking={isMelvinSpeaking} isListening={isListening} isThinking={isGenerating}
                    onClick={() => setMobileTab('call')} />
                  <div>
                    <p className="text-white text-[11px] font-bold">Melvin</p>
                    <p className={`text-[9px] font-mono uppercase tracking-wider ${statusColor}`}>{callStatus}</p>
                  </div>
                  <button onClick={() => setMobileTab('call')}
                    className="ml-auto text-[9px] font-mono text-stone-500 uppercase tracking-wider cursor-pointer hover:text-stone-300 flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Back to call
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <AgentPanel currentTask={currentTask} taskHistory={taskHistory} isMobile={true} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom tab bar */}
        <div className="flex border-t-2 border-stone-900 bg-stone-950 shrink-0">
          {([
            { key: 'call', icon: <Video className="w-4 h-4" />, label: 'Call' },
            { key: 'memory', icon: <span className="text-sm">📋</span>, label: 'Memory' },
            { key: 'tasks', icon: <Zap className="w-4 h-4" />, label: 'Tasks' },
          ] as { key: MobileTab; icon: React.ReactNode; label: string }[]).map(tab => (
            <button key={tab.key} onClick={() => setMobileTab(tab.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-all cursor-pointer ${
                mobileTab === tab.key ? 'text-purple-400' : 'text-stone-600 hover:text-stone-400'
              }`}>
              {tab.icon}
              <span className="text-[8px] font-mono uppercase tracking-wider">{tab.label}</span>
              {tab.key === 'tasks' && currentTask?.status === 'running' && (
                <div className="absolute top-1 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── DESKTOP LAYOUT ─────────────────────────────────────────────────────────
  return (
    <div className="flex w-full h-[720px] font-sans select-none">

      {/* LEFT: Melvin face -- full in companion mode, PIP in agent mode */}
      <AnimatePresence mode="wait">
        {agentMode ? (
          // PIP column -- square video call view when agent mode active
          <motion.div
            key="pip"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex flex-col bg-[#0D0C0B] border-4 border-stone-900 overflow-hidden shrink-0"
          >
            {/* Mini status */}
            <div className="px-3 py-2 bg-stone-950 border-b border-stone-900 shrink-0">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className={`font-mono text-[8px] font-black uppercase tracking-wider ${statusColor}`}>{callStatus}</span>
              </div>
              <span className="font-mono text-[8px] text-stone-600 tabular-nums">{formatDuration(callDuration)}</span>
            </div>

            {/* Face -- cropped, PIP style */}
            <div className="flex-1 relative overflow-hidden min-h-0">
              {isTextMode ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-950 p-3">
                  <MessageSquare className="w-6 h-6 text-stone-700 mb-2" />
                  <p className="text-[8px] text-stone-500 font-mono text-center">Text mode</p>
                </div>
              ) : (
                <MelvinCharacter isSpeaking={isMelvinSpeaking} isListening={isListening} isThinking={isGenerating} isMuted={isMuted} isMicMuted={isMicMuted} />
              )}
            </div>

            {/* Compact controls */}
            <div className="px-3 py-3 bg-stone-950 border-t border-stone-900 shrink-0">
              <VoiceControls compact {...{ isMuted, isMicMuted, isListening, isMelvinSpeaking, isGenerating, spaceHeld, isTextMode }}
                onMicTap={onMicTap} onMicRelease={onMicRelease} onToggleMute={onToggleMute}
                onToggleMic={onToggleMic} onClearSession={onClearSession} onToggleTextMode={onToggleTextMode} />
            </div>

            {/* Return to full call */}
            <button onClick={() => setAgentMode(false)}
              className="px-3 py-2 bg-stone-900 border-t border-stone-800 text-[8px] font-mono text-stone-500 uppercase tracking-wider cursor-pointer hover:text-white hover:bg-stone-800 transition-all flex items-center justify-center gap-1.5">
              <Video className="w-3 h-3" />
              Full call view
            </button>
          </motion.div>
        ) : (
          // Full call column
          <motion.div
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col bg-[#0D0C0B] border-4 border-stone-900 overflow-hidden shrink-0"
            style={{ width: 480 }}
          >
            {/* Status bar */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-stone-950/95 border-b border-stone-900 z-20 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full block animate-pulse" />
                  <span className="absolute -inset-0.5 bg-green-500/40 rounded-full animate-ping" />
                </div>
                <span className="font-mono text-[10px] font-bold text-stone-300 uppercase tracking-wider">Voice Call</span>
                <span className="text-stone-700">·</span>
                <span className="font-mono text-[10px] tabular-nums text-stone-400">{formatDuration(callDuration)}</span>
                <span className="text-stone-700">·</span>
                <span className={`font-mono text-[10px] font-black uppercase tracking-widest ${statusColor}`}>{callStatus}</span>
              </div>
              <button onClick={() => setAgentMode(true)}
                className="flex items-center gap-1 px-2 py-1 bg-stone-900 border border-stone-800 text-stone-400 hover:text-white text-[9px] font-mono uppercase tracking-wider cursor-pointer transition-all">
                <Zap className="w-3 h-3" />
                Agent
              </button>
            </div>

            {/* Face */}
            <div className="flex-1 relative overflow-hidden min-h-0" style={{ minHeight: 0 }}>
              {isTextMode ? (
                <TextMode messages={messages} onSendMessage={onSendMessage} onReturnToVoice={onToggleTextMode} isGenerating={isGenerating} />
              ) : (
                <>
                  <div className="absolute inset-0">
                  <MelvinCharacter isSpeaking={isMelvinSpeaking} isListening={isListening} isThinking={isGenerating} isMuted={isMuted} isMicMuted={isMicMuted} />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 z-10 pb-3 px-3 pointer-events-none flex flex-col items-center" style={{ zIndex: 10 }}>
                    <AnimatePresence mode="wait">
                      {isMelvinSpeaking && lastMsg?.role === 'assistant' ? (
                        <motion.div key={lastMsg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                          className="bg-black/65 backdrop-blur-md px-3 py-2 w-full text-center">
                          <p className="text-white text-[11px] leading-relaxed font-medium">
                            "{lastMsg.content.length > 120 ? lastMsg.content.slice(0, 120) + '...' : lastMsg.content}"
                          </p>
                        </motion.div>
                      ) : isListening ? (
                        <motion.div key="listening" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="bg-black/55 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                          <span className="text-emerald-400 text-[9px] font-mono font-black uppercase tracking-widest">
                            {spaceHeld ? 'Release to send' : 'Listening...'}
                          </span>
                        </motion.div>
                      ) : isGenerating ? (
                        <motion.div key="thinking" initial={{ opacity: 0 }}
                          animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.4 }}
                          className="bg-black/55 backdrop-blur-sm px-3 py-1.5 flex items-center gap-1.5">
                          <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
                          <span className="text-purple-400 text-[9px] font-mono font-black uppercase tracking-widest">Thinking...</span>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="shrink-0 bg-stone-950 border-t border-stone-900 px-4 py-3 z-20">
              <div className="flex justify-center items-end h-5 gap-px mb-3">
                {isMelvinSpeaking || isListening || isGenerating ? (
                  Array.from({ length: 20 }).map((_, i) => (
                    <motion.div key={i}
                      animate={{ height: [3, isMelvinSpeaking ? 18 : isListening ? 14 : 10, 3] }}
                      transition={{ repeat: Infinity, duration: 0.3 + Math.random() * 0.4, delay: i * 0.02 }}
                      className={`w-0.5 rounded-full ${isMelvinSpeaking ? 'bg-purple-500' : isListening ? 'bg-emerald-500' : 'bg-amber-500 opacity-50'}`}
                    />
                  ))
                ) : <div className="w-12 h-px bg-stone-800" />}
              </div>
              <VoiceControls {...{ isMuted, isMicMuted, isListening, isMelvinSpeaking, isGenerating, spaceHeld, isTextMode }}
                onMicTap={onMicTap} onMicRelease={onMicRelease} onToggleMute={onToggleMute}
                onToggleMic={onToggleMic} onClearSession={onClearSession} onToggleTextMode={onToggleTextMode} />
              <div className="flex items-center justify-center gap-2 mt-2.5">
                {!isMicMuted && !isListening && !isGenerating && !isMelvinSpeaking ? (
                  <>
                    <span className="text-[8px] font-mono text-stone-600 uppercase tracking-wider">Hold</span>
                    <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 text-stone-400 text-[8px] font-mono rounded">SPACE</kbd>
                    <span className="text-[8px] font-mono text-stone-600 uppercase tracking-wider">or tap mic</span>
                  </>
                ) : isMicMuted ? (
                  <span className="text-[8px] font-mono text-amber-500 uppercase tracking-wider">Mic muted</span>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER: Agent workspace (always visible on desktop when agent mode, hidden when companion) */}
      <AnimatePresence>
        {agentMode && (
          <motion.div
            key="agent-workspace"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 420, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="flex flex-col bg-[#0E0D0C] border-4 border-l-0 border-stone-900 overflow-hidden shrink-0"
          >
            <AgentPanel
              currentTask={currentTask}
              taskHistory={taskHistory}
              onClose={() => setAgentMode(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* RIGHT: Memory panel -- always visible */}
      <div className="flex-1 border-4 border-l-0 border-stone-900 overflow-hidden min-w-[260px]">
        <MemoryPanel
          memory={memory}
          onAsk={onQuickTopic}
          isExtracting={isExtracting}
          onMemoryUpdate={onMemoryUpdate}
          userId={userId}
          historyRefreshTrigger={historyRefreshTrigger}
        />
      </div>
    </div>
  );
}