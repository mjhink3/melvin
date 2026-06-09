/**
 * PrivacyPage.tsx
 * Privacy policy -- Melvin-voiced, honest, no corporate nonsense.
 */

import React from 'react';
import { motion } from 'motion/react';

interface PrivacyPageProps {
  onClose: () => void;
}

export default function PrivacyPage({ onClose }: PrivacyPageProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-stone-950 border-4 border-stone-800 max-w-lg w-full my-4"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-white font-display font-black text-lg uppercase tracking-tight italic">Privacy</h2>
            <p className="text-purple-400 font-mono text-[9px] uppercase tracking-widest">What Melvin knows. What we don't.</p>
          </div>
          <button onClick={onClose} className="text-stone-500 hover:text-white transition-colors cursor-pointer font-mono text-[10px] uppercase tracking-wider border border-stone-800 px-2.5 py-1 hover:border-stone-600">
            Close
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-6 text-stone-300 text-sm leading-relaxed">

          <div className="bg-[#7C3AED]/10 border border-purple-800 p-4">
            <p className="text-purple-300 font-bold text-[11px] uppercase tracking-wider mb-2 font-mono">The short version</p>
            <p className="text-stone-200">
              Melvin remembers your conversations. We don't read them. Your data is yours, stored privately under your account, and you can delete any piece of it whenever you want.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-black text-xs uppercase tracking-wider font-mono">What Melvin stores</h3>
            <p>When you talk to Melvin, he builds a memory of who you are -- your name if you share it, people you mention, things you're working on, how you're feeling, questions he wants to come back to. This lives in your private Firestore database, locked to your account. Only you can access it.</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-black text-xs uppercase tracking-wider font-mono">What we see</h3>
            <p>Honestly? Not much. We see that you logged in. We see aggregate usage numbers like session counts. We don't see what you and Melvin talk about. We can't -- the data is isolated to your UID at the database rules level. That's not a policy. That's the architecture.</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-black text-xs uppercase tracking-wider font-mono">Deleting your data</h3>
            <p>You can delete individual memory items directly from the memory panel -- hover over anything and hit the X. You can wipe everything with the reset button. If you want your account fully deleted, contact us and we'll sort it promptly. No faff.</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-black text-xs uppercase tracking-wider font-mono">Third parties</h3>
            <p>Melvin uses Firebase (Google) for authentication and storage, ElevenLabs for voice, and an AI inference provider to power his responses. Your conversation content passes through the AI provider to generate responses but is not stored by them beyond the immediate request. We don't sell your data. We don't share it with advertisers. There are no advertisers.</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-black text-xs uppercase tracking-wider font-mono">Melvin is not a therapist</h3>
            <p>He's a companion. He's not licensed, he doesn't diagnose, and he's not a substitute for professional mental health care. If you're in crisis, please reach out to a professional or a crisis line. Melvin will tell you the same thing.</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-white font-black text-xs uppercase tracking-wider font-mono">Questions</h3>
            <p>
              Contact us at{' '}
              <a href="mailto:michael@workgoat.vip" className="text-purple-400 hover:text-purple-300 underline">michael@workgoat.vip</a>
              . We're a small team and we'll actually respond.
            </p>
          </div>

          <div className="border-t border-stone-800 pt-4">
            <p className="text-stone-600 font-mono text-[9px] uppercase tracking-wider">
              Last updated: June 2026 · A WorkGOAT Ecosystem Product · workgoat.vip
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
