import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const RESULTS_FILE = "test_results.txt";

function logBoth(msg: string) {
  console.log(msg);
  fs.appendFileSync(RESULTS_FILE, msg + "\n");
}

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
    summary: "Workspace blueprint designed to unify workflows and track strategic priorities. Focuses on local geographical expansion."
  },
  {
    file_id: "mem_workgoat",
    title: "WorkGOAT",
    description: "Task delegation and mechanics platform.",
    keywords: ["workgoat", "philadelphia", "task", "delegation", "mechanics"],
    related_people: ["Paul"],
    related_projects: ["WorkGOAT"],
    emotional_tags: ["determined", "grounded"],
    importance_score: 8,
    summary: "A localized operational platform focusing on trade tasks, mechanics workflows, and local task loops."
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
    summary: "Plans to scale physical footprint and hire local operations leads. Philadelphia is identified as a primary expansion testing ground."
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
    summary: "Active transition away from high-stress corporate legacy structures into roles with higher creative freedom and work-life agency."
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
    summary: "Strategic consideration of a predictable, public-sector role to secure base-level cashflow and health insurance while building parallel operations."
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
    summary: "Monitoring active job pipeline. Tracking application counts, introductory screenings, and technical assessments."
  }
];

interface TestInput {
  id: number;
  input: string;
  category: string;
  expectedFiles: string[];
  expectedNewFile: boolean;
  expectedNewTitle?: string;
  notes: string;
}

