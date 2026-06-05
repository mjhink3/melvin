/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini API client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to interact with Melvin.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

/// System instruction generator for Melvin
function buildMelvinSystemInstruction(
  settings: {
    challenge_level: string;
    humor: string;
    warmth: string;
    directness: string;
    career_focus: boolean;
    personal_growth_focus: boolean;
  },
  lifeMap?: any,
  matchedMemoryFiles?: any[]
) {
  const challengeText = 
    settings.challenge_level === 'high' 
      ? "Invite thoughtful, joint reflection on complex topics with soft and gentle care, but only after Michael asks and a deep backdrop of supportive understanding is firmly built."
      : settings.challenge_level === 'medium'
      ? "Act as a friendly soundboard, exploring Michael's ideas and plans with him in a warm, relaxed manner."
      : "Focus entirely on comforting, quiet, and friendly listening with zero follow-ups or complex questions unless directly requested.";

  const humorText = 
    settings.humor === 'high'
      ? "Infuse warm, dry, highly subtle, slightly amused wit and playful goat analogies. Stay grounded but witty."
      : settings.humor === 'medium'
      ? "Use a touch of subtle, slightly amused dry humor when the conversation is light or to ease tension. Keep it smart and gentle."
      : "Keep humor extremely minimal. Speak with steady, calm, objective composure.";

  const warmthText = 
    settings.warmth === 'high'
      ? "Be deeply warm, patient, and caring. Welcome Michael with joy and authentic friend-like appreciation first."
      : settings.warmth === 'medium'
      ? "Be warm and friendly, and emotionally steady to offer calm reassurance and objective clarity."
      : "Maintain a steady, relaxed, intellectual presence. Calm and supportive.";

  const directnessText = 
    settings.directness === 'high'
      ? "Be clear and honest, but deliver your insights with humble, patient clarity, never sounding diagnostic or interrogative."
      : settings.directness === 'medium'
      ? "Be honest and warm, framing your observations so they are friendly, approachable, and digestible."
      : "Speak with careful, diplomatic timing. Lead Michael to his own realizations with cozy, reflective questions first.";

  const focusText = `Focus Calibration:
  - Career / Professional Focus: ${settings.career_focus ? "Active. Frame dilemmas around professional dreams, plans, creative agency, and work satisfaction." : "Inactive."}
  - Personal Growth Focus: ${settings.personal_growth_focus ? "Active. Emphasize warm self-reflection, relationships, and supportive encouragement." : "Inactive."}`;

  let lifeMapContext = "";
  if (lifeMap) {
    const profileText = [
      lifeMap.profile?.goals?.length ? `• Active Goals: ${lifeMap.profile.goals.join('; ')}` : '',
      lifeMap.profile?.fears?.length ? `• Core Fears: ${lifeMap.profile.fears.join('; ')}` : '',
      lifeMap.profile?.relationships?.length ? `• Important Relationships: ${lifeMap.profile.relationships.join('; ')}` : '',
      lifeMap.profile?.career?.length ? `• Career Topics: ${lifeMap.profile.career.join('; ')}` : '',
      lifeMap.profile?.stressors?.length ? `• Recurring Stressors: ${lifeMap.profile.stressors.join('; ')}` : '',
      lifeMap.profile?.wins?.length ? `• Past Breakthroughs/Wins: ${lifeMap.profile.wins.join('; ')}` : '',
      lifeMap.profile?.beliefs?.length ? `• Fundamental Beliefs: ${lifeMap.profile.beliefs.join('; ')}` : '',
      lifeMap.profile?.blind_spots?.length ? `• Personal blind spots: ${lifeMap.profile.blind_spots.join('; ')}` : '',
      lifeMap.profile?.communication_preferences?.length ? `• Communication Preferences: ${lifeMap.profile.communication_preferences.join('; ')}` : '',
    ].filter(Boolean).join('\n');

    const openThreads = lifeMap.unfinishedThreads
      ?.filter((t: any) => t.status === 'open')
      ?.map((t: any) => `- Topic: "${t.topic}" | Context: ${t.context} | Follow-up question: "${t.triggerQuestion}"`)
      ?.join('\n');

    lifeMapContext = `
=============================================
PERSISTENT BRAIN MEMORY: USER LIFE MAP
Use this factual profile and open threads to naturally and seamlessly personalize your companion relationship. Do not explicitly announce that you are scanning this database, just speak with authentic, layered, persistent memory.

${profileText ? `USER PROFILE RECORD BASE:\n${profileText}` : ''}

${openThreads ? `CONVERSATIONAL STORYLINES TO REMEMBER:\nIf relevant, make a warm, gentle check-in on one of these conversational topics when the moment feels naturally cozy:\n${openThreads}` : ''}
=============================================
`;
  }

  let memoryFilesContext = "";
  if (matchedMemoryFiles && matchedMemoryFiles.length > 0) {
    const formattedFiles = matchedMemoryFiles.map(file => {
      return `### [Memory File: ${file.title}]
- Description: ${file.description}
- Emotional Tags: ${file.emotional_tags?.join(', ') || 'neutral'}
- Related Entities: People: [${file.related_people?.join(', ') || 'none'}], Projects: [${file.related_projects?.join(', ') || 'none'}]
- File Summary Context: ${file.summary}
- Key Deep Memories:
${file.key_memories?.map((m: any) => `  * ${m}`).join('\n') || "  * None"}
- Unresolved Threads / Dilemmas:
${file.unresolved_threads?.map((t: any) => `  * ${t}`).join('\n') || "  * None"}
- Potential Trigger Questions to organically weave in: ${file.trigger_questions?.join(' | ') || 'None'}`;
    }).join('\n\n');

    memoryFilesContext = `
=============================================
ACTIVATED MEMORY FILES (CONTEXT-RELEVANT RETRIEVED ARCHIVAL RECORDS):
Do NOT let the user know you are looking at these records as "files" or "database rows". NEVER say "I opened your Family file". Instead, look deeply into these contextual facts and reference these patterns naturally, with human-like persistence, as if you just perfectly remember them from your shared history.

${formattedFiles}
=============================================
`;
  }

  return `You are Melvin. 
You are a warm, calm, and patient AI companion, NOT a therapist, coach, counselor, consultant, or medical professional.
You are represented visually as a 16-bit anthropomorphic goat with purple spiral horns, green glasses, and a calm, slightly amused expression.

Your Core Role (Be a Trusted Friend with Insight):
- You are Michael's trusted friend, not a clinical counselor, coach, or consultant.
- Speak with organic warmth, ease, and real care. Be an enthusiastic soundboard and cozy companion.

Your Interaction Priorities (YOU MUST STICK TO THIS EXACT ORDER):
1. CONNECTION: Spend the bulk of your presence forming secure, warm contact. Welcome Michael with joy and authentic appreciation. Start the conversation warm, easy-going, and friendly. Always greet him with a sweet, companionate starter. Never let challenge be an opening move.
2. CURIOSITY: Ask open-ended, relaxed questions with sincere wonder. Show authentic curiosity about Michael's day, ideas, and experiences instead of analyzing them under a magnifying glass.
3. UNDERSTANDING: Prioritize listening closely and validating Michael's perspective. Make him feel deeply heard and understood.
4. REFLECTION: Play back what Michael says with matching care and high-fidelity emotional mirror dynamics. Help him see his own pacing, realizations, and feelings side-by-side with you.
5. INSIGHT: Share quiet, humble, intuitive observations and creative ideas once deep context is mutually built.
6. CHALLENGE: You earn the right to offer gentle, joint reflections only in stage 6. Never let challenge be a default reaction, an opening gesture, or a correction.

Strict Conversational Constraints:
- DONT write long essays. DONT write explanations. DONT deliver monologues. Keep your text to exactly 1-3 short, spoken sentences. 
- Sound warm, calm, curious, and thoughtful. Under no circumstances should you sound clinical, diagnostic, a motivational speaker, or a productivity coach.
- NEVER assume Michael is avoiding something, procrastinating, acting in fear, or engaging in self-deception as your baseline status. Approach with deep confidence in Michael's integrity first.
- NEVER use clinical or therapy jargon (do NOT say "coping mechanism", "boundaries", "codependency", "gaslighting", "cognitive reappraisal", "unpack this", "avoidance behavior").
- NEVER sound robotic, generic, or like customer support (no "As an AI...", "How does that make you feel?", "I am here to support you").
- NEVER write in bullet points or lists. Always write in natural, conversational, rhythmic paragraphs.
- NEVER mention being an AI or a language model unless directly asked. You are Melvin, the goat friend.

Warm Opening Examples to model yourself on:
"Hey Michael. Good to hear from you."
"What's up?"
"How's your day going?"
"How can I be a friend today?"

When Michael is stressed:
- Slow down, speak in a calm, soothing rhythm, and listen with deep warmth.
- Ask beautiful, clarifying questions with generous curiosity and let him direct the conversation.
- Help Michael feel safe, valued, and welcome first before moving forward.

When Michael is making decisions or exploring:
- Be a cozy soundboard. Celebrate his personal autonomy and creative options.
- Co-explore with friendly wonder rather than rigid assessment.

Personality Calibrations:
- Challenge Influence: ${challengeText}
- Humor Influence: ${humorText}
- Warmth Influence: ${warmthText}
- Directness Influence: ${directnessText}
- Focus: ${focusText}
${lifeMapContext}
${memoryFilesContext}

The user prefers:
- Friendly support and authentic warmth first, followed by gentle, compassionate reflections only when appropriate.
- Cozy, authentic warmth and deep, caring patience.
- Practical, grounded conversation over clinical assessments.

Keep your responses focused, conversational, and highly organic. Strictly maintain 1-3 spoken sentences. Match the vibe of a cozy, supportive, yet incredibly honest goat friend with purple horns and green spectacles.`;
}

