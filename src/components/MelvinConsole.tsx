/**
 * MelvinConsole.tsx
 * Voice + audio logic layer.
 * Delegates all rendering to MelvinLayout.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Message, PersonalitySettings } from '../types';
import { motion } from 'motion/react';
import MelvinLayout from './MelvinLayout';
import { MemoryBuckets } from './MemoryPanel';
import { AgentTask, AgentStep } from './AgentPanel';
import { getTextModeTransition } from './TextMode';

interface MelvinConsoleProps {
  messages: Message[];
  settings: PersonalitySettings;
  onUpdateSettings: (newSettings: PersonalitySettings) => void;
  onSendMessage: (message: string) => void;
  onClearSession: () => void;
  isGenerating: boolean;
  onQuickTopic: (topic: string) => void;
  memory: MemoryBuckets;
  isExtracting?: boolean;
  onMemoryUpdate?: (updated: MemoryBuckets) => void;
  userId?: string;
  historyRefreshTrigger?: number;
}

export default function MelvinConsole({
  messages, settings, onUpdateSettings, onSendMessage,
  onClearSession, isGenerating, onQuickTopic,
  memory, isExtracting = false, onMemoryUpdate,
  userId, historyRefreshTrigger,
}: MelvinConsoleProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMelvinSpeaking, setIsMelvinSpeaking] = useState(false);
  const [isTextMode, setIsTextMode] = useState(false);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [currentTask, setCurrentTask] = useState<AgentTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<AgentTask[]>([]);

  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isMicMutedRef = useRef(false);
  const isGeneratingRef = useRef(false);
  const isMelvinSpeakingRef = useRef(false);
  const isListeningRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const spokenMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => { isMicMutedRef.current = isMicMuted; }, [isMicMuted]);
  useEffect(() => { isGeneratingRef.current = isGenerating; }, [isGenerating]);
  useEffect(() => { isMelvinSpeakingRef.current = isMelvinSpeaking; }, [isMelvinSpeaking]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  // Call timer
  useEffect(() => {
    const interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for rate limit event
  useEffect(() => {
    const handler = () => {
      stopAudio();
      setIsTextMode(true);
    };
    window.addEventListener('melvin:ratelimit', handler);
    return () => window.removeEventListener('melvin:ratelimit', handler);
  }, []);

  const startListening = useCallback(() => {
    if (isMicMutedRef.current || isGeneratingRef.current || isMelvinSpeakingRef.current) return;
    if (isListeningRef.current) return;
    try { recognitionRef.current?.start(); } catch (e) {}
  }, []);

  const stopListening = useCallback(() => {
    try { recognitionRef.current?.stop(); } catch (e) {}
  }, []);

  // Speech recognition
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onstart = () => { setIsListening(true); isListeningRef.current = true; };
    rec.onresult = (e: any) => {
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else transcriptBufferRef.current = e.results[i][0].transcript;
      }
      if (final) transcriptBufferRef.current = final;
    };
    rec.onerror = () => { setIsListening(false); isListeningRef.current = false; };
    rec.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      const t = transcriptBufferRef.current.trim();
      if (t) { onSendMessage(t); transcriptBufferRef.current = ''; }
    };
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch (e) {} };
  }, [onSendMessage]);

  // Spacebar push-to-talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (spaceHeldRef.current) return;
      e.preventDefault();
      spaceHeldRef.current = true;
      setSpaceHeld(true);
      if (isMelvinSpeakingRef.current) stopAudio();
      startListening();
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      if (!spaceHeldRef.current) return;
      e.preventDefault();
      spaceHeldRef.current = false;
      setSpaceHeld(false);
      stopListening();
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startListening, stopListening]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsMelvinSpeaking(false);
  };

  const speakText = async (text: string) => {
    if (isMuted || isTextMode) return;
    stopAudio();
    const clean = text.replace(/[*#_~`>]/g, ' ').replace(/\n+/g, ' ').trim();
    if (!clean) return;
    try {
      setIsMelvinSpeaking(true);
      const res = await fetch('/api/melvin/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean }),
      });
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setIsMelvinSpeaking(false); URL.revokeObjectURL(url); };
      audio.onerror = () => { setIsMelvinSpeaking(false); };
      await audio.play();
    } catch (e) {
      console.error('TTS failed:', e);
      setIsMelvinSpeaking(false);
    }
  };

  // Auto-speak new assistant messages
  useEffect(() => {
    if (messages.length > 0 && !isGenerating && !isTextMode) {
      const last = messages[messages.length - 1];
      if (last.role === 'assistant' && !spokenMessageIds.current.has(last.id)) {
        spokenMessageIds.current.add(last.id);
        speakText(last.content);
      }
    }
  }, [messages, isGenerating, isTextMode]);

  const handleMicTap = () => {
    if (isMicMuted || isGenerating || isMelvinSpeaking) return;
    if (isListening) stopListening();
    else { if (isMelvinSpeaking) stopAudio(); startListening(); }
  };

  const handleMicRelease = () => {
    if (isListening) stopListening();
  };

  const toggleMic = () => {
    if (!isMicMuted && isListening) stopListening();
    setIsMicMuted(p => { isMicMutedRef.current = !p; return !p; });
  };

  const toggleMute = () => {
    if (!isMuted) stopAudio();
    setIsMuted(p => !p);
  };

  const toggleTextMode = () => {
    if (!isTextMode) {
      stopAudio();
      const line = getTextModeTransition();
      onSendMessage(line);
    }
    setIsTextMode(p => !p);
  };

  return (
    <MelvinLayout
      messages={messages}
      isGenerating={isGenerating}
      isExtracting={isExtracting}
      memory={memory}
      userId={userId}
      historyRefreshTrigger={historyRefreshTrigger}
      isMelvinSpeaking={isMelvinSpeaking}
      isListening={isListening}
      isMuted={isMuted}
      isMicMuted={isMicMuted}
      spaceHeld={spaceHeld}
      callDuration={callDuration}
      isTextMode={isTextMode}
      currentTask={currentTask}
      taskHistory={taskHistory}
      onSendMessage={onSendMessage}
      onMicTap={handleMicTap}
      onMicRelease={handleMicRelease}
      onToggleMute={toggleMute}
      onToggleMic={toggleMic}
      onClearSession={onClearSession}
      onToggleTextMode={toggleTextMode}
      onMemoryUpdate={onMemoryUpdate}
      onQuickTopic={onQuickTopic}
    />
  );
}