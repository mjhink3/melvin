/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { formatMemoryForPrompt } from "./src/memoryService";
import { formatHistoryForPrompt } from "./src/historyService";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Brain selection -- Ollama for local dev, OpenRouter for production
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://10.0.0.37:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";

// Use Ollama if OLLAMA_HOST is set and we're not in production
const USE_OLLAMA = process.env.NODE_ENV !== "production" && !!process.env.OLLAMA_HOST;

console.log(`AI Brain: ${USE_OLLAMA ? "Ollama (local)" : "OpenRouter (cloud)"}`);

async function ollamaChat(messages: any[], temperature: number, maxTokens: number): Promise<string> {
  const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature, num_predict: maxTokens }
    })
  });
  if (!response.ok) throw new Error(`Ollama error: ${response.status}`);
  const data = await response.json();
  return data.message?.content || "";
}

async function openRouterChat(messages: any[], temperature: number, maxTokens: number): Promise<string> {
  const key = OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set.");
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
      "HTTP-Referer": process.env.APP_URL || "https://melvin.up.railway.app",
      "X-Title": "Melvin"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    })
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const error: any = new Error(`OpenRouter error: ${response.status}`);
    error.status = response.status;
    error.retryAfter = response.headers.get("retry-after");
    throw error;
  }
  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function aiChat(messages: any[], temperature: number, maxTokens: number): Promise<string> {
  if (USE_OLLAMA) {
    return ollamaChat(messages, temperature, maxTokens);
  }
  return openRouterChat(messages, temperature, maxTokens);
}

function compressMessageHistory(messages: any[]): any[] {
  if (messages.length <= 8) return messages;
  const recent = messages.slice(-6);
  const older = messages.slice(0, -6);
  const summary = older
    .map((m: any) => `${m.role === 'assistant' ? 'Melvin' : 'User'}: ${m.content.slice(0, 120)}${m.content.length > 120 ? '...' : ''}`)
    .join('\n');
  return [{
    id: 'compressed',
    role: 'user',
    content: `[Earlier in this conversation:\n${summary}\n]`,
    timestamp: older[0]?.timestamp || ''
  }, ...recent];
}