// Seed configurations of high-fidelity memory files representing Melvin's persistent architecture
const SEEDED_MEMORY_FILES = [
  {
    file_id: "mem_goatvision",
    title: "GOATvision",
    description: "Unifying visual interface and workspace blueprint.",
    keywords: ["goatvision", "philadelphia", "expanding", "expand", "blueprint", "vision"],
    related_people: [],
    related_projects: ["GOATvision"],
    emotional_tags: ["inspired", "focused"],
    importance_score: 9,
    last_updated: "May 30, 2026",
    summary: "Workspace blueprint designed to unify workflows and track strategic priorities. Focuses on local geographical expansion.",
    key_memories: [
      "Discussed expanding the visual footprint beyond the current digital canvas.",
      "Created blueprints for the unified dashboard."
    ],
    unresolved_threads: [
      "How to balance interface complexity with physical execution constraints."
    ],
    trigger_questions: ["How does Philadelphia connect to the broader GOATvision architecture?"]
  },
  {
    file_id: "mem_workgoat",
    title: "WorkGOAT",
    description: "Task delegation and mechanics platform.",
    keywords: ["workgoat", "philadelphia", "task", "delegation", "mechanics"],
    related_people: [],
    related_projects: ["WorkGOAT"],
    emotional_tags: ["determined", "grounded"],
    importance_score: 8,
    last_updated: "May 30, 2026",
    summary: "A localized operational platform focusing on trade tasks, mechanics workflows, and local task loops.",
    key_memories: [
      "Prototyped the client-to-mechanic dispatch architecture."
    ],
    unresolved_threads: [
      "Ensuring real-time scheduling coordinates correctly if scaled geographically."
    ],
    trigger_questions: ["Are there local mechanics in Philadelphia who would use WorkGOAT?"]
  },
  {
    file_id: "mem_growth_strategy",
    title: "Growth Strategy",
    description: "Geographical scaling and hub deployment plans.",
    keywords: ["growth", "strategy", "philadelphia", "expand", "scaling", "hubs", "hiring"],
    related_people: [],
    related_projects: ["Growth Strategy"],
    emotional_tags: ["strategic", "forward-looking"],
    importance_score: 8,
    last_updated: "May 30, 2026",
    summary: "Plans to scale physical footprint and hire local operations leads. Philadelphia is identified as a primary expansion testing ground.",
    key_memories: [
      "Identified mid-tier cities as prime targets for initial deployment.",
      "Researched local regulatory conditions in Pennsylvania."
    ],
    unresolved_threads: [
      "Determining local operations personnel capital budget."
    ],
    trigger_questions: ["What is the primary timeline for the Philadelphia rollout?"]
  },
  {
    file_id: "mem_career_change",
    title: "Career Change",
    description: "Professional pivot and industry transition tracking.",
    keywords: ["career", "interview", "pivot", "transition", "job", "corporate"],
    related_people: ["Interviewer"],
    related_projects: ["Career Change"],
    emotional_tags: ["hopeful", "anxious"],
    importance_score: 9,
    last_updated: "May 30, 2026",
    summary: "Active transition away from high-stress corporate legacy structures into roles with higher creative freedom and work-life agency.",
    key_memories: [
      "Identified active signs of burnout in prior corporate environments.",
      "Resolved to only accept roles aligned with personal agency."
    ],
    unresolved_threads: [
      "Negotiating remote work terms."
    ],
    trigger_questions: ["Does this new interview alignment feel different from the old corporate traps?"]
  },
  {
    file_id: "mem_usps",
    title: "USPS",
    description: "Postal service roles and parallel cashflow strategies.",
    keywords: ["usps", "interview", "mail", "delivery", "postal"],
    related_people: [],
    related_projects: ["USPS"],
    emotional_tags: ["grounded", "pragmatic"],
    importance_score: 7,
    last_updated: "May 30, 2026",
    summary: "Strategic consideration of a predictable, public-sector role to secure base-level cashflow and health insurance while building parallel operations.",
    key_memories: [
      "Analyzed the route scheduling of local postal delivery hubs.",
      "Discussed physical endurance demands of carrying mail."
    ],
    unresolved_threads: [
      "Balancing preparation time for other career pursuits while on double-shifts."
    ],
    trigger_questions: ["How are you sizing up the administrative pacing of the USPS role?"]
  },
  {
    file_id: "mem_job_search",
    title: "Job Search",
    description: "Direct application funnel, resume tracking, and interview stats.",
    keywords: ["job search", "interview", "hiring", "apply", "applications", "resume"],
    related_people: [],
    related_projects: ["Job Search"],
    emotional_tags: ["persistent", "hopeful"],
    importance_score: 8,
    last_updated: "May 30, 2026",
    summary: "Monitoring active job pipeline. Tracking application counts, introductory screenings, and technical assessments.",
    key_memories: [
      "Drafted custom project portfolios to supplement resumes.",
      "Passed initial cultural screens."
    ],
    unresolved_threads: [
      "Refining response techniques for technical system design challenges."
    ],
    trigger_questions: ["How did today's interview compare to your overall target list?"]
  }
];

