#!/usr/bin/env node
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { parseArgs, ROOT } from "./lib/utils.mjs";

const execFileAsync = promisify(execFile);
const WIKI_SCRIPT = path.join(ROOT, "scripts", "furina-wiki.mjs");
const INDEX_SCRIPT = path.join(ROOT, "scripts", "furina-wiki-index.mjs");
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_CONCURRENCY = 5;

function help() {
  return `Furina local wiki explorer

Usage:
  node scripts/furina-explore.mjs --task "芙宁娜传说任务线索" --task "那维莱特关系" [--json]
  node scripts/furina-explore.mjs "芙宁娜 传说任务" "芙宁娜 那维莱特" --top 3 --reads 2

Options:
  --task <text>         Add one exploration task. Positional args are also tasks.
  --top <n>             Search results per task, defaults to 3.
  --reads <n>           Documents to read per task, defaults to 2.
  --line-window <n>     Lines around each search hit to read, defaults to 12.
  --timeout-ms <n>      Whole task timeout, defaults to 600000 (10 minutes).
  --concurrency <n>     Parallel task count, max 5.
  --no-build-index      Do not build the local search index before exploring.
  --json                Emit machine-readable JSON.
`;
}

async function runNode(script, args, timeoutMs) {
  const result = await execFileAsync(process.execPath, [script, ...args], {
    cwd: ROOT,
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true
  });
  return result.stdout;
}

async function ensureIndex(args) {
  if (args["no-build-index"]) return { skipped: true };
  const scope = sourceArgs(args);
  try {
    const status = JSON.parse(await runNode(INDEX_SCRIPT, ["status", ...scope], 60_000));
    if (status.ready && !status.fresh) {
      const built = JSON.parse(await runNode(INDEX_SCRIPT, ["build", ...scope], 10 * 60_000));
      return { skipped: false, built: true, ...built };
    }
    return { skipped: false, built: false, ...status };
  } catch (error) {
    return { skipped: false, built: false, error: error.message };
  }
}

function sourceArgs(args) {
  const result = [];
  if (args.source) result.push("--source", String(args.source));
  if (args.root) result.push("--root", String(args.root));
  return result;
}

function lineRangeForResult(result, windowSize) {
  const firstLine = Number(result?.snippets?.[0]?.line || 1);
  const start = Math.max(1, firstLine - Math.floor(windowSize / 2));
  const end = start + Math.max(1, windowSize) - 1;
  return `${start}-${end}`;
}

function compactText(text, maxChars = 500) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > maxChars ? `${clean.slice(0, maxChars)}...` : clean;
}

async function scoutTask(task, args) {
  const started = Date.now();
  const timeoutMs = Math.max(10_000, Number(args["timeout-ms"] || DEFAULT_TIMEOUT_MS));
  const top = Math.max(1, Math.min(10, Number(args.top || 3)));
  const reads = Math.max(1, Math.min(5, Number(args.reads || 2)));
  const lineWindow = Math.max(4, Math.min(120, Number(args["line-window"] || 12)));
  const scope = sourceArgs(args);

  const deadline = started + timeoutMs;
  const remaining = () => Math.max(10_000, deadline - Date.now());
  const report = {
    task,
    status: "running",
    query: task,
    searchResults: [],
    evidence: [],
    references: [],
    summary: "",
    confidence: 0,
    elapsedMs: 0
  };

  try {
    const searchStdout = await runNode(WIKI_SCRIPT, [
      "search",
      task,
      ...scope,
      "--top",
      String(top),
      "--json",
      "--build-index"
    ], remaining());
    const searchPayload = JSON.parse(searchStdout);
    report.searchResults = Array.isArray(searchPayload.results) ? searchPayload.results : [];

    for (const result of report.searchResults.slice(0, reads)) {
      const lineRange = lineRangeForResult(result, lineWindow);
      const readTarget = `${result.source}:${result.path}`;
      try {
        const readStdout = await runNode(WIKI_SCRIPT, [
          "read",
          readTarget,
          ...scope,
          "--line-range",
          lineRange,
          "--max-chars",
          "1600",
          "--json"
        ], remaining());
        const readPayload = JSON.parse(readStdout);
        report.evidence.push({
          source: `${readPayload.source}:${readPayload.path}:${lineRange}`,
          title: result.title,
          score: result.score,
          excerpt: compactText(readPayload.content)
        });
        report.references.push(`${readPayload.source}:${readPayload.path}:${lineRange}`);
      } catch (error) {
        report.evidence.push({
          source: readTarget,
          title: result.title,
          score: result.score,
          error: error.message
        });
      }
    }

    report.status = report.evidence.some((item) => item.excerpt) ? "success" : "partial";
    report.confidence = report.status === "success" ? Math.min(0.9, 0.45 + report.evidence.length * 0.18) : 0.35;
    report.summary = report.evidence.length
      ? `Found ${report.evidence.length} evidence item(s) for: ${task}`
      : `No direct evidence found for: ${task}`;
  } catch (error) {
    report.status = error?.killed || /timed out/i.test(String(error?.message || "")) ? "timeout" : "failed";
    report.summary = `Task failed: ${error.message}`;
    report.confidence = 0.1;
    report.error = error.message;
  } finally {
    report.elapsedMs = Date.now() - started;
  }

  return report;
}

async function runInParallel(tasks, args) {
  const requestedConcurrency = Math.max(1, Number(args.concurrency || MAX_CONCURRENCY));
  const concurrency = Math.min(MAX_CONCURRENCY, tasks.length, requestedConcurrency);
  const results = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= tasks.length) return;
      results[index] = await scoutTask(tasks[index], args);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

function printReport(payload, json) {
  if (json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  console.log(`Furina explore completed: ${payload.completed}/${payload.taskCount}`);
  for (const [index, report] of payload.reports.entries()) {
    const failed = report.status === "failed" || report.status === "timeout";
    const log = failed ? console.error.bind(console) : console.log.bind(console);
    log("");
    log(`${index + 1}. [${report.status.toUpperCase()}] ${report.task}`);
    log(`   confidence: ${report.confidence}, elapsedMs: ${report.elapsedMs}`);
    log(`   summary: ${report.summary}`);
    for (const item of report.evidence.slice(0, 3)) {
      log(`   - ${item.source}`);
      if (item.excerpt) log(`     ${item.excerpt}`);
      if (item.error) log(`     error: ${item.error}`);
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2), ["task"]);
  if (args.help || args.h) {
    console.log(help());
    return;
  }
  const tasks = (args.task || []).concat(args._).map((item) => String(item || "").trim()).filter(Boolean);
  if (tasks.length === 0) {
    console.log(help());
    throw new Error("Missing exploration tasks.");
  }
  if (tasks.length > MAX_CONCURRENCY) {
    throw new Error(`Explore accepts at most ${MAX_CONCURRENCY} tasks per run.`);
  }

  const started = Date.now();
  const index = await ensureIndex(args);
  const reports = await runInParallel(tasks, args);
  const completed = reports.filter((item) => item.status === "success" || item.status === "partial").length;
  printReport({
    tool: "furina-explore",
    taskCount: tasks.length,
    completed,
    maxConcurrency: MAX_CONCURRENCY,
    timeoutMs: Math.max(10_000, Number(args["timeout-ms"] || DEFAULT_TIMEOUT_MS)),
    elapsedMs: Date.now() - started,
    index,
    reports
  }, Boolean(args.json));
}

main().catch((error) => {
  console.error(`furina-explore failed: ${error.message}`);
  process.exit(1);
});