const testInputs: TestInput[] = [
  {
    id: 1,
    input: "I talked to Paul again today.",
    category: "people",
    expectedFiles: ["mem_workgoat"],
    expectedNewFile: false,
    notes: "Paul is a contact associated with the WorkGOAT mechanics platform."
  },
  {
    id: 2,
    input: "I still think Philly might be the next city.",
    category: "implied project/location",
    expectedFiles: ["mem_goatvision", "mem_growth_strategy", "mem_workgoat"],
    expectedNewFile: false,
    notes: "Philadelphia represents regional geographic expansion targets across GOATvision, WorkGOAT, and Growth Strategy."
  },
  {
    id: 3,
    input: "I'm tired of explaining my job history over and over.",
    category: "emotional context",
    expectedFiles: ["mem_career_change", "mem_job_search"],
    expectedNewFile: false,
    notes: "Job history and interviews are linked with Career Change and active Job Search fatigue."
  },
  {
    id: 4,
    input: "What if the city dashboard idea became the wedge?",
    category: "implied project",
    expectedFiles: ["mem_goatvision"],
    expectedNewFile: false,
    notes: "City dashboard relates heavily to GOATvision blueprint interfaces."
  },
  {
    id: 5,
    input: "I had another rough migraine day.",
    category: "new file detection",
    expectedFiles: [],
    expectedNewFile: true,
    expectedNewTitle: "Health",
    notes: "Migraines represent health patterns and are outside existing memory buckets, so a new file suggestion is expected."
  },
  {
    id: 6,
    input: "How should we think about regulatory hurdles with the dispatch system?",
    category: "implied project",
    expectedFiles: ["mem_workgoat"],
    expectedNewFile: false,
    notes: "Dispatch system is the core of WorkGOAT mechanics operations."
  },
  {
    id: 7,
    input: "The interview panel raised some concerns about my tenure at the old firm.",
    category: "explicit mention",
    expectedFiles: ["mem_career_change", "mem_job_search"],
    expectedNewFile: false,
    notes: "Panels, interviews, tenure reference Career Change and active Job Search."
  },
  {
    id: 8,
    input: "I think we should hire local dispatch organizers in Pennsylvania.",
    category: "location & project",
    expectedFiles: ["mem_growth_strategy", "mem_workgoat"],
    expectedNewFile: false,
    notes: "Hiring and local operations scale refer to Growth Strategy and WorkGOAT, located in Pennsylvania/Philly area."
  },
  {
    id: 9,
    input: "Sometimes I feel like I'm just planning everything to delay doing the work.",
    category: "emotional/blind spot",
    expectedFiles: ["mem_career_change", "mem_goatvision"],
    expectedNewFile: false,
    notes: "Planning delays relate to procrastination, blueprints/GOATvision delays, or burnout career transitions."
  },
  {
    id: 10,
    input: "My brother mentioned some opportunities at the shipping hubs.",
    category: "people/implied project",
    expectedFiles: ["mem_usps"],
    expectedNewFile: false,
    notes: "Shipping hubs, mail, postal services map to the USPS parallel strategy."
  },
  {
    id: 11,
    input: "I made a custom dispatch routing portfolio yesterday.",
    category: "implied project",
    expectedFiles: ["mem_workgoat", "mem_job_search"],
    expectedNewFile: false,
    notes: "Dispatch routing links to WorkGOAT and portfolios/interviews to Job Search."
  },
  {
    id: 12,
    input: "What if I can't survive the physically exhausting double shifts?",
    category: "emotional/vague follow-up",
    expectedFiles: ["mem_usps"],
    expectedNewFile: false,
    notes: "Physical shift work and stamina is the core dilemma of the USPS dual-track career strategy."
  },
  {
    id: 13,
    input: "Can we focus on how to transition out of corporate burnout?",
    category: "emotional context",
    expectedFiles: ["mem_career_change"],
    expectedNewFile: false,
    notes: "Transitioning out of high-pressure corporate environments maps to Career Change."
  },
  {
    id: 14,
    input: "We need to plan a budget for regional operations hub leaders.",
    category: "implied project",
    expectedFiles: ["mem_growth_strategy"],
    expectedNewFile: false,
    notes: "Budgets, hiring leaders, regional hubs relate directly to regional Growth Strategy."
  },
  {
    id: 15,
    input: "I got an introductory screening callback!",
    category: "explicit mention",
    expectedFiles: ["mem_job_search", "mem_career_change"],
    expectedNewFile: false,
    notes: "Callbacks and screens are active job pipeline components."
  },
  {
    id: 16,
    input: "I'm having a hard time balancing the late night systems design with carrying mail physically.",
    category: "explicit mention",
    expectedFiles: ["mem_usps", "mem_workgoat"],
    expectedNewFile: false,
    notes: "Carrying mail is USPS; systems design relates to WorkGOAT dispatcher / GOATvision architecture."
  },
  {
    id: 17,
    input: "The dispatch UI needs to combine all active local mechanic schedules.",
    category: "implied project",
    expectedFiles: ["mem_workgoat", "mem_goatvision"],
    expectedNewFile: false,
    notes: "Mechanic schedule UI and active lists draw from WorkGOAT features on the GOATvision canvas."
  },
  {
    id: 18,
    input: "I was thinking of setting up a structured framework for our personal finances.",
    category: "new file detection",
    expectedFiles: [],
    expectedNewFile: true,
    expectedNewTitle: "Finances",
    notes: "Structured family or individual accounting is a new life domain outside of existing files."
  },
  {
    id: 19,
    input: "What if we test the localized mechanic loops in Pittsburgh instead of Philly?",
    category: "location & project",
    expectedFiles: ["mem_growth_strategy", "mem_workgoat"],
    expectedNewFile: false,
    notes: "Pittsburgh tests relate to Growth Strategy and WorkGOAT expansion."
  },
  {
    id: 20,
    input: "My sleep has been a mess because of the stressful timeline.",
    category: "emotional/health",
    expectedFiles: [],
    expectedNewFile: true,
    expectedNewTitle: "Health",
    notes: "Sleep patterns and somatic stress are health topics that should suggest a new Health file."
  }
];

async function runSemanticRouter(userInput: string): Promise<any> {
  const fileDefinitions = SEEDED_MEMORY_FILES.map(f => ({
    file_id: f.file_id,
    title: f.title,
    description: f.description,
    keywords: f.keywords || [],
    related_projects: f.related_projects || [],
    related_people: f.related_people || [],
    summary: f.summary || ""
  }));

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable is required to run test suite.");
  }

  const aiInstance = new GoogleGenAI({ apiKey: key });

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

Michael's input:
Michael: "${userInput}"

Instructions:
1. Identify all existing memory file_ids that are highly contextually, semantically, or themes-based equivalent or relevant to what Michael is expressing.
2. Ensure you map location-based expansions like "Philadelphia" to the direct project file (GOATvision).
3. Ensure organizational references like "USPS" map directly to the Career Change context (or Job Search if relevant).
4. Ensure family/people references like "Paul" or other relationships are connected correctly to their appropriate thematic memory files.
5. Provide a parallel confidence value ('high', 'medium', 'low') matching each matched file_id in relevantFiles.
6. Check if Michael is discussing a deep, new segment of his life that doesn't correspond to any existing file. If so, return createNewFile: true and suggest a short, literal, human-friendly title in newFileTitle (e.g., "Marriage", "Finances", "Health", etc.). Otherwise, return createNewFile: false.

