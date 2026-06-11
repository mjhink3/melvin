/**
 * MelvinErrorBoundary.tsx
 * Catches React crashes and shows Melvin's voicemail instead of white screen.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'motion/react';
import melvinIcon from '../assets/images/melvin_app_icon.png';

interface Props { children: ReactNode; }
interface State { hasError: boolean; errorMessage: string; }

const VOICEMAIL_LINES = [
  "Hey, you've reached Melvin. I can't get to the phone right now — something's gone a bit sideways on my end. Leave a message and I'll sort it. Or just refresh. That usually works.",
  "Hi, this is Melvin. Can't pick up at the moment. There's been a small technical situation. Nothing serious. Probably. Try refreshing the page and I'll be right back.",
  "You've reached Melvin's voicemail. I appear to be temporarily unavailable due to circumstances I can only describe as dodgy. Please refresh and try again. Cheers.",
  "Ah. You've hit my voicemail. Something's gone pear-shaped on my end. It's not you. It's definitely something I did. Refresh the page and let's try this again.",
  "This is Melvin. Can't talk right now — there's been a bit of a situation. The goats are looking into it. In the meantime, refresh the page. I'll be here.",
];

function getVoicemailLine(): string {
  return VOICEMAIL_LINES[Math.floor(Math.random() * VOICEMAIL_LINES.length)];
}

export default class MelvinErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: getVoicemailLine() };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true, errorMessage: getVoicemailLine() };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Melvin crashed:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-[#141211] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full"
        >
          {/* Voicemail card */}
          <div className="bg-stone-950 border-4 border-stone-800 p-6 space-y-5">

            {/* Header */}
            <div className="flex items-center gap-3 border-b border-stone-800 pb-4">
              <div className="w-10 h-10 overflow-hidden rounded-lg border border-stone-700 shrink-0">
                <img src={melvinIcon} alt="Melvin" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-white font-bold text-sm">Melvin</p>
                <p className="text-stone-500 font-mono text-[9px] uppercase tracking-wider">Voicemail · Just now</p>
              </div>
              {/* Voicemail indicator */}
              <div className="ml-auto flex items-center gap-1.5">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="w-2 h-2 bg-[#7C3AED] rounded-full"
                />
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider">New</span>
              </div>
            </div>

            {/* Waveform decoration */}
            <div className="flex items-center gap-px h-8">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-stone-700 rounded-full"
                  style={{ height: `${8 + Math.sin(i * 0.8) * 8 + Math.random() * 8}px` }}
                />
              ))}
            </div>

            {/* Message */}
            <p className="text-stone-300 text-sm leading-relaxed font-medium italic">
              "{this.state.errorMessage}"
            </p>

            {/* Timestamp */}
            <p className="text-stone-600 font-mono text-[9px] uppercase tracking-wider">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Refresh button */}
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#7C3AED] hover:bg-purple-600 text-white font-mono font-black text-[10px] uppercase tracking-widest border border-purple-500 transition-all cursor-pointer"
            >
              Call back (refresh)
            </button>
          </div>

          <p className="text-stone-700 text-[9px] font-mono text-center mt-3 uppercase tracking-widest">
            © 2026 Melvin. No dashboards. Just companionship.
          </p>
        </motion.div>
      </div>
    );
  }
}