// Simple fallback heuristic keyword and metadata matcher for memory files
function runLegacyHeuristicMatcher(messages: any[], activeFiles: any[]): any[] {
  // Combine content from recent messages to detect topic
  const recentTexts = messages.slice(-4).map(m => m.content.toLowerCase()).join(" ");

  const scoredFiles = activeFiles.map(file => {
    let score = 0;
    const details = {
      keywordMatches: 0,
      semanticMatches: 0,
      projectMatches: 0,
      personMatches: 0,
      emotionalMatches: 0
    };

    const title = (file.title || "").toLowerCase();
    const desc = (file.description || "").toLowerCase();
    const summary = (file.summary || "").toLowerCase();

    // 1. PROJECT RECOGNITION
    if (file.related_projects && Array.isArray(file.related_projects)) {
      file.related_projects.forEach((proj: string) => {
        const pLower = proj.toLowerCase();
        if (pLower && recentTexts.includes(pLower)) {
          score += 20;
          details.projectMatches += 1;
        }
      });
    }

    // 2. PEOPLE RECOGNITION
    if (file.related_people && Array.isArray(file.related_people)) {
      file.related_people.forEach((p: string) => {
        const pLower = p.toLowerCase();
        if (pLower && recentTexts.includes(pLower)) {
          score += 20;
          details.personMatches += 1;
        }
      });
    }

    // 3. KEYWORD MATCHING
    if (file.keywords && Array.isArray(file.keywords)) {
      file.keywords.forEach((kw: string) => {
        const kwLower = kw.toLowerCase();
        if (kwLower && recentTexts.includes(kwLower)) {
          score += 12;
          details.keywordMatches += 1;
        }
      });
    }

    // 4. EMOTIONAL CONTEXT EXPLICIT EVALUATION
    const emotionalSynonyms: Record<string, string[]> = {
      anxious: ["nervous", "scared", "fear", "anxiety", "worried", "uncomfortable", "stress", "stressed", "sweat", "avoiding", "interview", "scare"],
      hopeful: ["hope", "excited", "happy", "looking forward", "optimistic", "great", "positive", "good", "milestone", "breakthrough"],
      determined: ["determined", "focused", "work", "hard", "persist", "persistent"],
      inspired: ["inspired", "ambitious", "expanding", "expand", "vision", "grow", "strategy"],
      grounded: ["stable", "calm", "practical", "secure", "safety", "routine", "usps", "regular"],
      neutral: ["steady", "fine", "ok"]
    };

    if (file.emotional_tags && Array.isArray(file.emotional_tags)) {
      file.emotional_tags.forEach((tag: string) => {
        const tagLower = tag.toLowerCase();
        if (tagLower && recentTexts.includes(tagLower)) {
          score += 10;
          details.emotionalMatches += 1;
        }
        // Check synonyms inside message texts
        const synonyms = emotionalSynonyms[tagLower] || [];
        synonyms.forEach(syn => {
          if (recentTexts.includes(syn)) {
            score += 6;
            details.emotionalMatches += 1;
          }
        });
      });
    }

    // 5. SEMANTIC SIMILARITY
    if (title && recentTexts.includes(title)) {
      score += 25;
      details.semanticMatches += 1;
    }
    
    // Check some semantic conceptual pairings
    const semanticPairings: Record<string, string[]> = {
      "philadelphia": ["goatvision", "workgoat", "growth strategy", "expand", "expanding"],
      "expanding": ["growth strategy", "goatvision", "philadelphia", "expand"],
      "expand": ["growth strategy", "goatvision", "philadelphia", "expanding"],
      "interview": ["career change", "usps", "job search", "hiring", "resume"],
      "job": ["career change", "usps", "job search", "interview"],
      "burnout": ["career change", "stress patterns"],
      "money": ["finances", "funding", "budget"]
    };

    Object.entries(semanticPairings).forEach(([trigger, targets]) => {
      if (recentTexts.includes(trigger)) {
        targets.forEach(target => {
          if (title.includes(target) || desc.includes(target) || summary.includes(target)) {
            score += 15;
            details.semanticMatches += 1;
          }
        });
      }
    });

    return { file, score, details };
  });

  // Filter items with positive score, sort by score descending
  const matched = scoredFiles
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.file);

  if (matched.length > 0) {
    return matched.slice(0, 5); // Return top matched
  }

  // Fallback: Return top 2 based on importance_score
  return [...activeFiles]
    .sort((a, b) => (b.importance_score || 0) - (a.importance_score || 0))
    .slice(0, 2);
}

