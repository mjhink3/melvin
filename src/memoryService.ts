import { db } from "./firebaseConfig";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export interface MemoryBuckets {
  identity: {
    name?: string;
    location?: string;
    role?: string;
    values?: string[];
  };
  people: {
    name: string;
    relationship: string;
    notes?: string;
  }[];
  projects: {
    name: string;
    description?: string;
    status?: string;
  }[];
  feelings: {
    energizers?: string[];
    stressors?: string[];
    patterns?: string[];
  };
  threads: {
    topic: string;
    question?: string;
    opened?: string;
  }[];
  lastUpdated?: any;
  conversationCount?: number;
}

// Legacy type alias for anything still referencing MelvinMemory
export type MelvinMemory = MemoryBuckets;

export const EMPTY_MEMORY: MemoryBuckets = {
  identity: {},
  people: [],
  projects: [],
  feelings: { energizers: [], stressors: [], patterns: [] },
  threads: [],
  conversationCount: 0,
};

let currentUserId = "melvin-user-v1";

export function setUserId(uid: string) {
  currentUserId = uid;
}

const memoryRef = () => doc(db, "users", currentUserId, "memory", "core");

export async function loadMemory(): Promise<MemoryBuckets | null> {
  try {
    const snap = await getDoc(memoryRef());
    if (snap.exists()) return snap.data() as MemoryBuckets;
    return null;
  } catch (err) {
    console.warn("Firestore load failed:", err);
    return null;
  }
}

export async function saveMemory(memory: MemoryBuckets): Promise<void> {
  try {
    await setDoc(memoryRef(), { ...memory, lastUpdated: serverTimestamp() });
  } catch (err) {
    console.warn("Firestore save failed:", err);
  }
}

// Semantic memory injection -- only include buckets relevant to current conversation
export function formatMemoryForPrompt(memory: MemoryBuckets, recentMessages?: string): string {
  const lines: string[] = [];
  const context = (recentMessages || '').toLowerCase();

  // Identity always included if populated -- it's foundational
  const id = memory.identity;
  if (id && (id.name || id.role || id.location || id.values?.length)) {
    lines.push("WHO YOU'RE TALKING TO:");
    if (id.name) lines.push(`Name: ${id.name}`);
    if (id.location) lines.push(`Location: ${id.location}`);
    if (id.role) lines.push(`Role: ${id.role}`);
    if (id.values?.length) lines.push(`Values: ${id.values.join(', ')}`);
  }

  // People -- include if anyone is mentioned OR always if < 3 people (low cost)
  if (memory.people?.length) {
    const relevant = memory.people.filter(p =>
      memory.people.length <= 3 ||
      context.includes(p.name?.toLowerCase()) ||
      context.includes(p.relationship?.toLowerCase())
    );
    if (relevant.length > 0) {
      lines.push("\nPeople:");
      relevant.forEach(p => lines.push(`- ${p.name} (${p.relationship})${p.notes ? ': ' + p.notes : ''}`));
    }
  }

  // Projects -- only include if project names appear in conversation OR always if < 3
  if (memory.projects?.length) {
    const relevant = memory.projects.filter(p =>
      memory.projects.length <= 3 ||
      context.includes(p.name?.toLowerCase()) ||
      context.includes('project') || context.includes('work') || context.includes('build')
    );
    if (relevant.length > 0) {
      lines.push("\nProjects:");
      relevant.forEach(p => lines.push(`- ${p.name}${p.status ? ` [${p.status}]` : ''}${p.description ? ': ' + p.description : ''}`));
    }
  }

  // Feelings -- include if emotional language detected OR always if populated
  const emotionalKeywords = ['feel', 'stress', 'anxious', 'happy', 'sad', 'tired', 'excited', 'worried', 'good', 'bad', 'rough', 'great', 'awful', 'overwhelm'];
  const hasEmotionalContext = emotionalKeywords.some(k => context.includes(k));
  const f = memory.feelings;
  if (f && (f.energizers?.length || f.stressors?.length || f.patterns?.length)) {
    if (hasEmotionalContext || (f.energizers?.length || 0) + (f.stressors?.length || 0) <= 3) {
      lines.push("\nEmotional patterns:");
      if (f.energizers?.length) lines.push(`- Energized by: ${f.energizers.join(', ')}`);
      if (f.stressors?.length) lines.push(`- Stressed by: ${f.stressors.join(', ')}`);
      if (f.patterns?.length) lines.push(`- Patterns: ${f.patterns.join(', ')}`);
    }
  }

  // Threads -- always include, they're short and high value
  if (memory.threads?.length) {
    lines.push("\nOpen threads to revisit naturally when the moment fits:");
    memory.threads.slice(0, 3).forEach(t => {
      lines.push(`- ${t.topic}${t.question ? ': "' + t.question + '"' : ''}`);
    });
  }

  if (lines.length === 0) return "";
  return "=== WHAT YOU KNOW ===\n" + lines.join("\n") + "\n=== END ===";
}