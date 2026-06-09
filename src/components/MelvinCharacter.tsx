/**
 * MelvinCharacter.tsx
 * Expression-driven character display -- 8 states, no mouth overlay
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

import melvinIdle from '../assets/images/melvin_idle.png';
import melvinListening from '../assets/images/melvin_listening.png';
import melvinThinking from '../assets/images/melvin_thinking.png';
import melvinSpeaking from '../assets/images/melvin_speaking.png';
import melvinDelight from '../assets/images/melvin_delight.png';
import melvinConcern from '../assets/images/melvin_concern.png';
import melvinSkeptical from '../assets/images/melvin_skeptical.png';
import melvinCaught from '../assets/images/melvin_caught.png';

export type MelvinExpression =
  | 'idle' | 'listening' | 'thinking' | 'speaking'
  | 'delight' | 'concern' | 'skeptical' | 'caught';

interface MelvinCharacterProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  isMuted?: boolean;
  isMicMuted?: boolean;
  forceExpression?: MelvinExpression;
}

const EXPRESSIONS: Record<MelvinExpression, string> = {
  idle: melvinIdle,
  listening: melvinListening,
  thinking: melvinThinking,
  speaking: melvinSpeaking,
  delight: melvinDelight,
  concern: melvinConcern,
  skeptical: melvinSkeptical,
  caught: melvinCaught,
};

const AMBIENT = {
  idle:      { scale: [1, 1.006, 1], y: [0, -2, 0],   d: 5.2 },
  listening: { scale: [1, 1.005, 1], y: [0, -1.5, 0], d: 4.4 },
  thinking:  { scale: [1, 1.006, 1], y: [0, -1.8, 0], d: 3.9 },
  speaking:  { scale: [1, 1.010, 1], y: [0, -2.5, 0], d: 2.9 },
  delight:   { scale: [1, 1.012, 1], y: [0, -3, 0],   d: 3.1 },
  concern:   { scale: [1, 1.003, 1], y: [0, -1, 0],   d: 5.8 },
  skeptical: { scale: [1, 1.005, 1], y: [0, -1.5, 0], d: 4.6 },
  caught:    { scale: [1, 1.015, 1], y: [0, -3.5, 0], d: 2.8 },
};

const RING_COLOR: Record<MelvinExpression, string> = {
  idle:      'rgba(124,58,237,0.25)',
  listening: 'rgba(16,185,129,0.35)',
  thinking:  'rgba(245,158,11,0.30)',
  speaking:  'rgba(124,58,237,0.45)',
  delight:   'rgba(167,139,250,0.50)',
  concern:   'rgba(239,68,68,0.25)',
  skeptical: 'rgba(124,58,237,0.30)',
  caught:    'rgba(251,191,36,0.40)',
};

function resolveExpression(
  isSpeaking: boolean,
  isListening: boolean,
  isThinking: boolean,
  force?: MelvinExpression
): MelvinExpression {
  if (force) return force;
  if (isSpeaking) return 'speaking';
  if (isThinking) return 'thinking';
  if (isListening) return 'listening';
  return 'idle';
}

export default function MelvinCharacter({
  isSpeaking, isListening, isThinking,
  isMuted = false, isMicMuted = false,
  forceExpression,
}: MelvinCharacterProps) {
  const expr = resolveExpression(isSpeaking, isListening, isThinking, forceExpression);
  const a = AMBIENT[expr];
  const ringColor = RING_COLOR[expr];
  const showRing = isSpeaking || isListening || isThinking;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0A0908] flex items-center justify-center">

      {/* Subtle background glow */}
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ repeat: Infinity, duration: a.d * 1.3, ease: 'easeInOut' }}
        style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 80% 70% at 50% 60%, ${ringColor.replace('0.', '0.0')}, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* Breathing container */}
      <motion.div
        animate={{ scale: a.scale, y: a.y }}
        transition={{ repeat: Infinity, duration: a.d, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Expression image -- properly centered */}
        <AnimatePresence mode="crossfade">
          <motion.img
            key={expr}
            src={EXPRESSIONS[expr]}
            alt={`Melvin ${expr}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 15%',
              filter: 'brightness(0.96) contrast(1.03) saturate(0.97)',
              userSelect: 'none',
              pointerEvents: 'none',
              display: 'block',
            }}
            draggable={false}
          />
        </AnimatePresence>

        {/* State ring */}
        <AnimatePresence>
          {showRing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.4, 0.75, 0.4] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: isSpeaking ? 1.6 : isListening ? 1.3 : 1.8 }}
              style={{
                position: 'absolute', inset: 0, pointerEvents: 'none',
                border: `2px solid ${ringColor}`,
                boxShadow: `inset 0 0 50px ${ringColor.replace('0.', '0.0')}`,
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Muted badge */}
      {isMuted && (
        <div style={{
          position: 'absolute', bottom: 10, right: 10,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          borderRadius: 3, padding: '2px 6px',
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#78716c', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700 }}>
            MUTED
          </span>
        </div>
      )}
    </div>
  );
}