/**
 * TextMode.tsx
 * Melvin text mode -- triggered on rate limit or manual toggle.
 * Dark branded chat UI. Same memory panel. No voice.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Mic } from 'lucide-react';

interface TextModeProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  onReturnToVoice: () => void;
  isGenerating: boolean;
}

// Lines Melvin uses when switching to text
export const TEXT_MODE_TRANSITIONS = [
  "Right, slight issue. Running low on minutes. You mind if we just text for a bit?",
  "Sorry mate, the voice is going to cut out. Can we text? Same me, less voice.",
  "Ah. Phone bill situation. I keep meaning to sort this out. Text me.",
  "Signal's going dodgy on my end. Let's just text -- you were saying?",
  "I'm going to lose the voice in a sec. Texting it is. Carry on.",
  "Right so apparently I've burned through my minutes again. Brilliant budgeting on my part. Text?",
  "Voice is cutting. Not ideal. But I'm still here. What were you saying?",
];

// Lines Melvin opens with in text mode after transition
export const TEXT_MODE_OPENINGS = [
  "Hey. Still here. You were saying?",
  "Right. Text mode. Slightly less glamorous but I'm still paying attention.",
  "Same me, different medium. Carry on.",
  "Still here mate. What's on your mind?",
  "Bit lo-fi but I'm listening. Go on.",
];

export function getTextModeOpening(): string {
  return TEXT_MODE_OPENINGS[Math.floor(Math.random() * TEXT_MODE_OPENINGS.length)];
}

export function getTextModeTransition(): string {
  return TEXT_MODE_TRANSITIONS[Math.floor(Math.random() * TEXT_MODE_TRANSITIONS.length)];
}

// Small Melvin avatar for text bubbles
function MelvinAvatar() {
  return (
    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-stone-700 shrink-0">
      <img src="/src/assets/images/melvin_app_icon.png" alt="Melvin" className="w-full h-full object-cover" />
    </div>
  );
}

export default function TextMode({
  messages,
  onSendMessage,
  onReturnToVoice,
  isGenerating,
}: TextModeProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isGenerating) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  // Only show messages from this session -- filter to last 30
  const visibleMessages = messages.slice(-30);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full bg-[#0D0C0B] overflow-hidden"
    >
      {/* Text mode header */}
      <div className="px-4 py-3 bg-stone-950/95 border-b border-stone-900 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <MelvinAvatar />
          <div>
            <p className="text-[11px] font-bold text-stone-100 leading-tight">Melvin</p>
            <p className="text-[9px] font-mono text-stone-500 uppercase tracking-wider">Text mode · voice unavailable</p>
          </div>
        </div>
        <button
          onClick={onReturnToVoice}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-900 border border-stone-700 text-stone-400 hover:text-white hover:border-stone-500 transition-all cursor-pointer text-[9px] font-mono font-black uppercase tracking-wider"
        >
          <Mic className="w-3 h-3" />
          Try voice
        </button>
      </div>

      {/* Message chain */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        <AnimatePresence initial={false}>
          {visibleMessages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {msg.role === 'assistant' && <MelvinAvatar />}

              <div className={`flex flex-col gap-0.5 max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {/* Timestamp */}
                <span className="text-[8px] font-mono text-stone-600 px-1">
                  {msg.timestamp}
                </span>

                {/* Bubble */}
                <div className={`px-3.5 py-2.5 text-[12px] leading-relaxed font-medium ${
                  msg.role === 'user'
                    ? 'bg-[#7C3AED] text-white rounded-2xl rounded-br-sm'
                    : 'bg-stone-800 text-stone-100 border border-stone-700 rounded-2xl rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2"
          >
            <MelvinAvatar />
            <div className="bg-stone-800 border border-stone-700 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-1.5 h-1.5 bg-stone-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 bg-stone-950 border-t border-stone-900">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <div className="flex-1 bg-stone-900 border border-stone-700 rounded-2xl px-4 py-2.5 focus-within:border-purple-600 transition-colors">
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Melvin..."
              disabled={isGenerating}
              rows={1}
              className="w-full bg-transparent text-stone-100 text-[13px] leading-relaxed placeholder-stone-600 outline-none resize-none font-medium"
              style={{ maxHeight: '100px', overflowY: 'auto' }}
            />
          </div>
          <button
            type="submit"
            disabled={!inputText.trim() || isGenerating}
            className="w-10 h-10 rounded-full bg-[#7C3AED] border border-purple-500 flex items-center justify-center text-white transition-all cursor-pointer hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[8px] font-mono text-stone-700 text-center mt-2 uppercase tracking-wider">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </motion.div>
  );
}