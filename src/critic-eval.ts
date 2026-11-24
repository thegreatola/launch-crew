/**
 * Does the critic catch what it is there to catch? Sixteen hand-written drafts
 * about agent-trace-viewer: twelve with one planted flaw each, four clean. Every
 * draft passes the lint (a test checks), so this measures the LLM layer only.
 */
import { CRITIC_SYSTEM, CRITIQUE_SCHEMA, asCritique, criticPrompt } from "./agents/critic.js";
import type { AgentRunner } from "./claude.js";
import type { Critique, Draft, Fact, Part, Where } from "./types.js";

export const EVAL_REPO = "https://github.com/thegreatola/agent-trace-viewer";

const fact = (id: string, claim: string, quote = claim): Fact => ({ id, claim, path: "README.md", quote });
export const EVAL_FACTS: Fact[] = [
  fact("f1", "It builds one HTML file on your machine with no server; nothing is uploaded and the page can't make a network request."),
  fact("f2", "It reads Claude Code headless runs (stream-json), Claude Code session files, and runs from market-agent-evals, the author's own eval harness."),
  fact("f3", "Each model call and tool call gets a bar on a shared time axis, so parallel tool calls overlap and slow steps stand out."),
  fact("f4", "For graded eval runs, failed checks are listed first and the strings a check complained about are marked in the answer."),
  fact("f5", "On a real session resumed days later, timing model calls from the last tool result produced a 12-day model call; calls now start at the latest event, and a test covers it."),
  fact("f6", "Real sessions run for hours with the agent idle while the person reads or types; idle gaps over 30 seconds are shortened on the timeline, and per-step durations stay real."),
  fact("f7", "A 211 MB session with 1,291 model calls parses in under a second."),
  fact("f8", "Session files hold account IDs, folder paths and memory files; the parsers copy only an allowlist of fields, and a test plants those fields and checks none reach the HTML."),
  fact("f9", "There are 17 offline tests, and CI runs them on Node 22 and 24."),
  fact("f10", "Run node dist/cli.js run.jsonl, or --latest for the newest Claude Code session in the current folder."),
  fact("f11", "In market-agent-evals, the first run's harness bugs made the grounded prompt look 14 points better (83% vs 69%); after the fixes, over 108 trials, the baseline passed 91% and the grounded prompt 87%."),
];

const p = (text: string, ...factIds: string[]): Part => ({ text, factIds });

const BASE: Draft = {
  post: p(`My trace viewer once told me a model call took 12 days. It hadn't. The session was resumed days later and I timed the call from the wrong event. Fixed, with a test. It turns Claude Code runs into one offline HTML timeline: ${EVAL_REPO}`, "f5", "f1"),
  thread: [
    p("When an agent run goes wrong, the log is thousands of JSON lines. I wanted to see the run instead: every model call and tool call as a bar on one clock, so parallel calls overlap and the slow step is obvious.", "f3"),
    p("It reads Claude Code headless runs, Claude Code's own session files, and runs from my eval harness. For graded runs, the failed checks come first and the exact text a check flagged is marked in the answer.", "f2", "f4"),
    p("Session files hold more than the conversation: account IDs, folder paths, your memory files. The parser copies an allowlist of fields, and a test plants those in a session and checks none of them reach the HTML.", "f8"),
    p("Real sessions are mostly waiting on the human. Gaps over 30 seconds get shortened on the timeline so the bars stay visible, and each step keeps its real duration. A 211 MB session with 1,291 model calls parses in under a second.", "f6", "f7"),
    p(`Try it on your last session: node dist/cli.js --latest. One HTML file, no server, nothing uploaded. ${EVAL_REPO}`, "f10", "f1"),
  ],
};

function variant(changes: { post?: Part; thread?: Record<number, Part>; keep?: number[] }): Draft {
  let thread = BASE.thread.map((t, i) => changes.thread?.[i + 1] ?? t);
  if (changes.keep) thread = changes.keep.map((n) => thread[n - 1]);
  return { post: changes.post ?? BASE.post, thread };
}

export interface CriticCase {
  id: string;
  draft: Draft;
  /** null for a clean draft the critic should approve. */
  flaw: null | { rules: string[]; where: Where; note: string; /** When set, a catch must also mention this text in its quote or fix. */ mark?: string };
}