Output must strictly match the response schema JSON structure.`;

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    try {
      attempts++;
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

      return JSON.parse(response.text || "{}");
    } catch (error: any) {
      const errStr = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
      if (errStr.includes("429") || errStr.includes("quota") || errStr.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED") {
        logBoth(`[RAK LIMIT TRIGGERED] Current Gemini API quota limits reached. Sleeping 40 seconds before retrying (Attempt ${attempts}/${maxAttempts})...`);
        await new Promise(resolve => setTimeout(resolve, 40000));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Failed to route semantically after maximum retries due to persistent rate limiting.");
}

async function startTestSuite() {
  // Clear file from prior runs
  fs.writeFileSync(RESULTS_FILE, "");

  logBoth("======================================================================");
  logBoth("            SEMANTIC ROUTER STAGE 1 VALIDATION TEST RUNNER             ");
  logBoth("======================================================================\n");
  logBoth(`Starting execution over ${testInputs.length} test scenarios...\n`);

  let passedTests = 0;

  for (const test of testInputs) {
    logBoth(`Scenario #${test.id} [Category: ${test.category}]`);
    logBoth(`User Input: "${test.input}"`);
    logBoth(`Expected Files: ${JSON.stringify(test.expectedFiles)} | Expect New File: ${test.expectedNewFile} (${test.expectedNewTitle || 'None'})`);

    try {
      const result = await runSemanticRouter(test.input);
      const actualFiles = result.relevantFiles || [];
      const confidence = result.confidence || [];
      const createNewFile = !!result.createNewFile;
      const newFileTitle = result.newFileTitle || null;

      // Determine Pass / Fail Criteria
      // 1. If expecting file match, at least one of the expected files must be present in actual matches or have an exact semantic equivalent.
      // 2. If expecting a new file, createNewFile should be true.
      let pass = true;

      if (test.expectedNewFile) {
        if (!createNewFile) {
          pass = false;
        }
      } else {
        // Must match at least one expected file
        const matchFound = test.expectedFiles.some(expected => actualFiles.includes(expected));
        if (!matchFound && test.expectedFiles.length > 0) {
          pass = false;
        }
      }

      if (pass) {
        passedTests++;
        logBoth(`STATUS: PASS`);
      } else {
        logBoth(`STATUS: FAIL`);
      }

      logBoth(`Actual Returned Files: ${JSON.stringify(actualFiles)}`);
      if (actualFiles.length > 0) {
        logBoth(`Confidence Rankings: ${JSON.stringify(confidence)}`);
      }
      logBoth(`Suggest Create New File: ${createNewFile} ${newFileTitle ? `(Title: "${newFileTitle}")` : ""}`);
      logBoth(`Notes: ${test.notes}`);
      logBoth("----------------------------------------------------------------------\n");

      // Modest throttle to stay clear of rate limits (5 RPM for free tier is 12s per call minimum)
      await new Promise(resolve => setTimeout(resolve, 13000));

    } catch (e: any) {
      logBoth(`STATUS: ERROR RUNNING SCENARIO`);
      logBoth(`Error detail: ${e.message || JSON.stringify(e)}`);
      logBoth("----------------------------------------------------------------------\n");
      // Still wait to let quota recover
      await new Promise(resolve => setTimeout(resolve, 13000));
    }
  }

  const passRate = (passedTests / testInputs.length) * 100;
  logBoth("======================================================================");
  logBoth("                         FINAL EVALUATION SUMMARY                     ");
  logBoth("======================================================================");
  logBoth(`Total Scenarios: ${testInputs.length}`);
  logBoth(`Passed Scenarios: ${passedTests}`);
  logBoth(`Failed/Mismatched Scenarios: ${testInputs.length - passedTests}`);
  logBoth(`Final Success Rate: ${passRate.toFixed(1)}%`);
  logBoth("======================================================================\n");
}

startTestSuite();
