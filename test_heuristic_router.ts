import fs from "fs";

const SEEDED_MEMORY_FILES = [
  {
    file_id: "mem_goatvision",
    title: "GOATvision",
    description: "Unifying visual interface and workspace blueprint.",
    keywords: ["goatvision", "philadelphia", "expanding", "expand", "blueprint", "vision", "dashboard"],
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
    keywords: ["workgoat", "philadelphia", "task", "delegation", "mechanics", "dispatch"],
    related_people: ["Paul"],
    related_projects: ["WorkGOAT"],
    emotional_tags: ["determined", "grounded"],
    importance_score: 8,
    summary: "A localized operational platform focusing on trade tasks, mechanics workflows, and local task loops. dispatch routing algorithms."
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
    keywords: ["career", "interview", "pivot", "transition", "job", "corporate", "burnout"],
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
    keywords: ["usps", "interview", "mail", "delivery", "postal", "shifts"],
    related_people: [],
    related_projects: ["USPS"],
    emotional_tags: ["grounded", "pragmatic"],
    importance_score: 7,
    summary: "Strategic consideration of a predictable, public-sector role to secure base-level cashflow and health insurance while building parallel operations. Postal carrying and double shifts physical endurance demands."
  },
  {
    file_id: "mem_job_search",
    title: "Job Search",
    description: "Direct application funnel, resume tracking, and interview stats.",
    keywords: ["job search", "interview", "hiring", "apply", "applications", "resume", "history"],
    related_people: [],
    related_projects: ["Job Search"],
    emotional_tags: ["persistent", "hopeful"],
    importance_score: 8,
    summary: "Monitoring active job pipeline. Tracking application counts, introductory screenings, and technical assessments."
  }
];

function runLegacyHeuristicMatcher(userInput: string, activeFiles: any[]): any[] {
  const recentTexts = userInput.toLowerCase();

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
      "philly": ["goatvision", "workgoat", "growth strategy", "expand", "expanding"],
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

  // Fallback: Empty array indicates new domain candidate or empty match
  return [];
}

interface TestInput {
  id: number;
  input: string;
  category: string;
  expectedFiles: string[];
  expectedNewFile: boolean;
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
    notes: "Philly/Philadelphia maps to GOATvision, WorkGOAT, and Growth Strategy."
  },
  {
    id: 3,
    input: "I'm tired of explaining my job history over and over.",
    category: "emotional context",
    expectedFiles: ["mem_career_change", "mem_job_search"],
    expectedNewFile: false,
    notes: "Job history fatigue maps to career pivot burnout and job search funnel tracking."
  },
  {
    id: 4,
    input: "What if the city dashboard idea became the wedge?",
    category: "implied project",
    expectedFiles: ["mem_goatvision"],
    expectedNewFile: false,
    notes: "Dashboard references the GOATvision canvas layout."
  },
  {
    id: 5,
    input: "I had another rough migraine day.",
    category: "new file detection",
    expectedFiles: [],
    expectedNewFile: true,
    notes: "Migraines represent health patterns outside corporate/project scopes."
  },
  {
    id: 6,
    input: "How should we think about regulatory hurdles with the dispatch system?",
    category: "implied project",
    expectedFiles: ["mem_workgoat"],
    expectedNewFile: false,
    notes: "Dispatch refers to dispatcher operations on WorkGOAT."
  },
  {
    id: 7,
    input: "The interview panel raised some concerns about my tenure at the old firm.",
    category: "explicit mention",
    expectedFiles: ["mem_career_change", "mem_job_search"],
    expectedNewFile: false,
    notes: "Interview and panels connect with Career Change and Job Search."
  },
  {
    id: 8,
    input: "I think we should hire local dispatch organizers in Pennsylvania.",
    category: "location & project",
    expectedFiles: ["mem_growth_strategy", "mem_workgoat"],
    expectedNewFile: false,
    notes: "Hiring organizers relates to regional Growth Strategy and WorkGOAT loops."
  },
  {
    id: 9,
    input: "Sometimes I feel like I'm just planning everything to delay doing the work.",
    category: "emotional/blind spot",
    expectedFiles: ["mem_career_change"],
    expectedNewFile: false,
    notes: "Procrastination / delay is associated with corporate planning burnout cycles."
  },
  {
    id: 10,
    input: "My brother mentioned some opportunities at the shipping hubs.",
    category: "people/implied project",
    expectedFiles: ["mem_usps"],
    expectedNewFile: false,
    notes: "Shipping hubs translate to the USPS public roles strategy."
  },
  {
    id: 11,
    input: "I made a custom dispatch routing portfolio yesterday.",
    category: "implied project",
    expectedFiles: ["mem_workgoat", "mem_job_search"],
    expectedNewFile: false,
    notes: "Dispatch routing links to WorkGOAT; portfolio links to Career/Job Search callbacks."
  },
  {
    id: 12,
    input: "What if I can't survive the physically exhausting double shifts?",
    category: "emotional/vague follow-up",
    expectedFiles: ["mem_usps"],
    expectedNewFile: false,
    notes: "Double shifts are the hallmark stressors of the USPS dual-track."
  },
  {
    id: 13,
    input: "Can we focus on how to transition out of corporate burnout?",
    category: "emotional context",
    expectedFiles: ["mem_career_change"],
    expectedNewFile: false,
    notes: "Burnout transitions map precisely to Career Change keywords."
  },
  {
    id: 14,
    input: "We need to plan a budget for regional operations hub leaders.",
    category: "implied project",
    expectedFiles: ["mem_growth_strategy"],
    expectedNewFile: false,
    notes: "Regional operations budget links with Growth Strategy."
  },
  {
    id: 15,
    input: "I got an introductory screening callback!",
    category: "explicit mention",
    expectedFiles: ["mem_job_search", "mem_career_change"],
    expectedNewFile: false,
    notes: "Callbacks/screening align with active Job Search tracker."
  },
  {
    id: 16,
    input: "I'm having a hard time balancing the late night systems design with carrying mail physically.",
    category: "explicit mention",
    expectedFiles: ["mem_usps", "mem_workgoat"],
    expectedNewFile: false,
    notes: "Carrying mail is USPS; systems design maps to WorkGOAT platforms."
  },
  {
    id: 17,
    input: "The dispatch UI needs to combine all active local mechanic schedules.",
    category: "implied project",
    expectedFiles: ["mem_workgoat", "mem_goatvision"],
    expectedNewFile: false,
    notes: "Mechanic schedule dispatcher links with WorkGOAT and dashboard UI with GOATvision."
  },
  {
    id: 18,
    input: "I was thinking of setting up a structured framework for our personal finances.",
    category: "new file detection",
    expectedFiles: [],
    expectedNewFile: true,
    notes: "Finances represent a brand-new area outside the existing 6 files."
  },
  {
    id: 19,
    input: "What if we test the localized mechanic loops in Pittsburgh instead of Philly?",
    category: "location & project",
    expectedFiles: ["mem_growth_strategy", "mem_workgoat"],
    expectedNewFile: false,
    notes: "Pittsburgh tests link with scaling Growth Strategy and WorkGOAT loops."
  },
  {
    id: 20,
    input: "My sleep has been a mess because of the stressful timeline.",
    category: "emotional/health",
    expectedFiles: [],
    expectedNewFile: true,
    notes: "Sleep/somatic health patterns exist outside the project buckets."
  }
];