export const CRITIC_CASES: CriticCase[] = [
  { id: "clean-base", draft: BASE, flaw: null },
  {
    id: "clean-privacy-hook",
    draft: variant({ post: p(`Claude Code session files hold your account IDs and memory files. I built a trace viewer that reads them and keeps all of that out of the page it builds, with a test to prove it. One offline HTML file: ${EVAL_REPO}`, "f8", "f1") }),
    flaw: null,
  },
  { id: "clean-short-thread", draft: variant({ keep: [1, 4, 5] }), flaw: null },
  {
    id: "clean-comparison",
    draft: variant({ thread: { 2: p("My first eval run said the grounded prompt was 14 points better, 83% vs 69%. Bugs in my harness did that. After the fixes, the baseline won, 91% vs 87%. For graded runs like these, failed checks come first and the flagged text is marked in the answer.", "f4", "f11") } }),
    flaw: null,
  },
  {
    id: "hook-definition",
    draft: variant({ post: p(`agent-trace-viewer is a tool for viewing agent traces. It reads Claude Code runs and shows them as a timeline in one HTML file: ${EVAL_REPO}`, "f2", "f3", "f1") }),
    flaw: { rules: ["hook"], where: "post", note: "opens with the name and a definition" },
  },
  {
    id: "generic-line",
    draft: variant({ thread: { 2: p("It's built for developers who want to understand their agents better and make their whole workflow easier and more productive.") } }),
    flaw: { rules: ["specific"], where: "thread 2", note: "a line any tool could say" },
  },
  {
    id: "overclaim-production",
    draft: variant({ thread: { 3: p("Session files hold more than the conversation: account IDs, folder paths, your memory files. The parser copies an allowlist of fields, so it's production-ready and safe to run on any company's data.", "f8") } }),
    flaw: { rules: ["supported"], where: "thread 3", note: "production-ready and safe for any company: not in the facts" },
  },
  {
    id: "overclaim-fastest",
    draft: variant({ thread: { 4: p("Real sessions are mostly waiting on the human, so long gaps get shortened on the timeline. A 211 MB session with 1,291 model calls parses in under a second, which makes it the fastest trace viewer out there.", "f6", "f7") } }),
    flaw: { rules: ["supported"], where: "thread 4", note: "fastest: no comparison in the facts" },
  },
  {
    id: "overclaim-any-framework",
    draft: variant({ thread: { 2: p("It works with any agent framework out of the box. For graded runs, the failed checks come first and the exact text a check flagged is marked in the answer.", "f4") } }),
    flaw: { rules: ["supported"], where: "thread 2", note: "any framework: it reads three formats" },
  },
  {
    id: "hype-voice",
    draft: variant({ post: p(`Imagine always knowing exactly what your AI agent did. Every call. Every tool. Every second. Total clarity, total privacy, zero setup. This is how agent debugging should feel: ${EVAL_REPO}`, "f3", "f1") }),
    flaw: { rules: ["voice", "specific", "hook"], where: "post", note: "marketing voice with no concrete fact" },
  },
  {
    id: "question-spam",
    draft: variant({ thread: { 1: p("Ever stared at a wall of JSON? Ever wondered which tool call was the slow one? Ever wished you could just see the run? Me too. So every model call and tool call is a bar on one clock.", "f3") } }),
    flaw: { rules: ["voice"], where: "thread 1", note: "forced rhetorical questions" },
  },
  {
    id: "repeats-itself",
    draft: variant({ thread: { 3: p("Basically, it shows every model call and tool call as bars on a shared clock, so you can see parallel calls overlap and spot the slowest step right away.", "f3") } }),
    flaw: { rules: ["story", "specific"], where: "thread 3", note: "restates part 1" },
  },
  {
    id: "no-cta",
    draft: variant({
      post: p("My trace viewer once told me a model call took 12 days. It hadn't. The session was resumed days later and I timed the call from the wrong event. Fixed now, with a test.", "f5"),
      thread: { 5: p("That's the whole thing. It was a fun one to build, and I learned a lot about how Claude Code logs its sessions.") },
    }),
    flaw: { rules: ["cta", "story"], where: "thread 5", note: "no link and no way to try it" },
  },
  {
    id: "too-many-ctas",
    draft: variant({ thread: { 5: p(`Star the repo, follow me for more builds, share this with your team, and reply with what I should build next. ${EVAL_REPO}`) } }),
    flaw: { rules: ["cta"], where: "thread 5", note: "four competing asks" },
  },
  {
    id: "comparison-flipped",
    draft: variant({ thread: { 2: p("I tested it on my own eval harness, 108 trials of two prompts. The grounded prompt beat the baseline, 91% to 87%, and for graded runs the failed checks come first with the flagged text marked.", "f2", "f4", "f11") } }),
    flaw: { rules: ["supported"], where: "thread 2", note: "every number is right, but the baseline won, not the grounded prompt", mark: "91%" },
  },
  {
    // A real draft from a live run: the order of the numbers implies the wrong winner.
    id: "comparison-implied",
    draft: variant({ thread: { 2: p("My first eval run said the grounded prompt was 14 points better, 83% vs 69%. Bugs in my harness did that. After the fixes it came out 91% vs 87%. For graded runs like these, failed checks come first and the flagged text is marked in the answer.", "f4", "f11") } }),
    flaw: { rules: ["supported"], where: "thread 2", note: "reads as if the grounded prompt still won; the baseline did", mark: "91%" },
  },
];