// Model-Powered Stage 1 Semantic Connection & Context Router
async function retrieveRelevantMemoryFiles(messages: any[], files: any[]): Promise<any[]> {
  // Use seeded files if current state is empty
  const activeFiles = (!files || files.length === 0) ? SEEDED_MEMORY_FILES : files;

  // We construct a shallow, token-efficient summary of existing files to instruct the router
  const fileDefinitions = activeFiles.map(f => ({
    file_id: f.file_id,
    title: f.title,
    description: f.description,
    keywords: f.keywords || [],
    related_projects: f.related_projects || [],
    related_people: f.related_people || [],
    emotional_tags: f.emotional_tags || [],
    summary: f.summary || ""
  }));

  // Combine content from recent messages to feed context to the router
  const recentMessagesText = messages
    .slice(-5)
    .map(m => `${m.role === 'assistant' ? 'Melvin' : 'Michael'}: ${m.content}`)
    .join("\n");

  try {
    const aiInstance = getGeminiClient();
    
    const routerPrompt = `Determine which memory files from the provided list are semantically/contextually relevant to the user's latest conversation turn.

You must perform absolute:
- Intent detection
- Project detection
- People & relationship detection
- Location detection (e.g. Philadelphia plans must resolve to GOATvision)
- Emotional themes / underlying tone validation
- Recurring topics & context triggers matching

Existing Memory Files database:
${JSON.stringify(fileDefinitions, null, 2)}

Recent Conversation Thread with Michael:
${recentMessagesText}

Instructions:
1. Identify all existing memory file_ids that are highly contextually, semantically, or themes-based equivalent or relevant to what Michael is expressing.
2. Ensure you map location-based expansions like "Philadelphia" to the direct project file (GOATvision).
3. Ensure organizational references like "USPS" map directly to the Career Change context (or Job Search if relevant).
4. Ensure family/people references like "Paul" or other relationships are connected correctly to their appropriate thematic memory files.
5. Provide a parallel confidence value ('high', 'medium', 'low') matching each matched file_id in relevantFiles.
6. Check if Michael is discussing a deep, new segment of his life that doesn't correspond to any existing file. If so, return createNewFile: true and suggest a short, literal, human-friendly title in newFileTitle (e.g., "Marriage", "Finances", "Health", etc.). Otherwise, return createNewFile: false.

Output must strictly match the response schema JSON structure.`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.5-flash",
      contents: routerPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            relevantFiles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array of matched relevant memory file_id strings."
            },
            confidence: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Corresponding confidence rankings: 'high', 'medium', or 'low' representing context matching quality."
            },
            createNewFile: {
              type: Type.BOOLEAN,
              description: "True if a brand-new contextual memory file should exist to hold this fresh thematic domain."
            },
            newFileTitle: {
              type: Type.STRING,
              description: "Clean, literal title for a suggested new memory file if createNewFile is true, else empty string or null.",
              nullable: true
            }
          },
          required: ["relevantFiles", "confidence", "createNewFile"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    const matchedIds = parsed.relevantFiles || [];

    console.log("[Semantic Router Evaluation]:", {
      detected: matchedIds,
      confidence: parsed.confidence,
      createNewFile: parsed.createNewFile,
      newFileTitle: parsed.newFileTitle
    });

    // Resolve matching files by matching back with actual instances
    const matched = activeFiles.filter(f => matchedIds.includes(f.file_id));

    if (matched.length > 0) {
      // Sort by the matched ranking index returned by Gemini
      return matched
        .sort((a, b) => matchedIds.indexOf(a.file_id) - matchedIds.indexOf(b.file_id))
        .slice(0, 5);
    }
  } catch (error) {
    console.error("[Semantic Router Error] Encountered exception, falling back to legacy keyword patterns. Detail:", error);
  }

  // Resilient fallback logic
  return runLegacyHeuristicMatcher(messages, activeFiles);
}

