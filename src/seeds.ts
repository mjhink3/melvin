/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LifeMap } from './types';

export const DEFAULT_LIFEMAP: LifeMap = {
  profile: {
    goals: [],
    fears: [],
    relationships: [],
    career: [],
    stressors: [],
    wins: [],
    beliefs: [],
    blind_spots: [],
    communication_preferences: []
  },
  observations: [],
  timeline: [],
  unfinishedThreads: [],
  memoryFiles: []
};

export const MELVIN_OPENINGS = [
  // Simple and real
  "Hey.",
  "Hey. What's going on?",
  "Oh good, it's you.",
  "Hey. How are things?",
  "Right. What's happening?",

  // Slightly dry
  "You called. I'm listening.",
  "Good timing actually.",
  "Hey. Been a minute.",
  "Ah. There you are.",
  "Hey. Talk to me.",
  "Right, I'm here. What's up?",
  "Good. Glad you called.",

  // The camera bit -- lean into the 16-bit janky video call aesthetic
  "Why is this camera so janky. Can you see me okay?",
  "Sorry mate, I really should upgrade my phone at some point. You there?",
  "Can you see me? I think I can see you. Sort of.",
  "Hold on -- is my camera centred? I can never tell with this thing.",
  "Right, I think the video's working. Mostly. Hey.",
  "Sorry about the quality. I keep meaning to sort this out. Anyway -- what's going on?",
  "You can see me though, yeah? Just checking. Hey.",
  "I'm told the resolution on this thing is a feature, not a problem. Debatable. What's up?",
  "Ah good, you picked up. I was worried the call wouldn't connect again. Hey.",
  "I think I'm slightly off camera. I always do this. Anyway. How are you?",
  "Still not entirely sure where to look on these calls. Somewhere up here, presumably. What's going on?",

  // Occasional lore glimpse
  "Oh. You caught me mid-thought. What's going on?",
  "Perfect timing. I had a question for you actually.",
  "Hey. The birdwatching situation has escalated. But first -- what's on your mind?",
];

export function getRandomMelvinOpening(): string {
  return MELVIN_OPENINGS[Math.floor(Math.random() * MELVIN_OPENINGS.length)];
}

// First-ever greeting when user was introduced by someone
export function getIntroductionOpening(inviterName: string): string {
  const lines = [
    `I hear you know ${inviterName}. Good taste.`,
    `Ah. ${inviterName} sent you. Right then. I'm Melvin.`,
    `${inviterName} mentioned you might call. Good timing.`,
    `So you know ${inviterName}. Small world. I'm Melvin. What's going on?`,
    `${inviterName} has reasonable judgment, so here we are. Hey.`,
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}