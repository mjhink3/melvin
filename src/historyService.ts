/**
 * historyService.ts
 * Conversation history -- session summaries stored by date.
 * Recent = by date. After 30 days = by month. After 365 = by year.
 */

import { db } from './firebaseConfig';
import {
  doc, getDoc, setDoc, collection,
  getDocs, query, orderBy, limit,
  serverTimestamp
} from 'firebase/firestore';

export interface SessionSummary {
  date: string;        // ISO date string YYYY-MM-DD
  dateLabel: string;   // Human readable "Jun 8, 2026"
  summary: string;     // 3-4 sentence summary Melvin generated
  topics: string[];    // Key topics as tags
  messageCount: number;
  createdAt: any;
}

export interface HistoryBucket {
  type: 'day' | 'month' | 'year';
  key: string;         // YYYY-MM-DD, YYYY-MM, or YYYY
  label: string;       // "Jun 8", "June 2026", "2026"
  sessions: SessionSummary[];
  collapsed: boolean;
}

let currentUserId = 'melvin-user-v1';

export function setHistoryUserId(uid: string) {
  currentUserId = uid;
}

const historyRef = () => collection(db, 'users', currentUserId, 'history');
const sessionRef = (dateKey: string) => doc(db, 'users', currentUserId, 'history', dateKey);

// Save a session summary
export async function saveSessionSummary(summary: SessionSummary): Promise<void> {
  try {
    await setDoc(sessionRef(summary.date), {
      ...summary,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to save session summary:', err);
  }
}

// Load recent session summaries for context injection
export async function loadRecentSummaries(count = 5): Promise<SessionSummary[]> {
  try {
    const q = query(historyRef(), orderBy('date', 'desc'), limit(count));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SessionSummary);
  } catch (err) {
    console.warn('Failed to load history:', err);
    return [];
  }
}

// Load all summaries for the history panel
export async function loadAllSummaries(): Promise<SessionSummary[]> {
  try {
    const q = query(historyRef(), orderBy('date', 'desc'), limit(100));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as SessionSummary);
  } catch (err) {
    console.warn('Failed to load all history:', err);
    return [];
  }
}

// Format summaries into bucketed timeline
export function bucketSummaries(summaries: SessionSummary[]): HistoryBucket[] {
  if (summaries.length === 0) return [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  const dayBuckets = new Map<string, SessionSummary[]>();
  const monthBuckets = new Map<string, SessionSummary[]>();
  const yearBuckets = new Map<string, SessionSummary[]>();

  summaries.forEach(s => {
    const date = new Date(s.date);
    if (date >= thirtyDaysAgo) {
      const key = s.date;
      if (!dayBuckets.has(key)) dayBuckets.set(key, []);
      dayBuckets.get(key)!.push(s);
    } else if (date >= oneYearAgo) {
      const key = s.date.slice(0, 7); // YYYY-MM
      if (!monthBuckets.has(key)) monthBuckets.set(key, []);
      monthBuckets.get(key)!.push(s);
    } else {
      const key = s.date.slice(0, 4); // YYYY
      if (!yearBuckets.has(key)) yearBuckets.set(key, []);
      yearBuckets.get(key)!.push(s);
    }
  });

  const result: HistoryBucket[] = [];

  // Day buckets -- most recent first
  Array.from(dayBuckets.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([key, sessions]) => {
      const date = new Date(key + 'T12:00:00');
      const isToday = key === now.toISOString().slice(0, 10);
      const isYesterday = key === new Date(now.getTime() - 86400000).toISOString().slice(0, 10);
      let label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (isToday) label = 'Today';
      if (isYesterday) label = 'Yesterday';
      result.push({ type: 'day', key, label, sessions, collapsed: false });
    });

  // Month buckets
  Array.from(monthBuckets.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([key, sessions]) => {
      const [year, month] = key.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      result.push({ type: 'month', key, label, sessions, collapsed: true });
    });

  // Year buckets
  Array.from(yearBuckets.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .forEach(([key, sessions]) => {
      result.push({ type: 'year', key, label: key, sessions, collapsed: true });
    });

  return result;
}

// Format recent summaries for context injection into Melvin's prompt
export function formatHistoryForPrompt(summaries: SessionSummary[]): string {
  if (summaries.length === 0) return '';
  const lines = ['=== RECENT CONVERSATIONS ==='];
  summaries.slice(0, 5).forEach(s => {
    lines.push(`${s.dateLabel}: ${s.summary}`);
    if (s.topics?.length) lines.push(`  Topics: ${s.topics.join(', ')}`);
  });
  lines.push('=== END ===');
  return lines.join('\n');
}