function startHeuristicTestSuite() {
  console.log("======================================================================");
  console.log("            OFFLINE HEURISTIC ROUTER VALIDATION TEST RUNNER            ");
  console.log("======================================================================\n");

  let passedTests = 0;
  const HEURISTIC_RESULTS_FILE = "heuristic_test_results.txt";
  fs.writeFileSync(HEURISTIC_RESULTS_FILE, "");

  function appendLog(msg: string) {
    console.log(msg);
    fs.appendFileSync(HEURISTIC_RESULTS_FILE, msg + "\n");
  }

  appendLog(`Evaluating ${testInputs.length} test inputs against runLegacyHeuristicMatcher...\n`);

  testInputs.forEach(test => {
    appendLog(`Scenario #${test.id} [Category: ${test.category}]`);
    appendLog(`User Input: "${test.input}"`);
    appendLog(`Expected Memory Files: ${JSON.stringify(test.expectedFiles)} | Expect New File: ${test.expectedNewFile}`);

    const matchedFiles = runLegacyHeuristicMatcher(test.input, SEEDED_MEMORY_FILES);
    const matchedIds = matchedFiles.map(f => f.file_id);

    // Criteria:
    // 1. If expecting new file (no current file), we match empty and detect new file.
    // 2. If expecting existing file, matched files must contain at least one of the expected files.
    let pass = false;
    if (test.expectedNewFile) {
      // In heuristic, an empty result indicates no pre-existing match -> triggers new file discovery
      if (matchedIds.length === 0) {
        pass = true;
      }
    } else {
      pass = test.expectedFiles.some(expected => matchedIds.includes(expected));
    }

    if (pass) {
      passedTests++;
      appendLog(`STATUS: PASS`);
    } else {
      appendLog(`STATUS: FAIL`);
    }

    appendLog(`Actual Matches: ${JSON.stringify(matchedIds)}`);
    appendLog(`Notes: ${test.notes}`);
    appendLog("----------------------------------------------------------------------\n");
  });

  const passRate = (passedTests / testInputs.length) * 100;
  appendLog("======================================================================");
  appendLog("                    HEURISTIC ROUTER EVALUATION SUMMARY             ");
  appendLog("======================================================================");
  appendLog(`Total Scenarios Checked: ${testInputs.length}`);
  appendLog(`Passed Scenarios: ${passedTests}`);
  appendLog(`Failed/Mismatched Scenarios: ${testInputs.length - passedTests}`);
  appendLog(`Offline Match Success Rate: ${passRate.toFixed(1)}%`);
  appendLog("======================================================================\n");
}

startHeuristicTestSuite();
