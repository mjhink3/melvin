import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import melvinAvatar from '../assets/images/melvin_avatar_1780176074703.png';

interface MelvinCharacterProps {
  isSpeaking: boolean;
  isListening: boolean;
  isThinking: boolean;
  isMuted?: boolean;
  isMicMuted?: boolean;
}

// Highly precise coordinates for Melvin's physical features in the 1:1 portrait block
// Coordinates can be adjusted in real-time in double-click Rig Calibration Mode
const DEFAULT_COORDS = {
  leftEyeX: 43.1,       // Viewer-left eye X
  leftEyeY: 44.5,       // Viewer-left eye Y
  leftEyeW: 4.2,        // Eye region width
  leftEyeH: 2.2,        // Eye region height
  
  rightEyeX: 52.6,      // Viewer-right eye X
  rightEyeY: 44.5,      // Viewer-right eye Y
  rightEyeW: 4.2,
  rightEyeH: 2.2,
  
  mouthX: 45.4,         // Mouth region X
  mouthY: 56.8,         // Mouth region Y
  mouthW: 9.2,          // Mouth region width
  mouthH: 4.6,          // Mouth region height

  // Blend colors designed to match Melvin's beautiful skin muzzle
  mouthSkinColor: '#ded8cf', // Goat muzzle tan-beige fur
};

const LOCAL_STORAGE_RIG_KEY = 'melvin_rig_coords_v5';

