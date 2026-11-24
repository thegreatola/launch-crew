#!/usr/bin/env node
/**
 * launch-crew run <repo folder | github url>   research, write, critique; stops at your approval
 * launch-crew approve <run folder>             approve, edit or reject the final draft
 * launch-crew show <run folder>                print the run's report
 * launch-crew critic-eval                      measure the critic on drafts with planted flaws
 */
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { approve } from "./approve.js";
import { ClaudeCodeRunner } from "./claude.js";
import { runCriticEval, summarizeCriticEval } from "./critic-eval.js";
import { runCrew } from "./crew.js";
import { prepareSource } from "./source.js";

const HELP = `Usage:
  launch-crew run <repo folder | https://github.com/owner/repo> [--model sonnet] [--rounds 3] [--runs runs]
  launch-crew approve [run folder]     approve, edit or reject (default: the latest run)
  launch-crew show [run folder]        print the report (default: the latest run)
  launch-crew critic-eval [--model sonnet] [--out file.json]

The crew never posts anything. A run ends waiting for you; approving writes approved.md to copy and post yourself.
Agents run through Claude Code (claude -p) with your existing login.`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    model: { type: "string", default: "sonnet" },
    rounds: { type: "string", default: "3" },
    runs: { type: "string", default: "runs" },
    out: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

function latestRun(runsDir: string): string {
  const dirs = readdirSync(runsDir)
    .map((d) => path.join(runsDir, d))
    .filter((d) => statSync(d).isDirectory() && existsSync(path.join(d, "run.json")))
    .sort();
  if (!dirs.length) throw new Error(`no runs in ${runsDir}`);
  return dirs.at(-1)!;
}

async function main() {
  const [cmd, arg] = positionals;
  if (values.help || !cmd) return console.log(HELP);
  const runsDir = path.resolve(values.runs!);

  if (cmd === "run") {
    if (!arg) throw new Error("run needs a repo folder or a GitHub URL");
    const rounds = Number(values.rounds);
    if (!Number.isInteger(rounds) || rounds < 1 || rounds > 6) throw new Error("--rounds must be 1 to 6");
    const source = await prepareSource(arg);
    try {
      const { run, dir } = await runCrew(source, new ClaudeCodeRunner(), { model: values.model!, maxRounds: rounds, runsDir, log: (l) => console.error(l) });
      console.log(`\n${path.relative(process.cwd(), dir)}/report.md`);
      if (run.status === "failed") process.exitCode = 1;
      else console.log(`Next: launch-crew approve ${path.relative(process.cwd(), dir)}`);
    } finally {
      await source.cleanup();
    }
    return;
  }

  if (cmd === "approve") {
    const dir = arg ? path.resolve(arg) : latestRun(runsDir);
    const run = await approve(dir);
    console.log(run.status === "approved" ? `Approved. Copy it from ${path.relative(process.cwd(), dir)}/approved.md` : `Status: ${run.status}`);
    return;
  }

  if (cmd === "show") {
    const dir = arg ? path.resolve(arg) : latestRun(runsDir);
    return console.log(readFileSync(path.join(dir, "report.md"), "utf8"));
  }

  if (cmd === "critic-eval") {
    const results = await runCriticEval(new ClaudeCodeRunner(), values.model!, (l) => console.error(l));
    console.log(`\n${summarizeCriticEval(results)}`);
    if (values.out) writeFileSync(values.out, JSON.stringify({ model: values.model, at: new Date().toISOString(), results }, null, 2));
    return;
  }

  throw new Error(`unknown command: ${cmd}\n\n${HELP}`);
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exitCode = 1;
});
