/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PersonalitySettings {
  challenge_level: 'low' | 'medium' | 'high';
  humor: 'low' | 'medium' | 'high';
  warmth: 'low' | 'medium' | 'high';
  directness: 'low' | 'medium' | 'high';
  career_focus: boolean;
  personal_growth_focus: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  settings: PersonalitySettings;
}

export interface ReflectionFacts {
  facts: string[];
  assumptions: string[];
  controllable: string[];
  uncontrollable: string[];
}

export interface DecisionOption {
  description: string;
  pros: string[];
  cons: string[];
  secondOrderEffects: string[];
}

export interface ReflectionDecision {
  coreQuestion: string;
  optionA: DecisionOption;
  optionB: DecisionOption;
}

export interface ReflectionAvoidance {
  thingBeingAvoided: string;
  whyIsItDifficult: string;
  whatIsAtStake: string;
  oneSmallAction: string;
}

export interface LifeMapProfile {
  goals: string[];
  fears: string[];
  relationships: string[];
  career: string[];
  stressors: string[];
  wins: string[];
  beliefs: string[];
  blind_spots: string[];
  communication_preferences: string[];
}

export interface LifeMapObservation {
  id: string;
  summary: string;
  timestamp: string;
  depth: 'surface' | 'moderate' | 'profound';
}

export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  category: 'mindset_shift' | 'breakthrough' | 'avoidance_behavior' | 'goal_achievement' | 'milestone';
}

export interface UnfinishedThread {
  id: string;
  topic: string;
  triggerQuestion: string;
  context: string;
  status: 'open' | 'resolved';
  timestamp: string;
}

export interface MemoryFile {
  file_id: string;
  title: string;
  description: string;
  keywords: string[];
  related_people: string[];
  related_projects: string[];
  emotional_tags: string[];
  importance_score: number;
  last_updated: string;
  summary: string;
  key_memories: string[];
  unresolved_threads: string[];
  trigger_questions: string[];
}

export interface LifeMap {
  profile: LifeMapProfile;
  observations: LifeMapObservation[];
  timeline: TimelineEntry[];
  unfinishedThreads: UnfinishedThread[];
  memoryFiles?: MemoryFile[];
}