export default function MelvinCharacter({
  isSpeaking: externalIsSpeaking,
  isListening,
  isThinking,
  isMuted = false,
  isMicMuted = false
}: MelvinCharacterProps) {
  
  // Real-time editable coordinates loaded from LocalStorage
  const [coords, setCoords] = useState(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_RIG_KEY);
      if (stored) {
        return { ...DEFAULT_COORDS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Fallback default coordinates used', e);
    }
    return DEFAULT_COORDS;
  });

  const [mouthState, setMouthState] = useState<0 | 1 | 2 | 3>(0); // 0=Closed line, 1=Small, 2=Medium, 3=Wide

  // Rig adjustment diagnostic states
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [simulateSpeaking, setSimulateSpeaking] = useState(false);

  const isSpeaking = externalIsSpeaking || (isDebugMode && simulateSpeaking);

  // Persistence coordinate updater
  const updateCoord = (key: keyof typeof DEFAULT_COORDS, value: any) => {
    setCoords(prev => {
      const updated = { ...prev, [key]: value };
      localStorage.setItem(LOCAL_STORAGE_RIG_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetCoords = () => {
    setCoords(DEFAULT_COORDS);
    localStorage.setItem(LOCAL_STORAGE_RIG_KEY, JSON.stringify(DEFAULT_COORDS));
  };

  // 1. Multi-State Speech Mouth Progression (Cycles on exactly 100ms syllable intervals)
  useEffect(() => {
    if (!isSpeaking) {
      setMouthState(0);
      return;
    }

    // Natural conversation shape flow of open/close shapes
    const interval = setInterval(() => {
      // Rotate between state 1, 2, 3 with occasional brief closures (0) for natural syllables
      const nextPossibilities: (0 | 1 | 2 | 3)[] = [1, 2, 3, 2, 1, 3, 2, 0, 1, 2];
      const randomIndex = Math.floor(Math.random() * nextPossibilities.length);
      setMouthState(nextPossibilities[randomIndex]);
    }, 100); // 100ms frame duration

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#161514] select-none z-0 flex items-center justify-center">
      
      {/* 
        Aspect-bounded portrait box wrapper.
        Guarantees overlay coordinates remain perfectly centered and aligned 
        on top of Melvin's features across arbitrary window widths or dimensions.
      */}
      <div 
        onDoubleClick={() => setIsDebugMode(prev => !prev)}
        title="Double-click to open Calibration Editor"
        className="relative aspect-square h-full max-h-full max-w-full flex items-center justify-center overflow-hidden bg-[#161514] cursor-pointer"
      >
        <motion.div
          animate={{
            // 2. Very slow, subtle breathing and scale presence animation (no aggressive shaking)
            scale: isSpeaking
              ? [1.30, 1.315, 1.30, 1.318, 1.30]     // Slow, responsive scale expansion during speech (FaceTime crops)
              : isListening
              ? [1.30, 1.312, 1.30]                 // Attentive gentle micro-pulse
              : isThinking
              ? [1.30, 1.314, 1.30]                 // Contemplative heavy thinking breath
              : [1.30, 1.31, 1.30],                 // Standard vegetative idling background shift

            // 3. Subtle Head Floating posture
            y: isSpeaking
              ? [0, -1, 1, -0.5, 0]             // Tiny conversation kinetic float displacements
              : isListening
              ? [0, -0.6, 0]                     // Static focus listening float
              : isThinking
              ? [0, -0.8, 0]                     // Deep computing weight transition float
              : [0, -0.5, 0],                    // Standard resting drift
          }}
          transition={{
            repeat: Infinity,
            duration: isSpeaking ? 3.5 : isListening ? 4.2 : isThinking ? 3.8 : 5.0,
            ease: "easeInOut"
          }}
          className="w-full h-full relative flex items-center justify-center origin-center"
        >
          {/* Base Character Illustration Canvas */}
          <img
            src={melvinAvatar}
            alt="Melvin Companion"
            className="w-full h-full object-cover select-none filter brightness-[0.90] contrast-[1.05] saturate-[0.98]"
            referrerPolicy="no-referrer"
          />

          {/* 4. Soft Speaking Glow Ambient Layer */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.15, 0.32, 0.15] }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_52%,_rgba(168,85,247,0.18)_0%,_transparent_65%)] z-0 mix-blend-screen"
              />
            )}
          </AnimatePresence>

          {/* ========================================================= */}
          {/* 5. DEBUG MODE ONLY: EXPLICIT REGION BOX OUTLINES          */}
          {/* ========================================================= */}
          {isDebugMode && (
            <>
              {/* Left Eye Region Outline (Blue) */}
              <div 
                style={{ 
                  top: `${coords.leftEyeY}%`, 
                  left: `${coords.leftEyeX}%`, 
                  width: `${coords.leftEyeW}%`, 
                  height: `${coords.leftEyeH}%` 
                }}
                className="absolute border border-blue-500 bg-blue-500/10 z-20 pointer-events-none"
              >
                <span className="absolute -top-3.5 left-0 bg-blue-500 text-stone-950 font-mono text-[7px] px-0.5 uppercase tracking-wider scale-90 origin-left">
                  LeftEye
                </span>
              </div>

              {/* Right Eye Region Outline (Green) */}
              <div 
                style={{ 
                  top: `${coords.rightEyeY}%`, 
                  left: `${coords.rightEyeX}%`, 
                  width: `${coords.rightEyeW}%`, 
                  height: `${coords.rightEyeH}%` 
                }}
                className="absolute border border-green-500 bg-green-500/10 z-20 pointer-events-none"
              >
                <span className="absolute -top-3.5 left-0 bg-green-500 text-stone-950 font-mono text-[7px] px-0.5 uppercase tracking-wider scale-90 origin-left">
                  RightEye
                </span>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* 6. MOUTH REPLACEMENT OVERLAY                              */}
          {/* ========================================================= */}
          <div 
            style={{ 
              top: `${coords.mouthY}%`, 
              left: `${coords.mouthX}%`, 
              width: `${coords.mouthW}%`, 
              height: `${coords.mouthH}%` 
            }}
            className={`absolute flex items-center justify-center pointer-events-none transition-all duration-75 z-10 ${
              isDebugMode ? 'border border-red-500 bg-red-500/15' : ''
            }`}
          >
            {isDebugMode && (
              <span className="absolute -top-3.5 left-0 bg-red-500 text-stone-250 font-mono text-[7px] px-0.5 uppercase tracking-wider scale-90 origin-left z-20">
                Mouth
              </span>
            )}
            
            <div
              style={{ backgroundColor: coords.mouthSkinColor }}
              className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full shadow-inner border border-stone-800/10"
            >
              {/* Dynamic custom-shaped speech cavity based on mouthState */}
              {(!isSpeaking || mouthState === 0) && (
                /* STATE 0: Closed Lip Line */
                <div className="w-[60%] h-[3px] bg-[#3a342c]/90 opacity-95 rounded-full" />
              )}

              {isSpeaking && mouthState === 1 && (
                /* STATE 1: Small Open Oval */
                <div className="w-[38%] h-[35%] bg-[#240e11] rounded-full border border-black/10 flex items-center justify-center shadow-inner overflow-hidden">
                  <div className="w-[70%] h-[20%] bg-[#cb5664] rounded-t-full mt-auto mb-0.5 opacity-80" />
                </div>
              )}

              {isSpeaking && mouthState === 2 && (
                /* STATE 2: Medium Open Oval */
                <div className="w-[58%] h-[60%] bg-[#240e11] rounded-full border border-black/15 flex flex-col justify-between p-0.5 shadow-inner overflow-hidden">
                  <div className="w-[70%] h-[15%] bg-[#dedbd5]/90 rounded-sm self-center" />
                  <div className="w-[65%] h-[35%] bg-[#cb5664] rounded-t-full self-center" />
                </div>
              )}

              {isSpeaking && mouthState === 3 && (
                /* STATE 3: Wide Open Oval */
                <div className="w-[85%] h-[82%] bg-[#240e11] rounded-full border border-black/20 flex flex-col justify-between p-0.5 shadow-inner overflow-hidden"
                     style={{ borderRadius: '50% 50% 45% 45% / 45% 45% 55% 55%' }}>
                  <div className="w-[80%] h-[18%] bg-[#dedbd5] rounded-t-sm self-center" />
                  <div className="w-[70%] h-[40%] bg-[#cb5664] rounded-t-full self-center mb-0.5" />
                </div>
              )}
            </div>
          </div>

        </motion.div>
      </div>

      {/* Visual Calibration Editor Drawer Panel overlay, only visible if isDebugMode is activated */}
      <AnimatePresence>
        {isDebugMode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-16 right-4 z-50 w-80 bg-stone-950/95 backdrop-blur-xl border border-stone-800 p-4 shadow-2xl font-mono text-[10px] text-stone-200 select-text pointer-events-auto rounded-none max-h-[80%] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b border-stone-800 pb-2 mb-3">
              <span className="font-bold text-amber-500 tracking-wider">RIG CALIBRATOR V5</span>
              <button 
                onClick={() => setIsDebugMode(false)}
                className="px-1.5 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold"
              >
                CLOSE
              </button>
            </div>

            <p className="text-stone-400 mb-4 leading-relaxed text-[9px]">
              Double-click face viewport to close. Use sliders below to align regions beautifully.
            </p>

            {/* Test Simulation Controls */}
            <div className="bg-stone-900 border border-stone-800 p-2.5 mb-4 space-y-2">
              <span className="text-stone-400 font-bold block mb-1">TEST SPEECH SIMULATION</span>
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={simulateSpeaking} 
                  onChange={(e) => setSimulateSpeaking(e.target.checked)} 
                  className="accent-amber-500 scale-95"
                />
                <span className="text-stone-300">Simulate Speaking (Syllable loops)</span>
              </label>
            </div>

            {/* Left Eye Highlight Adjustments */}
            <div className="space-y-2 mb-4 border-b border-stone-900 pb-3">
              <span className="font-bold text-blue-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                LEFT EYE REGION (BLUE OUTLINE)
              </span>
              <div className="flex justify-between items-center text-stone-400">
                <span>X Position: {coords.leftEyeX}%</span>
                <input 
                  type="range" min="30" max="60" step="0.1"
                  value={coords.leftEyeX} 
                  onChange={(e) => updateCoord('leftEyeX', parseFloat(e.target.value))}
                  className="w-28 accent-blue-500"
                />
              </div>
              <div className="flex justify-between items-center text-stone-400">
                <span>Y Position: {coords.leftEyeY}%</span>
                <input 
                  type="range" min="30" max="60" step="0.1"
                  value={coords.leftEyeY} 
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    updateCoord('leftEyeY', val);
                    updateCoord('rightEyeY', val); // Keep Y axis aligned!
                  }}
                  className="w-28 accent-blue-500"
                />
              </div>
              <div className="flex justify-between items-center text-stone-350">
                <span>Dimensions (W x H)</span>
                <div className="flex space-x-1">
                  <span className="text-[9px] text-stone-500">W:</span>
                  <input 
                    type="range" min="1" max="10" step="0.1" value={coords.leftEyeW} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateCoord('leftEyeW', val);
                      updateCoord('rightEyeW', val); // Keep widths symmetric!
                    }}
                    className="w-12 accent-stone-400"
                  />
                  <span className="text-[9px] text-stone-500">H:</span>
                  <input 
                    type="range" min="1" max="8" step="0.1" value={coords.leftEyeH} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      updateCoord('leftEyeH', val);
                      updateCoord('rightEyeH', val); // Keep heights symmetric!
                    }}
                    className="w-12 accent-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* Right Eye Adjustments */}
            <div className="space-y-2 mb-4 border-b border-stone-900 pb-3">
              <span className="font-bold text-green-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                RIGHT EYE REGION (GREEN OUTLINE)
              </span>
              <div className="flex justify-between items-center text-stone-400">
                <span>X Position: {coords.rightEyeX}%</span>
                <input 
                  type="range" min="45" max="70" step="0.1"
                  value={coords.rightEyeX} 
                  onChange={(e) => updateCoord('rightEyeX', parseFloat(e.target.value))}
                  className="w-28 accent-green-500"
                />
              </div>
            </div>

            {/* Mouth Adjustments */}
            <div className="space-y-2 mb-4 border-b border-stone-900 pb-3">
              <span className="font-bold text-red-400 flex items-center">
                <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
                MOUTH OVERLAY REGION (RED OUTLINE)
              </span>
              <div className="flex justify-between items-center text-stone-400">
                <span>X Position: {coords.mouthX}%</span>
                <input 
                  type="range" min="35" max="55" step="0.1"
                  value={coords.mouthX} 
                  onChange={(e) => updateCoord('mouthX', parseFloat(e.target.value))}
                  className="w-28 accent-red-500"
                />
              </div>
              <div className="flex justify-between items-center text-stone-400">
                <span>Y Position: {coords.mouthY}%</span>
                <input 
                  type="range" min="45" max="70" step="0.1"
                  value={coords.mouthY} 
                  onChange={(e) => updateCoord('mouthY', parseFloat(e.target.value))}
                  className="w-28 accent-red-500"
                />
              </div>
              <div className="flex justify-between items-center text-stone-400">
                <span>Width: {coords.mouthW}%</span>
                <input 
                  type="range" min="4" max="22" step="0.1"
                  value={coords.mouthW} 
                  onChange={(e) => updateCoord('mouthW', parseFloat(e.target.value))}
                  className="w-28 accent-red-500"
                />
              </div>
              <div className="flex justify-between items-center text-stone-400">
                <span>Height: {coords.mouthH}%</span>
                <input 
                  type="range" min="2" max="15" step="0.1"
                  value={coords.mouthH} 
                  onChange={(e) => updateCoord('mouthH', parseFloat(e.target.value))}
                  className="w-28 accent-red-500"
                />
              </div>
            </div>

            {/* Skin blend colors */}
            <div className="space-y-2.5 mb-4 border-b border-stone-900 pb-3">
              <span className="font-bold text-teal-400">MUZZLE BLENDING HEX</span>
              <div className="flex flex-col space-y-1">
                <span className="text-stone-400">Matching Hue Color:</span>
                <div className="flex space-x-1.5 items-center mt-1">
                  <input 
                    type="color" 
                    value={coords.mouthSkinColor} 
                    onChange={(e) => updateCoord('mouthSkinColor', e.target.value)}
                    className="w-6 h-6 bg-transparent border-0 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={coords.mouthSkinColor} 
                    onChange={(e) => updateCoord('mouthSkinColor', e.target.value)}
                    className="flex-1 bg-stone-900 border border-stone-800 px-1 py-0.5 text-[8.5px]"
                  />
                </div>
                <div className="flex space-x-1 mt-1.5 flex-wrap gap-y-1">
                  {['#ded8cf', '#d1caba', '#cdc2b5', '#4d463c', '#1d1a18'].map(c => (
                    <button 
                      key={c}
                      onClick={() => updateCoord('mouthSkinColor', c)}
                      className="w-4 h-4 rounded-full border border-stone-700"
                      style={{ backgroundColor: c }}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Reset */}
            <div className="space-y-1.5">
              <button 
                onClick={resetCoords}
                className="w-full py-1 bg-red-955/40 border border-red-800/60 text-red-200 hover:bg-red-950/75 uppercase tracking-widest text-[9px] font-black"
              >
                Reset To Defaults
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating calibration hint badge */}
      {!isDebugMode && (
        <div className="absolute top-4 left-4 z-20 pointer-events-none select-none opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[7.5px] font-mono tracking-widest text-stone-500 bg-stone-950/50 backdrop-blur px-1.5 py-0.5">
            DOUBLE-CLICK FACE TO CALIBRATE ANIMATION RIG
          </p>
        </div>
      )}
    </div>
  );
}
