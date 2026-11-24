import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { approvedText, parseEdited } from "../src/approve.js";
import { asCritique } from "../src/agents/critic.js";
import { verifyFacts, withIds } from "../src/agents/researcher.js";
import { ClaudeCodeRunner, type AgentResult, type AgentRunner, type AgentSpec } from "../src/claude.js";
import { runCrew } from "../src/crew.js";
import { prepareSource, publicRepoUrl, type Source } from "../src/source.js";

const tmp = () => mkdtempSync(path.join(os.tmpdir(), "launch-crew-test-"));
const FAKE = path.resolve("test/fixtures/fake-claude.mjs");

function repoDir(): string {
  const dir = tmp();
  writeFileSync(path.join(dir, "README.md"), "# thing\n\nIt has 17 tests, all offline.\nIt parses a 211 MB file in under a second.\nOne HTML file, no server.\nIt reads three formats.\n");
  return dir;
}

test("verifyFacts keeps only quotes that are really in the file", async () => {
  const dir = repoDir();
  const facts = withIds([
    { claim: "17 offline tests", path: "README.md", quote: "It has 17 tests, all offline." },
    { claim: "whitespace and curly quotes forgiven", path: "/README.md", quote: "One HTML   file,\nno server." },
    { claim: "paraphrased", path: "README.md", quote: "It has seventeen offline tests" },
    { claim: "wrong file", path: "docs/nope.md", quote: "It has 17 tests, all offline." },
    { claim: "escapes the repo", path: "../../etc/hosts", quote: "localhost is here" },
    { claim: "too short", path: "README.md", quote: "17" },
  ]);
  const { kept, dropped } = await verifyFacts(facts, dir);
  assert.deepEqual(kept.map((f) => f.id), ["f1", "f2"]);
  assert.deepEqual(dropped.map((d) => d.reason), ["quote not found in README.md", "no such file: docs/nope.md", "path is outside the repo", "quote too short to check"]);
});

/** A scripted crew: the researcher, then one output per writer and critic call, in order. */
class Script implements AgentRunner {
  calls: AgentSpec[] = [];
  constructor(private outputs: Record<string, unknown[]>) {}
  async run(spec: AgentSpec): Promise<AgentResult> {
    this.calls.push(spec);
    if (spec.logPath) writeFileSync(spec.logPath, "{}\n");
    const role = spec.name.replace(/-\d+$/, "");
    const output = this.outputs[role]!.shift();
    if (output instanceof Error) return { output: undefined, durationMs: 1, costUsd: 0, inputTokens: 0, outputTokens: 0, toolCalls: [], error: output.message };
    return { output, durationMs: 1000, costUsd: 0.01, inputTokens: 100, outputTokens: 50, toolCalls: [] };
  }
}

const REPO = "https://github.com/someone/thing";
const research = {
  name: "thing",
  oneLiner: "A thing.",
  audience: "devs",
  problem: "logs are hard",
  angles: ["speed"],
  facts: [
    { claim: "17 offline tests", path: "README.md", quote: "It has 17 tests, all offline." },
    { claim: "211 MB in under a second", path: "README.md", quote: "It parses a 211 MB file in under a second." },
    { claim: "One HTML file", path: "README.md", quote: "One HTML file, no server." },
    { claim: "Three formats", path: "README.md", quote: "It reads three formats." },
    { claim: "Made up", path: "README.md", quote: "It has 900 users." },
  ],
};
const draft = (post: string) => ({
  post: { text: post, factIds: ["f2"] },
  thread: [
    { text: "Logs are hard to read.", factIds: [] },
    { text: "It reads three formats into one HTML file.", factIds: ["f3", "f4"] },
    { text: `Try it: ${REPO}`, factIds: [] },
  ],
});

function source(dir: string): Source {
  return { dir, name: "thing", repoUrl: REPO, commit: "abc1234", cleanup: async () => {} };
}

