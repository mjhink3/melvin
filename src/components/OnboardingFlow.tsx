/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PersonalitySettings } from '../types';
import { Sliders, Flame, Heart, Sparkles, Compass, CheckCircle2, Trophy, BrainCircuit } from 'lucide-react';
import { motion } from 'motion/react';

interface OnboardingFlowProps {
  onComplete: (settings: PersonalitySettings) => void;
  initialSettings?: PersonalitySettings;
}

export default function OnboardingFlow({ onComplete, initialSettings }: OnboardingFlowProps) {
  const [settings, setSettings] = useState<PersonalitySettings>(initialSettings || {
    challenge_level: 'medium',
    humor: 'medium',
    warmth: 'high',
    directness: 'medium',
    career_focus: true,
    personal_growth_focus: true,
  });

  const [step, setStep] = useState(1);

  const handleSliderChange = (key: keyof PersonalitySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleComplete = () => {
    onComplete(settings);
  };

  return (
    <div className="max-w-xl mx-auto bg-[#FAF7F2] border-4 border-stone-900 brutalist-shadow rounded-none overflow-hidden font-sans">
      {/* Header */}
      <div className="p-6 bg-[#E8E4DE] border-b-4 border-stone-900 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BrainCircuit className="h-6 w-6 text-purple-700" />
          <span className="font-display font-black text-stone-900 tracking-tight text-lg uppercase italic">Calibrate Melvin</span>
        </div>
        <span className="font-mono text-xs text-stone-900 bg-white px-3 py-1 font-black border-2 border-stone-900 rounded-none">
          STEP {step} OF 2
        </span>
      </div>

      {step === 1 ? (
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="font-display font-black text-2xl text-stone-900 uppercase tracking-tight">Set Up Companion Slates</h2>
            <p className="text-stone-850 text-sm leading-relaxed font-medium">
              Melvin is a warm, calm, and thoughtful companion. He uses these dials to influence how he relates to your goals, shares ideas, and acts as a trusted friend.
            </p>
          </div>

          <div className="space-y-6 pt-2">
            {/* Directness Slider */}
            <div className="space-y-3 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none">
              <div className="flex justify-between items-center text-sm border-b border-stone-200 pb-1.5">
                <span className="font-black text-stone-900 flex items-center gap-1.5 font-display uppercase tracking-wider text-xs">
                  <Flame className="w-4 h-4 text-orange-600" /> Directness
                </span>
                <span className="font-mono text-xs uppercase font-black text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200">
                  {settings.directness}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSliderChange('directness', level)}
                    className={`py-2 px-3 rounded-none text-xs font-black uppercase font-mono border-2 transition-all cursor-pointer ${
                      settings.directness === level
                        ? 'bg-purple-700 text-white border-stone-900 brutalist-shadow-sm'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
                    }`}
                  >
                    {level === 'low' ? 'Diplomatic' : level === 'medium' ? 'Honest' : 'Raw Clarity'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-605 italic mt-1 font-medium">
                {settings.directness === 'high' ? 'Honest insights shared with humble clarity, prioritizing secure and conversational trust first.' : settings.directness === 'medium' ? 'Honest and forward, but framed to be warm, approachable, and friendly.' : 'Careful, diplomatic timing to lead you to your own realizations naturally.'}
              </p>
            </div>

            {/* Challenge Level */}
            <div className="space-y-3 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none">
              <div className="flex justify-between items-center text-sm border-b border-stone-200 pb-1.5">
                <span className="font-black text-stone-900 flex items-center gap-1.5 font-display uppercase tracking-wider text-xs">
                  <Trophy className="w-4 h-4 text-purple-600" /> Challenge Rigor
                </span>
                <span className="font-mono text-xs uppercase font-black text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200">
                  {settings.challenge_level}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSliderChange('challenge_level', level)}
                    className={`py-2 px-3 rounded-none text-xs font-black uppercase font-mono border-2 transition-all cursor-pointer ${
                      settings.challenge_level === level
                        ? 'bg-purple-700 text-white border-stone-900 brutalist-shadow-sm'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
                    }`}
                  >
                    {level === 'low' ? 'Gentle' : level === 'medium' ? 'Active' : 'Deep Insight'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-605 italic mt-1 font-medium">
                {settings.challenge_level === 'high' ? 'Invites collaborative, deep reflection on complex topics once a supportive connection is formed.' : settings.challenge_level === 'medium' ? 'Gently supports you while acting as a friendly sounding board to explore ideas.' : 'Listens with extreme patience, cozy warmth, and soft, open-ended presence.'}
              </p>
            </div>

            {/* Humor Level */}
            <div className="space-y-3 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none">
              <div className="flex justify-between items-center text-sm border-b border-stone-200 pb-1.5">
                <span className="font-black text-stone-900 flex items-center gap-1.5 font-display uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4 text-[#7C3AED]" /> Dry Humor
                </span>
                <span className="font-mono text-xs uppercase font-black text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200">
                  {settings.humor}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSliderChange('humor', level)}
                    className={`py-2 px-3 rounded-none text-xs font-black uppercase font-mono border-2 transition-all cursor-pointer ${
                      settings.humor === level
                        ? 'bg-purple-700 text-white border-stone-900 brutalist-shadow-sm'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
                    }`}
                  >
                    {level === 'low' ? 'Sober' : level === 'medium' ? 'Amused Goat' : 'High Wit'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-605 italic mt-1 font-medium">
                {settings.humor === 'high' ? 'Dry, ironic amusement. Helpful goat metaphors and lighthearted cynicism.' : settings.humor === 'medium' ? 'Subtle, friendly wit when you are overcomplicating things.' : 'Sober, steady focus without jokes.'}
              </p>
            </div>

            {/* Warmth Level */}
            <div className="space-y-3 bg-white p-5 border-2 border-stone-900 brutalist-shadow-sm rounded-none">
              <div className="flex justify-between items-center text-sm border-b border-stone-200 pb-1.5">
                <span className="font-black text-stone-900 flex items-center gap-1.5 font-display uppercase tracking-wider text-xs">
                  <Heart className="w-4 h-4 text-rose-600" /> Companionship Warmth
                </span>
                <span className="font-mono text-xs uppercase font-black text-purple-700 bg-purple-50 px-2 py-0.5 border border-purple-200">
                  {settings.warmth}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => handleSliderChange('warmth', level)}
                    className={`py-2 px-3 rounded-none text-xs font-black uppercase font-mono border-2 transition-all cursor-pointer ${
                      settings.warmth === level
                        ? 'bg-purple-700 text-white border-stone-900 brutalist-shadow-sm'
                        : 'bg-white hover:bg-stone-50 text-stone-700 border-stone-300'
                    }`}
                  >
                    {level === 'low' ? 'Stoic' : level === 'medium' ? 'Grounded' : 'Deep Devotion'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-605 italic mt-1 font-medium">
                {settings.warmth === 'high' ? 'Deep care, cozy companionship, and authentic conversational appreciation first.' : settings.warmth === 'medium' ? 'Calm, friendly, and emotionally steady presence.' : 'Stoic observation. Free from warm sentiment.'}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              id="next_step_onboard"
              onClick={() => setStep(2)}
              className="w-full bg-stone-900 hover:bg-[#7C3AED] hover:text-white text-white py-4 px-6 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all brutalist-shadow flex items-center justify-center space-x-2 cursor-pointer rounded-none font-display"
            >
              <span>Next: Set Focus Scopes</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h2 className="font-display font-black text-2xl text-stone-900 uppercase tracking-tight">Set Focus Domains</h2>
            <p className="text-stone-850 text-sm leading-relaxed font-medium">
              Tell Melvin what parts of your life are most important to you. He will focus on being a supportive companion and sounding board for these domains.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {/* Career Focus */}
            <div 
              onClick={() => handleSliderChange('career_focus', !settings.career_focus)}
              className={`p-5 rounded-none border-2 transition-all cursor-pointer flex items-start gap-4 ${
                settings.career_focus 
                  ? 'bg-purple-50 border-stone-900 brutalist-shadow-sm' 
                  : 'bg-white hover:bg-stone-50 border-stone-300'
              }`}
            >
              <div className={`p-2.5 rounded-none border-2 ${settings.career_focus ? 'bg-purple-100 border-stone-900' : 'bg-stone-50 border-stone-300'}`}>
                <Compass className={`h-5 w-5 ${settings.career_focus ? 'text-purple-700' : 'text-stone-400'}`} />
              </div>
              <div className="space-y-1 select-none">
                <div className="flex items-center space-x-2">
                  <span className="font-display font-black uppercase tracking-wide text-xs text-stone-900">Professional Alignment</span>
                  {settings.career_focus && (
                    <span className="bg-purple-900 text-white text-[9px] font-black font-mono px-2 py-0.5 border border-stone-900 uppercase tracking-wider">ENABLED</span>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  Focus on career aspirations, creative direction, professional systems, and plans for healthy career growth in a collaborative space.
                </p>
              </div>
            </div>

            {/* Personal Growth Focus */}
            <div 
              onClick={() => handleSliderChange('personal_growth_focus', !settings.personal_growth_focus)}
              className={`p-5 rounded-none border-2 transition-all cursor-pointer flex items-start gap-4 ${
                settings.personal_growth_focus 
                  ? 'bg-purple-50 border-stone-900 brutalist-shadow-sm' 
                  : 'bg-white hover:bg-stone-50 border-stone-300'
              }`}
            >
              <div className={`p-2.5 rounded-none border-2 ${settings.personal_growth_focus ? 'bg-purple-100 border-stone-900' : 'bg-stone-50 border-stone-300'}`}>
                <Sliders className={`h-5 w-5 ${settings.personal_growth_focus ? 'text-purple-700' : 'text-stone-400'}`} />
              </div>
              <div className="space-y-1 select-none">
                <div className="flex items-center space-x-2">
                  <span className="font-display font-black uppercase tracking-wide text-xs text-stone-900">Reflection & Habit Alignment</span>
                  {settings.personal_growth_focus && (
                    <span className="bg-purple-900 text-white text-[9px] font-black font-mono px-2 py-0.5 border border-stone-900 uppercase tracking-wider">ENABLED</span>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-medium">
                  Focus on daily self-reflection, mindsets, relationships, positive active habits, and healthy routines inside a friendly conversation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#FAF7F2] p-5 border-2 border-stone-900 rounded-none text-xs text-stone-800 space-y-2">
            <div className="font-black flex items-center text-purple-700 font-mono uppercase text-[10px] tracking-widest border-b border-stone-200 pb-1">
              <CheckCircle2 className="w-4 h-4 text-purple-700 mr-1.5" /> Dynamic Onboarding Preset
            </div>
            <p className="leading-relaxed font-medium">
              Based on your configuration, Melvin is initialized with: <span className="font-black text-purple-700 font-mono uppercase">{settings.directness} directness</span>, <span className="font-black text-purple-700 font-mono uppercase">{settings.challenge_level} challenge</span>, <span className="font-black text-purple-700 font-mono uppercase">{settings.humor} humor</span>, and <span className="font-black text-purple-700 font-mono uppercase">{settings.warmth} warmth</span>. He will provide <span className="font-bold underline text-stone-900">supportive & companionate guidance</span>.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-5 py-3 border-2 border-stone-900 bg-white text-stone-900 hover:bg-stone-100 font-black uppercase text-xs tracking-widest transition-all rounded-none cursor-pointer"
            >
              Back
            </button>
            <button
              type="button"
              id="complete_onboard"
              onClick={handleComplete}
              className="flex-1 bg-stone-900 hover:bg-[#7C3AED] hover:text-white text-white py-4 px-6 border-2 border-stone-900 font-black uppercase text-xs tracking-widest transition-all brutalist-shadow flex items-center justify-center space-x-2 cursor-pointer rounded-none font-display"
            >
              <span>Initialize Melvin Companion</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