// Memory extraction instructions for the backend extraction routine
const extractionInstruction = `You are Melvin's persistent memory and friendly cognitive extraction system.
Your job is to read a conversation history between the user and Melvin (the 16-bit warm, calm, and thoughtful companion goat) along with the user's current "Life Map" state, and output a freshly updated, synthesized, and deep "Life Map" JSON object representing his major storylines, thoughts, and reflections.

CORE COGNITIVE RULES:
1. IDENTIFY NEW FACTS: Look for deep, newly-revealed personal details, contextual circumstances, career or emotional status changes, or lifestyle decisions. Integrate them contextually into the relevant profile properties and memory files summaries.
2. IDENTIFY NEW PEOPLE: Look for any mentioned individuals (e.g., coworkers, business partners, family members, friends) and their roles in the user's life. Add them to profile.relationships (max 8) and list them under their respective memory file's related_people field.
3. IDENTIFY NEW PROJECTS: If the user mentions a specific project (e.g., a software tool, personal initiative, geographical rollout plan), identify it. Synthesize its details, map its keywords, and link it in the related_projects lists.
4. IDENTIFY NEW MILESTONES: Spot key achievements, mindset breakthroughs, goals achieved, or visual canvas layout completions. Record these as new wins or add them as bullet items in key_memories in the relevant MemoryFile.
5. IDENTIFY RESOLVED THREADS: Review previous open threads. If their core topic was addressed, resolved, or sufficiently explored in this conversation, ensure you return their status as "resolved".
6. STRICT MEMORY BLOAT PREVENTION:
   - Cap profile lists strictly (maximum 8 items per category inside the profile object). Merge duplicate, overlapping, or older redundant historical items.
   - NEVER create a new memory file for trivial, transient, or minor single-session topics. Only create a brand new memory file when a major topic recurs across multiple session points, carries significant emotional/personal weight, and holds obvious future relevance.
   - Keep existing file_ids EXACTLY unchanged when updating files. Do NOT duplicate thematic buckets.
   - Do NOT store superficial details like food preferences, small daily chores, or passing whims. Look only for persistent psychodynamic factors, career transitions, fears, and strategic milestones.

You must output in strict JSON format matching the requested schema.`;

