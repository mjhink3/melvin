/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LifeMap } from './types';

export const DEFAULT_LIFEMAP: LifeMap = {
  profile: {
    goals: [
      "Transition out of corporate burnout to full-time creative autonomy.",
      "Expand WorkGOAT operations to mid-tier eastern cities.",
      "Maintain a predictable base-level cash-flow to sustain research loops."
    ],
    fears: [
      "Repeating legacy corporate cycles of over-commitment and burnout.",
      "Financial instability interrupting long-term strategic projects.",
      "Losing operational focus under heavy administrative workloads."
    ],
    relationships: [
      "Local mechanics network (WorkGOAT partners)",
      "Senior corporate mentors (Legacy ties)",
      "Technical peers in the geographical developer hub"
    ],
    career: [
      "Software Systems Design and geographical deployment pipelines.",
      "Postal cargo mechanics and route delivery logistics."
    ],
    stressors: [
      "Heavy administrative workloads.",
      "Balancing physical endurance on shift work with deep cerebral design hours."
    ],
    wins: [
      "Engineered the initial dispatch routing algorithm for WorkGOAT.",
      "Secured an interview panel callback with the public sector."
    ],
    beliefs: [
      "Absolute creative freedom is worth more than gold-plated corporate comfort.",
      "Operations must remain small and self-sufficient before geographical scale."
    ],
    blind_spots: [
      "May occasionally over-focus on planning details to delay physical layout execution.",
      "Reluctant to ask for peer support when operational pressures peak."
    ],
    communication_preferences: [
      "Warm and calm check-ins.",
      "Friendly exploration, directness with deep patience."
    ]
  },
  observations: [],
  timeline: [],
  unfinishedThreads: [
    {
      id: "th_01",
      topic: "USPS Dual-Track Strategy",
      context: "Deciding if taking a steady service-sector position leaves enough intellectual capital for coding WorkGOAT.",
      triggerQuestion: "How are you feeling about balancing the USPS double-shifts with late-night systems design?",
      status: "open",
      timestamp: "May 30, 2026"
    }
  ],
  memoryFiles: [
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
  ]
};

export const MELVIN_OPENINGS = [
  "Hey Michael. Good to hear from you.",
  "What's up?",
  "How's your day going?",
  "How can I be a friend today?",
  "Hey Michael. Good to hear your voice. What's been on your mind today?"
];

export function getRandomMelvinOpening(): string {
  const index = Math.floor(Math.random() * MELVIN_OPENINGS.length);
  return MELVIN_OPENINGS[index];
}
