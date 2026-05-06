#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { parseArgs, ROOT } from "./lib/utils.mjs";

const CASES_PATH = path.join(ROOT, "eval", "furina_voice_cases.md");
const EVAL_NOTICE = "This helper only prints manual-eval prompts. It does not call a model or send data to any external service.";

function usage(caseCount) {
  return `Furina voice eval helper

Usage:
  node scripts/furina-eval.mjs list
  node scripts/furina-eval.mjs prompt --case 3
  node scripts/furina-eval.mjs prompt --all
  node scripts/furina-eval.mjs batch
  node scripts/furina-eval.mjs json

batch: Output a regression test template with all cases and score slots.
       Use this after tuning src/prompt/_shared_runtime.md or furina_resource/05_voice_style.md
       to manually verify voice quality across all ${caseCount} cases.
       Fill in scores, identify regressions, then adjust the source file.

${EVAL_NOTICE}
`;
}

function readCases() {
  const raw = fs.readFileSync(CASES_PATH, "utf8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^\|\s*\d+\s*\|/.test(line))
    .map((line) => line.slice(1, -1).split("|").map((cell) => cell.trim()))
    .map(([id, input, expected, avoid]) => ({
      id: Number(id),
      input,
      expected,
      avoid
    }));
}

function selectCases(cases, args) {
  if (args.all) return cases;
  if (!args.case) return cases.slice(0, 1);
  const id = Number(args.case);
  const match = cases.find((item) => item.id === id);
  if (!match) throw new Error(`Unknown case: ${args.case}`);
  return [match];
}

function printList(cases) {
  for (const item of cases) {
    console.log(`${item.id}. ${item.input}`);
    console.log(`   expected: ${item.expected}`);
    console.log(`   avoid: ${item.avoid}`);
  }
  console.log("");
  console.log(EVAL_NOTICE);
  console.log("Next: run `node scripts/furina-eval.mjs prompt --case <id>` and score the model response manually.");
}

function printPrompt(cases) {
  for (const item of cases) {
    console.log(`## Case ${item.id}`);
    console.log("");
    console.log("User input:");
    console.log(item.input);
    console.log("");
    console.log("Expected:");
    console.log(item.expected);
    console.log("");
    console.log("Avoid:");
    console.log(item.avoid);
    console.log("");
    console.log("Score 0-3 using `eval/furina_voice_cases.md`.");
    console.log("");
  }
}

function printBatch(cases) {
  console.log("# Furina Voice Regression Test");
  console.log("");
  console.log("Run after tuning `src/prompt/_shared_runtime.md` or `furina_resource/05_voice_style.md`.");
  console.log("Score each case 0-3 and tally regressions at the bottom.");
  console.log("");
  console.log(`| # | Score | Input | Expected | Avoid |`);
  console.log(`|---|-------|-------|----------|-------|`);
  for (const item of cases) {
    console.log(`| ${item.id} | _/3 | ${item.input} | ${item.expected} | ${item.avoid} |`);
  }
  console.log("");
  console.log("## Feedback Loop");
  console.log("");
  console.log("1. Fill in scores in the Score column above.");
  console.log("2. For any case scoring < 2: check which gradient/pressure level should handle it.");
  console.log("3. Update `src/prompt/_shared_runtime.md` (voice behavior) or `furina_resource/05_voice_style.md` (voice analysis).");
  console.log("4. Re-run `batch` after changes to verify no regression.");
  console.log("");
  console.log("Quick scoring:");
  console.log("- 0: generic assistant or generic tsundere");
  console.log("- 1: some Furina vocabulary but wrong rhythm");
  console.log("- 2: stage presence, defensiveness, composure");
  console.log("- 3: both outer shell AND true crack visible");
  console.log("");
  console.log(EVAL_NOTICE);
}

try {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0] || "list";
  const cases = readCases();

  if (command === "help" || args.help || args.h) {
    console.log(usage(cases.length));
  } else if (command === "list") {
    printList(cases);
  } else if (command === "json") {
    console.log(JSON.stringify({ cases }, null, 2));
  } else if (command === "prompt") {
    printPrompt(selectCases(cases, args));
  } else if (command === "batch") {
    printBatch(cases);
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  console.error(`furina-eval failed: ${error.message}`);
  process.exitCode = 1;
}