test("the crew: lint sends back round 1, the critic round 2, and approves round 3", async () => {
  const runner = new Script({
    researcher: [research],
    writer: [draft("Parses 300 MB in under a second — fast."), draft("It parses 211 MB in under a second."), draft(`It parses 211 MB in under a second. ${REPO}`)],
    critic: [
      { verdict: "revise", issues: [{ where: "post", rule: "cta", quote: "It parses 211 MB", fix: "Add the link." }, { where: "thread 9", rule: "voice", quote: "not in the draft", fix: "x" }], strengths: "" },
      { verdict: "approve", issues: [], strengths: "Concrete." },
    ],
  });
  const runsDir = tmp();
  const { run, dir } = await runCrew(source(repoDir()), runner, { model: "m", maxRounds: 3, runsDir });

  assert.equal(run.status, "awaiting-approval");
  assert.equal(run.criticApproved, true);
  assert.equal(run.research!.facts.length, 4);
  assert.equal(run.dropped[0]!.fact.claim, "Made up");
  assert.deepEqual(run.rounds.map((r) => [r.lint.map((i) => i.rule), r.critique?.verdict ?? null]), [[["dash", "ungrounded-number"], null], [[], "revise"], [[], "approve"]]);
  assert.deepEqual(run.rounds[1]!.critique!.issues.map((i) => [i.where, i.anchored]), [["post", true], ["thread 3", false]]);
  assert.deepEqual(runner.calls.map((c) => c.name), ["researcher", "writer-1", "writer-2", "critic-2", "writer-3", "critic-3"]);
  // Only the researcher gets tools, and they're read-only, in the cloned repo.
  assert.deepEqual(runner.calls[0]!.tools, ["Read", "Glob", "Grep"]);
  assert.ok(runner.calls.slice(1).every((c) => c.tools.length === 0 && !c.cwd));
  // The writer sees the feedback, including the lint's, and never the dropped fact.
  assert.match(runner.calls[2]!.prompt, /ungrounded-number: "300"/);
  assert.match(runner.calls[4]!.prompt, /Add the link/);
  // Round 3's writer still sees round 1's feedback, so it can't bring back what it already removed.
  assert.match(runner.calls[4]!.prompt, /<earlier_feedback>[\s\S]*ungrounded-number: "300"/);
  assert.ok(!runner.calls[2]!.prompt.includes("<earlier_feedback>"));
  // The critic judges against the same evidence the writer used: claims and their quotes.
  assert.match(runner.calls[3]!.prompt, /"quote": "It parses a 211 MB file in under a second\."/);
  assert.ok(!runner.calls.some((c) => c.prompt.includes("900 users")));
  const report = readFileSync(path.join(dir, "report.md"), "utf8");
  assert.match(report, /Waiting for your approval\. Nothing has been posted\./);
  assert.match(report, /quote not found in the draft/);
  assert.ok(existsSync(path.join(dir, "logs", "01-researcher.jsonl")));
});

test("out of rounds: the last draft still goes to the human, marked as not approved", async () => {
  const runner = new Script({ researcher: [research], writer: [draft("It parses 211 MB in under a second."), draft("It parses 211 MB in under a second.")], critic: [{ verdict: "revise", issues: [{ where: "post", rule: "hook", quote: "It parses", fix: "x" }], strengths: "" }, { verdict: "revise", issues: [], strengths: "" }] });
  const { run, dir } = await runCrew(source(repoDir()), runner, { model: "m", maxRounds: 2, runsDir: tmp() });
  assert.equal(run.status, "awaiting-approval");
  assert.equal(run.criticApproved, false);
  assert.match(readFileSync(path.join(dir, "report.md"), "utf8"), /not approved by the critic/);
});

test("too few verified facts, or an agent error, fails the run", async () => {
  const thin = { ...research, facts: research.facts.slice(3) };
  const a = await runCrew(source(repoDir()), new Script({ researcher: [thin] }), { model: "m", maxRounds: 1, runsDir: tmp() });
  assert.equal(a.run.status, "failed");
  assert.match(a.run.error!, /only 1 facts survived/);
  const b = await runCrew(source(repoDir()), new Script({ researcher: [research], writer: [new Error("timed out")] }), { model: "m", maxRounds: 1, runsDir: tmp() });
  assert.equal(b.run.status, "failed");
  assert.equal(b.run.error, "writer-1: timed out");
});