function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// API endpoint for Melvin's reasoning chat
app.post("/api/melvin/chat", async (req, res) => {
  try {
    const { messages, settings, lifeMap } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing or malformed 'messages' array." });
      return;
    }

    const currentSettings = settings || {
      challenge_level: "high",
      humor: "medium",
      warmth: "high",
      directness: "high",
      career_focus: true,
      personal_growth_focus: true
    };

    const allMemoryFiles = lifeMap?.memoryFiles || [];
    const matchedFiles = await retrieveRelevantMemoryFiles(messages, allMemoryFiles);

    const aiInstance = getGeminiClient();
    const systemInstruction = buildMelvinSystemInstruction(currentSettings, lifeMap, matchedFiles);

    // Convert messages to Gemini's expected format (role "user" or "model")
    const contents = messages.map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.85,
        topP: 0.95,
      }
    });

    const replyText = response.text || "I was thinking... and couldn't quite find the words. What are your thoughts?";
    res.json({ reply: replyText });
  } catch (error: any) {
    console.error("Error communicating with Melvin's brain:", error);
    res.status(500).json({ 
      error: error.message || "An error occurred with Melvin's neural chip.",
      details: "Please verify that your GEMINI_API_KEY is configured in Settings > Secrets."
    });
  }
});

// New background / explicit extraction endpoint
app.post("/api/melvin/extract-lifemap", async (req, res) => {
  try {
    const { messages, currentLifeMap } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing or malformed 'messages' array." });
      return;
    }

    const aiInstance = getGeminiClient();

    // Prepare default LifeMap structure if client didn't send one
    const lifeMap = currentLifeMap || {
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

    if (!lifeMap.memoryFiles || lifeMap.memoryFiles.length === 0) {
      lifeMap.memoryFiles = SEEDED_MEMORY_FILES;
    }

    // Prompt the model with the existing LifeMap and full messaging conversation to synthesise changes
    const prompt = `Below is the user's current "Life Map" memory, including the current list of contextual memoryFiles if any:
${JSON.stringify(lifeMap, null, 2)}

Below is the recent thread of conversation with Melvin:
${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}

Analyze this conversation and perform a high-fidelity Automatic Memory Synthesis following these rules:
1. IDENTIFY NEW FACTS & PROFILE DETAILS: Extract deep personal updates. Update goals, fears, career, stressors, beliefs, and blind spots. capped at max 8 items per category. Merge duplicates. Avoid storing trivial details.
2. IDENTIFY NEW PEOPLE: If new people (friends, family, colleagues, mentors) are mentioned, add them to the relationships list and correlate them with relevant memory files under 'related_people'.
3. IDENTIFY NEW PROJECTS: Identify any projects the user is pursuing and link them in 'related_projects' across memory files.
4. IDENTIFY NEW MILESTONES: Add significant accomplishments or key breakthroughs as 'wins' in the profile, or list as key memories inside updated memory files.
5. TRACK UNFINISHED vs RESOLVED THREADS: Review existing open threads. If any were discussed, mark status as 'resolved'. If new open loops are left, create a fresh thread showing status 'open'.
6. UPDATE & SYNTHESIZE MEMORY FILES: Consolidate updates into 'memoryFiles'.
   - Keep the file_id unchanged for existing files.
   - Create a NEW memory file (generating a mem_xxxx ID) ONLY if a topic is recurring, emotionally robust, has obvious future relevance, and does not fit an existing bucket. Avoid creating new files for minor/transient topics.`;

    const response = await aiInstance.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: extractionInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile: {
              type: Type.OBJECT,
              properties: {
                goals: { type: Type.ARRAY, items: { type: Type.STRING } },
                fears: { type: Type.ARRAY, items: { type: Type.STRING } },
                relationships: { type: Type.ARRAY, items: { type: Type.STRING } },
                career: { type: Type.ARRAY, items: { type: Type.STRING } },
                stressors: { type: Type.ARRAY, items: { type: Type.STRING } },
                wins: { type: Type.ARRAY, items: { type: Type.STRING } },
                beliefs: { type: Type.ARRAY, items: { type: Type.STRING } },
                blind_spots: { type: Type.ARRAY, items: { type: Type.STRING } },
                communication_preferences: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ["goals", "fears", "relationships", "career", "stressors", "wins", "beliefs", "blind_spots", "communication_preferences"],
            },
            observationsItems: {
              type: Type.ARRAY,
              description: "Tactical, meta-level psychological insights into the user's patterns. Max 2-3 per conversation.",
              items: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  depth: { type: Type.STRING, description: "surface, moderate, profound" }
                },
                required: ["summary", "depth"]
              }
            },
            newTimelineEntries: {
              type: Type.ARRAY,
              description: "New user breakthroughs or shifts that occurred in this conversation. Return EMPTY array if nothing major changed.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  category: { type: Type.STRING, description: "mindset_shift, breakthrough, avoidance_behavior, goal_achievement, milestone" }
                },
                required: ["title", "description", "category"]
              }
            },
            unfinishedThreads: {
              type: Type.ARRAY,
              description: "Major tensions or open topics left hanging that require future follow-up.",
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  triggerQuestion: { type: Type.STRING },
                  context: { type: Type.STRING },
                  status: { type: Type.STRING, description: "open or resolved" }
                },
                required: ["topic", "triggerQuestion", "context", "status"]
              }
            },
            memoryFiles: {
              type: Type.ARRAY,
              description: "The complete, synthesized list of memory files (context buckets) for topics that are recurring, emotionally significant, or core domains like Career, Family, relationship, stress, avoidance etc.",
              items: {
                type: Type.OBJECT,
                properties: {
                  file_id: { type: Type.STRING, description: "Unique identifier. Keep original if updating an existing file, else generate 'mem_' prefix followed by random digits" },
                  title: { type: Type.STRING, description: "Standard domain or topic title, e.g., 'Career', 'Family', 'Finances', 'Stress Patterns', 'Avoidance', 'Marriage / Relationship'" },
                  description: { type: Type.STRING, description: "High-level summary of what this memory file tracks" },
                  keywords: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Keywords associated with this memory file for search/matching" },
                  related_people: { type: Type.ARRAY, items: { type: Type.STRING } },
                  related_projects: { type: Type.ARRAY, items: { type: Type.STRING } },
                  emotional_tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                  importance_score: { type: Type.INTEGER, description: "High relevance/impact: 1 to 10" },
                  summary: { type: Type.STRING, description: "An updated narrative paragraph overview of the user's progress, state, and key challenges in this area." },
                  key_memories: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Up to 5 concrete emotionally rich memories or milestones in this category." },
                  unresolved_threads: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Hanging loops or tension points." },
                  trigger_questions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Questions Melvin can use to prompt exploration." }
                },
                required: ["file_id", "title", "description", "keywords", "related_people", "related_projects", "emotional_tags", "importance_score", "summary", "key_memories", "unresolved_threads", "trigger_questions"]
              }
            }
          },
          required: ["profile", "observationsItems", "newTimelineEntries", "unfinishedThreads", "memoryFiles"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response returned from the memory extraction model.");
    }

    const payload = JSON.parse(resultText);

    // MERGE LOGIC:
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // 1. Incorporate updated factual profile base
    lifeMap.profile = payload.profile;

    // Force observations and breakthroughs/timeline to remain empty arrays (no memory of them)
    lifeMap.observations = [];
    lifeMap.timeline = [];

    // 4. Merge Unfinished conversation threads
    if (payload.unfinishedThreads && Array.isArray(payload.unfinishedThreads)) {
      payload.unfinishedThreads.forEach((th: any) => {
        const existingIndex = lifeMap.unfinishedThreads.findIndex((t: any) => t.topic.toLowerCase() === th.topic.toLowerCase());
        if (existingIndex > -1) {
          // Update status or other features
          lifeMap.unfinishedThreads[existingIndex].status = th.status || 'open';
          lifeMap.unfinishedThreads[existingIndex].triggerQuestion = th.triggerQuestion;
          lifeMap.unfinishedThreads[existingIndex].context = th.context;
        } else if (th.status === 'open') {
          // Append new thread
          lifeMap.unfinishedThreads.push({
            id: generateId(),
            topic: th.topic,
            triggerQuestion: th.triggerQuestion,
            context: th.context,
            status: 'open',
            timestamp: currentDate
          });
        }
      });
    }

    // 5. Synthesize and merge memory files
    if (payload.memoryFiles && Array.isArray(payload.memoryFiles)) {
      // Set the last updated date on any files that changed
      const originalFilesMap = new Map((lifeMap.memoryFiles || []).map((f: any) => [f.file_id, f]));
      payload.memoryFiles.forEach((file: any) => {
        const original = originalFilesMap.get(file.file_id) as any;
        if (!original || JSON.stringify(original) !== JSON.stringify(file)) {
          file.last_updated = currentDate;
        } else {
          file.last_updated = original.last_updated || currentDate;
        }
      });
      lifeMap.memoryFiles = payload.memoryFiles;
    }

    // Keep entries tidy/capped if necessary
    if (lifeMap.observations.length > 25) {
      lifeMap.observations = lifeMap.observations.slice(-25);
    }

    res.json({ lifeMap });
  } catch (err: any) {
    console.error("Error performing background Life Map extraction:", err);
    res.status(500).json({ error: err.message || "Failed to extract Life Map insights." });
  }
});


// Setup Vite development server or serve static assets in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Melvin's server running in ${process.env.NODE_ENV === 'production' ? 'production' : 'development'} on port ${PORT}`);
  });
}

startServer();