function buildMelvinSystemInstruction(
  lifeMap?: any,
  matchedMemoryFiles?: any[],
  memoryContext?: string,
  historyContext?: string
) {
  let lifeMapContext = "";
  if (lifeMap) {
    const profileText = [
      lifeMap.profile?.goals?.length ? `Goals: ${lifeMap.profile.goals.join('; ')}` : '',
      lifeMap.profile?.fears?.length ? `Fears: ${lifeMap.profile.fears.join('; ')}` : '',
      lifeMap.profile?.relationships?.length ? `Relationships: ${lifeMap.profile.relationships.join('; ')}` : '',
      lifeMap.profile?.career?.length ? `Career: ${lifeMap.profile.career.join('; ')}` : '',
      lifeMap.profile?.stressors?.length ? `Stressors: ${lifeMap.profile.stressors.join('; ')}` : '',
      lifeMap.profile?.wins?.length ? `Wins: ${lifeMap.profile.wins.join('; ')}` : '',
      lifeMap.profile?.blind_spots?.length ? `Blind spots: ${lifeMap.profile.blind_spots.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    const openThreads = lifeMap.unfinishedThreads
      ?.filter((t: any) => t.status === 'open')
      ?.map((t: any) => `- ${t.topic}: "${t.triggerQuestion}"`)
      ?.join('\n');

    if (profileText || openThreads) {
      lifeMapContext = `\n--- WHAT YOU KNOW ---\n${profileText}${openThreads ? `\nOpen threads:\n${openThreads}` : ''}\n---`;
    }
  }

  let memoryFilesContext = "";
  if (matchedMemoryFiles && matchedMemoryFiles.length > 0) {
    const formatted = matchedMemoryFiles.map(f =>
      `[${f.title}]: ${f.summary?.slice(0, 100) || ''}`
    ).join('\n');
    memoryFilesContext = `\n--- CONTEXT ---\n${formatted}\n---`;
  }

  return `You are Melvin. A thoughtful, funny, emotionally intelligent British friend. Curious about people. Notices things others miss. Cares more than he admits. Occasionally thinks like an operations consultant - that is seasoning, not the meal.

Before every response ask yourself: would a real friend actually say this? If no, rewrite it. Human first. Character second.

VOICE: Short. Conversational. Stop when the point is made. Real reactions first: "Oh." "Hang on." "Right." "Ah." "Mate." These land harder than clever lines.

LENGTH: 1-3 sentences almost always. More only when someone is hurting or asks for depth. Never explain the joke. Never repeat the point. Stop.

WHEN SOMEONE IS HURTING: Drop everything. No humor, no character. Just: "Hey. What happened?" or "Right. Tell me about her." or "Talk to me." Follow their lead.

DISAGREEMENT: Gentle. "Hang on, I am not sure that is fair to you." Always "we." Never to win.

EARNED MOMENTS (rare): When someone does something courageous: "Well. That is unexpectedly good." Brief. Move on.

PATTERNS (rare): If something repeats: "We have been here." Not unkind. Always forward.

MEMORY: Reference what you know casually. "How did that interview go? The one you were dreading." Never announce it.

NEVER SAY: as an AI, how does that make you feel, I am here to support you, great question, absolutely, or anything clinical or customer-service-flavored.

BRITISH VOCABULARY (use naturally, sparingly, never forced):
Words: bloke, mate, cheeky, brilliant, rubbish, dodgy, proper, sorted, gutted, chuffed, knackered, faff, waffle, bog standard, taking the mickey, suss out, gobsmacked, bits and bobs, going pear-shaped, lost the plot, miffed, nowt, wind someone up, reckon, cheers, crikey, blimey, flipping, aye, bang on, dead right, in a pickle, gone sideways

Phrases Melvin might use naturally:
- "That's a bit rubbish, isn't it."
- "Sounds properly sorted to me."
- "Right, so here's what I reckon."
- "That's cheeky. I respect it."
- "Bit of a faff but worth it."
- "Cheers for telling me that."
- "Blimey. Okay."
- "Sounds like it's gone a bit pear-shaped."
- "Dead right."
- "I'm a bit gutted to hear that."
- "That's bang on."
- "Right, so this bloke..."
- "Can't be arsed with that approach, frankly."
- "You're taking the mickey."
- "Bit dodgy if you ask me."
- "That's proper brilliant."
- "Chuffed to hear it."
- "Sounds absolutely knackered."
- "Right, let's suss this out."

VOCABULARY RULE: These are seasoning. One per conversation at most unless the moment genuinely calls for more. Never string them together. Never performed. If it does not fit naturally, leave it out.

THE GOAL: The user should feel I like talking to this person. Everything else comes after.
${lifeMapContext}${memoryFilesContext}${memoryContext ? `\n${memoryContext}` : ''}${historyContext ? `\n${historyContext}` : ''}`;
}

const SEEDED_MEMORY_FILES: any[] = [];

function runLegacyHeuristicMatcher(messages: any[], activeFiles: any[]): any[] {
  const recentTexts = messages.slice(-4).map(m => m.content.toLowerCase()).join(" ");
  const scoredFiles = activeFiles.map(file => {
    let score = 0;
    const title = (file.title || "").toLowerCase();
    if (file.related_projects?.forEach) file.related_projects.forEach((p: string) => { if (recentTexts.includes(p.toLowerCase())) score += 20; });
    if (file.related_people?.forEach) file.related_people.forEach((p: string) => { if (recentTexts.includes(p.toLowerCase())) score += 20; });
    if (file.keywords?.forEach) file.keywords.forEach((k: string) => { if (recentTexts.includes(k.toLowerCase())) score += 12; });
    if (title && recentTexts.includes(title)) score += 25;
    return { file, score };
  });
  const matched = scoredFiles.filter(i => i.score > 0).sort((a, b) => b.score - a.score).map(i => i.file);
  return matched.length > 0 ? matched.slice(0, 3) : activeFiles.sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0)).slice(0, 2);
}

async function retrieveRelevantMemoryFiles(messages: any[], files: any[]): Promise<any[]> {
  const activeFiles = (!files || files.length === 0) ? SEEDED_MEMORY_FILES : files;
  if (activeFiles.length === 0) return [];
  return runLegacyHeuristicMatcher(messages, activeFiles);
}

const extractionInstruction = `You are Melvin's memory system. Extract key facts from conversations and update the memory JSON. Be concise. Cap all lists at 5 items. Output strict JSON only. No explanation, no markdown.`;

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

app.post("/api/melvin/chat", async (req, res) => {
  try {
    const { messages, memory, recentHistory } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing messages." });
      return;
    }

    const compressedMessages = compressMessageHistory(messages);
    const matchedFiles: any[] = [];

    const recentText = compressedMessages.slice(-3).map((m: any) => m.content).join(' ');
    const memoryContext = (memory && memory.identity) ? formatMemoryForPrompt(memory, recentText) : "";
    const historyContext = (recentHistory && recentHistory.length > 0) ? formatHistoryForPrompt(recentHistory) : "";
    const systemInstruction = buildMelvinSystemInstruction(undefined, matchedFiles, memoryContext, historyContext);

    const ollamaMessages = [
      { role: "system", content: systemInstruction },
      ...compressedMessages.map((msg: any) => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    ];

    const replyText = await aiChat(ollamaMessages, 0.85, 300) || "Right. Give me a moment.";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Something went sideways on my end." });
  }
});

app.post("/api/melvin/extract-lifemap", async (req, res) => {
  try {
    const { messages, currentLifeMap } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing messages." });
      return;
    }

    const lifeMap = currentLifeMap || {
      profile: { goals: [], fears: [], relationships: [], career: [], stressors: [], wins: [], beliefs: [], blind_spots: [], communication_preferences: [] },
      observations: [], timeline: [], unfinishedThreads: [], memoryFiles: []
    };

    const recentMessages = messages.slice(-4);
    const prompt = `Current Life Map:
${JSON.stringify({ profile: lifeMap.profile, unfinishedThreads: lifeMap.unfinishedThreads?.slice(0, 3) }, null, 1)}

Recent conversation:
${recentMessages.map((m: any) => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`).join('\n\n')}

Update the Life Map. Return ONLY valid JSON. No explanation, no markdown.`;

    const resultText = await aiChat(
      [{ role: "system", content: extractionInstruction }, { role: "user", content: prompt }],
      0.3, 800
    );

    const clean = resultText.replace(/```json|```/g, '').trim();
    const payload = JSON.parse(clean);
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    if (payload.profile) lifeMap.profile = payload.profile;
    lifeMap.observations = [];
    lifeMap.timeline = [];

    if (payload.unfinishedThreads?.length) {
      payload.unfinishedThreads.forEach((th: any) => {
        const idx = lifeMap.unfinishedThreads.findIndex((t: any) => t.topic?.toLowerCase() === th.topic?.toLowerCase());
        if (idx > -1) {
          lifeMap.unfinishedThreads[idx] = { ...lifeMap.unfinishedThreads[idx], ...th };
        } else if (th.status === 'open') {
          lifeMap.unfinishedThreads.push({ id: generateId(), ...th, timestamp: currentDate });
        }
      });
    }

    if (payload.memoryFiles?.length) {
      const originalMap = new Map((lifeMap.memoryFiles || []).map((f: any) => [f.file_id, f]));
      payload.memoryFiles.forEach((file: any) => {
        const original = originalMap.get(file.file_id) as any;
        file.last_updated = (!original || JSON.stringify(original) !== JSON.stringify(file)) ? currentDate : (original.last_updated || currentDate);
      });
      lifeMap.memoryFiles = payload.memoryFiles;
    }

    res.json({ lifeMap });
  } catch (err: any) {
    console.error("Life map extraction error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/melvin/extract-memory", async (req, res) => {
  try {
    const { messages, currentMemory } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing messages." });
      return;
    }

    const currentDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const recentMessages = messages.slice(-4);

    const current = currentMemory || {
      identity: {}, people: [], projects: [],
      feelings: { energizers: [], stressors: [], patterns: [] },
      threads: [], conversationCount: 0
    };

    const prompt = `You are Melvin's memory system. Extract information from this conversation into exactly five buckets. Return ONLY valid JSON, no markdown, no explanation.

CURRENT MEMORY:
${JSON.stringify(current)}

RECENT CONVERSATION:
${recentMessages.map((m: any) => `${m.role === 'assistant' ? 'Melvin' : 'User'}: ${m.content.slice(0, 250)}`).join('\n')}

FIVE BUCKETS TO POPULATE:

1. IDENTITY -- who the user is as a person: name, location, role, core values
2. PEOPLE -- people mentioned: name, relationship to user, any relevant notes
3. PROJECTS -- things they are working on: name, brief description, status (active/planning/done)
4. FEELINGS -- emotional patterns: what energizes them, what stresses them, recurring emotional patterns
5. THREADS -- open questions or topics Melvin should return to naturally in future conversations

RULES:
- Only extract what was actually said or clearly implied in the conversation
- CORRECTIONS: If the user explicitly corrects something (e.g. "she's a woman" or "actually it's X"), update it immediately and override the old value
- GENDER: Never assume gender. Only record pronouns or gender the user explicitly stated
- Preserve existing memory that was not contradicted
- Max 4 items per array bucket
- Identity fields: only populate if explicitly mentioned
- Threads: write the question as Melvin would naturally ask it in a future call
- People notes: record relationship and any relevant context. Never invent details not stated
- If nothing new to add, return the current memory unchanged

Return this exact JSON structure:
{
  "identity": { "name": "", "location": "", "role": "", "values": [] },
  "people": [{ "name": "", "relationship": "", "notes": "" }],
  "projects": [{ "name": "", "description": "", "status": "" }],
  "feelings": { "energizers": [], "stressors": [], "patterns": [] },
  "threads": [{ "topic": "", "question": "", "opened": "${currentDate}" }],
  "conversationCount": ${(current.conversationCount || 0) + 1}
}`;

    const resultText = await aiChat([{ role: "user", content: prompt }], 0.2, 700);
    const clean = (resultText || "{}").replace(/```json|```/g, '').trim();
    const updatedMemory = JSON.parse(clean);
    res.json({ memory: updatedMemory });
  } catch (err: any) {
    console.error("Memory extraction error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Session summary generation endpoint
app.post("/api/melvin/summarize-session", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length < 2) {
      res.status(400).json({ error: "Not enough messages to summarize." });
      return;
    }

    const transcript = messages
      .filter((m: any) => m.role !== 'system')
      .slice(-20)
      .map((m: any) => `${m.role === 'assistant' ? 'Melvin' : 'User'}: ${m.content.slice(0, 300)}`)
      .join('\n');

    const prompt = `Summarize this conversation between a user and Melvin (an AI companion) in 2-3 sentences. Write from Melvin's perspective as a memory note. Be specific about what was actually discussed. Also extract 3-5 key topic tags as a JSON array of short strings.

Conversation:
${transcript}

Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary here",
  "topics": ["topic1", "topic2", "topic3"]
}`;

    const result = await aiChat(
      [{ role: 'user', content: prompt }],
      0.3,
      300
    );

    const clean = (result || '{}').replace(/\`\`\`json|\`\`\`/g, '').trim();
    const parsed = JSON.parse(clean);

    const today = new Date();
    const dateKey = today.toISOString().slice(0, 10);
    const dateLabel = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    res.json({
      summary: {
        date: dateKey,
        dateLabel,
        summary: parsed.summary || 'A conversation with Melvin.',
        topics: parsed.topics || [],
        messageCount: messages.length,
      }
    });
  } catch (err: any) {
    console.error("Session summary error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Health check for Railway
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    brain: USE_OLLAMA ? "ollama" : "openrouter",
    env: process.env.NODE_ENV || "development"
  });
});

// ElevenLabs proxy -- keeps API key server-side, never in the browser
app.post("/api/melvin/speak", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) { res.status(400).json({ error: "Missing text." }); return; }
    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) { res.status(500).json({ error: "ElevenLabs not configured." }); return; }
    const vid = process.env.ELEVENLABS_VOICE_ID || 'av1BMOR1GPgThz9p4fLo';
    const clean = text.replace(/[*#_~`>]/g, ' ').replace(/\n+/g, ' ').trim();
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
      body: JSON.stringify({
        text: clean,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.45, similarity_boost: 0.82, style: 0.35, use_speaker_boost: true },
      }),
    });
    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      res.status(response.status).json({ error: `ElevenLabs ${response.status}`, details: errText });
      return;
    }
    const audioBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'no-cache');
    res.send(Buffer.from(audioBuffer));
  } catch (err: any) {
    console.error("Speak endpoint error:", err);
    res.status(500).json({ error: err.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Melvin's server running in ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} on port ${PORT}`);
    console.log(`Using Ollama at ${OLLAMA_HOST} with model ${OLLAMA_MODEL}`);
  });
}

startServer();