test("the Claude Code runner: flags, structured output, and the isolation check", async () => {
  const argsFile = path.join(tmp(), "args.json");
  process.env.LAUNCH_CREW_CLAUDE_BIN = FAKE;
  process.env.FAKE_CLAUDE_ARGS = argsFile;
  process.env.FAKE_CLAUDE_OUTPUT = JSON.stringify({ hello: "world" });
  try {
    const cwd = repoDir();
    const logPath = path.join(tmp(), "log.jsonl");
    const r = await new ClaudeCodeRunner().run({ name: "researcher", prompt: "go", systemPrompt: "sys", model: "sonnet", schema: { type: "object" }, tools: ["Read", "Glob", "Grep"], cwd, logPath });
    assert.equal(r.error, undefined);
    assert.deepEqual(r.output, { hello: "world" });
    assert.deepEqual(r.toolCalls.map((c) => c.name), ["Read"]);
    assert.equal(r.inputTokens, 15);
    assert.ok(readFileSync(logPath, "utf8").includes('"structured_output"'));
    const { args, cwd: ran } = JSON.parse(readFileSync(argsFile, "utf8"));
    assert.equal(realpathSync(ran), realpathSync(cwd));
    for (const flag of ["--restricted", "--strict-mcp-config", "--disable-slash-commands", "--no-session-persistence"]) assert.ok(args.includes(flag), flag);
    assert.equal(args[args.indexOf("--tools") + 1], "Read,Glob,Grep");
    assert.equal(args[args.indexOf("--setting-sources") + 1], "");
    assert.equal(args[args.indexOf("--json-schema") + 1], '{"type":"object"}');

    process.env.FAKE_CLAUDE_TOOLS = "StructuredOutput,Bash";
    const stray = await new ClaudeCodeRunner().run({ name: "writer-1", prompt: "go", systemPrompt: "sys", model: "sonnet", schema: {}, tools: [] });
    assert.match(stray.error!, /isolation: writer-1 was given tools it should not have: Bash/);
  } finally {
    for (const k of ["LAUNCH_CREW_CLAUDE_BIN", "FAKE_CLAUDE_ARGS", "FAKE_CLAUDE_OUTPUT", "FAKE_CLAUDE_TOOLS"]) delete process.env[k];
  }
});

test("publicRepoUrl keeps owner and name and drops credentials", () => {
  assert.equal(publicRepoUrl("https://user:secret-token@github.com/a/b.git"), "https://github.com/a/b");
  assert.equal(publicRepoUrl("git@github.com:a/b.git"), "https://github.com/a/b");
  assert.equal(publicRepoUrl("https://gitlab.com/a/b"), null);
  assert.equal(publicRepoUrl(""), null);
});

test("prepareSource clones committed files only", async () => {
  const dir = tmp();
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, ...a], { stdio: "pipe" });
  g("init", "-q");
  writeFileSync(path.join(dir, "README.md"), "# committed\n");
  g("add", "README.md");
  g("-c", "user.email=t@example.com", "-c", "user.name=t", "commit", "-qm", "init");
  writeFileSync(path.join(dir, ".env"), "TOKEN=not-for-the-crew\n");
  writeFileSync(path.join(dir, "notes.txt"), "untracked\n");
  g("remote", "add", "origin", "https://user:secret-token@github.com/someone/thing.git");
  const src = await prepareSource(dir);
  try {
    assert.equal(src.repoUrl, "https://github.com/someone/thing");
    assert.equal(src.name, "thing");
    assert.ok(existsSync(path.join(src.dir, "README.md")));
    for (const f of [".env", "notes.txt", ".git"]) assert.ok(!existsSync(path.join(src.dir, f)), f);
  } finally {
    await src.cleanup();
  }
  assert.ok(!existsSync(src.dir));
});

test("an edited draft keeps each part's fact ids, and the approved text is ready to paste", () => {
  const before = draft("Post text.");
  const after = parseEdited("New post.\n---\nOne.\n---\nTwo.\n---\nThree.\n---\nFour, added.\n", before);
  assert.equal(after.post.text, "New post.");
  assert.deepEqual(after.thread.map((p) => p.factIds), [[], ["f3", "f4"], [], []]);
  assert.match(approvedText(after), /^POST\n\nNew post\.\n\nTHREAD\n\n--- 1\/4\nOne\./);
});

test("critic issues are pinned to the draft", () => {
  const d = draft("It parses 211 MB.");
  const c = asCritique({ verdict: "revise", issues: [{ where: "Thread 2", rule: "voice", quote: "it reads THREE formats", fix: "x" }, { where: "post", rule: "hook", quote: "", fix: "x" }], strengths: "" }, d);
  assert.deepEqual(c.issues.map((i) => [i.where, i.anchored]), [["thread 2", true], ["post", false]]);
  assert.throws(() => asCritique({ verdict: "maybe" }, d), /no verdict/);
});