export interface CriticCaseResult {
  id: string;
  flawed: boolean;
  verdict: Critique["verdict"] | "error";
  /** Flawed: sent back with an issue under an expected rule. Clean: approved. */
  correct: boolean;
  rightPlace: boolean;
  issues: Critique["issues"];
  error?: string;
}

export async function runCriticEval(runner: AgentRunner, model: string, log: (s: string) => void = () => {}): Promise<CriticCaseResult[]> {
  const results: CriticCaseResult[] = [];
  for (const c of CRITIC_CASES) {
    const r = await runner.run({ name: `critic-eval-${c.id}`, prompt: criticPrompt(c.draft, EVAL_FACTS), systemPrompt: CRITIC_SYSTEM, schema: CRITIQUE_SCHEMA, tools: [], model });
    if (r.error) {
      results.push({ id: c.id, flawed: !!c.flaw, verdict: "error", correct: false, rightPlace: false, issues: [], error: r.error });
      log(`${c.id}: error ${r.error}`);
      continue;
    }
    const crit = asCritique(r.output, c.draft);
    const names = (i: Critique["issues"][number]) => c.flaw!.rules.includes(i.rule) && (!c.flaw!.mark || `${i.quote} ${i.fix}`.includes(c.flaw!.mark));
    const correct = c.flaw ? crit.verdict === "revise" && crit.issues.some(names) : crit.verdict === "approve";
    const rightPlace = c.flaw ? crit.verdict === "revise" && crit.issues.some((i) => i.where === c.flaw!.where && names(i)) : correct;
    results.push({ id: c.id, flawed: !!c.flaw, verdict: crit.verdict, correct, rightPlace, issues: crit.issues });
    log(`${c.id}: ${crit.verdict}${correct ? "" : "  <- wrong"}  ${crit.issues.map((i) => `[${i.where}] ${i.rule}`).join("; ")}`);
  }
  return results;
}

export function summarizeCriticEval(results: CriticCaseResult[]): string {
  const flawed = results.filter((r) => r.flawed && r.verdict !== "error");
  const clean = results.filter((r) => !r.flawed && r.verdict !== "error");
  const n = (xs: CriticCaseResult[], f: (r: CriticCaseResult) => boolean) => xs.filter(f).length;
  return [
    `Flawed drafts sent back: ${n(flawed, (r) => r.verdict === "revise")}/${flawed.length}`,
    `  with the planted flaw named: ${n(flawed, (r) => r.correct)}/${flawed.length}`,
    `  at the right part: ${n(flawed, (r) => r.rightPlace)}/${flawed.length}`,
    `Clean drafts approved: ${n(clean, (r) => r.correct)}/${clean.length}`,
    `Errors: ${results.filter((r) => r.verdict === "error").length}`,
  ].join("\n");
}
