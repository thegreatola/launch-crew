/**
 * research -> verify -> (write -> lint -> critique) x rounds -> human
 *
 * Nothing here posts anything. The crew's job ends at a run folder holding the
 * final draft with the status "awaiting-approval"; approve.ts is the human gate.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { CRITIC_SYSTEM, CRITIQUE_SCHEMA, asCritique, criticPrompt } from "./agents/critic.js";
import { RESEARCHER_SYSTEM, RESEARCHER_TOOLS, RESEARCH_SCHEMA, asResearch, researcherPrompt, verifyFacts } from "./agents/researcher.js";
import { DRAFT_SCHEMA, WRITER_SYSTEM, asDraft, writerPrompt } from "./agents/writer.js";
import type { AgentRunner, AgentSpec } from "./claude.js";
import { lint } from "./lint.js";
import { renderReport } from "./report.js";
import type { Source } from "./source.js";
import type { Issue, Round, Run } from "./types.js";

export interface CrewOptions {
  model: string;
  /** How many drafts the writer gets before the run goes to the human anyway. */
  maxRounds: number;
  runsDir: string;
  /** Fewer verified facts than this and the run stops: there isn't enough to write from. */
  minFacts?: number;
  log?: (line: string) => void;
}

export async function runCrew(source: Source, runner: AgentRunner, opts: CrewOptions): Promise<{ run: Run; dir: string }> {
  const log = opts.log ?? (() => {});
  const id = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19) + "-" + source.name;
  const dir = path.join(opts.runsDir, id);
  await mkdir(path.join(dir, "logs"), { recursive: true });
  const run: Run = {
    id,
    source: { name: source.name, repoUrl: source.repoUrl, commit: source.commit },
    model: opts.model,
    started: new Date().toISOString(),
    dropped: [],
    rounds: [],
    criticApproved: false,
    status: "failed",
    agents: [],
  };
  let step = 0;
  const call = async (spec: Omit<AgentSpec, "model" | "logPath">) => {
    step += 1;
    const logName = `${String(step).padStart(2, "0")}-${spec.name}.jsonl`;
    const res = await runner.run({ ...spec, model: opts.model, logPath: path.join(dir, "logs", logName) });
    run.agents.push({ agent: spec.name, durationMs: res.durationMs, costUsd: res.costUsd, inputTokens: res.inputTokens, outputTokens: res.outputTokens, log: `logs/${logName}` });
    if (res.error) throw new Error(`${spec.name}: ${res.error}`);
    return res;
  };
  const save = async () => {
    await writeFile(path.join(dir, "run.json"), JSON.stringify(run, null, 2));
    await writeFile(path.join(dir, "report.md"), renderReport(run));
  };

  try {
    log(`researcher: reading ${source.name} @ ${source.commit}`);
    const r = await call({ name: "researcher", prompt: researcherPrompt(source.name), systemPrompt: RESEARCHER_SYSTEM, schema: RESEARCH_SCHEMA, tools: RESEARCHER_TOOLS, cwd: source.dir, timeoutMs: 600_000 });
    const research = asResearch(r.output);
    const { kept, dropped } = await verifyFacts(research.facts, source.dir);
    run.research = { ...research, facts: kept };
    run.dropped = dropped;
    log(`researcher: ${research.facts.length} facts, ${kept.length} verified against the files, ${dropped.length} dropped (${r.toolCalls.length} tool calls)`);
    if (kept.length < (opts.minFacts ?? 4)) throw new Error(`only ${kept.length} facts survived verification, too few to write from`);

    let previous: { draft: Round["draft"]; issues: Issue[]; earlier: Issue[] } | undefined;
    const feedback: Issue[] = [];
    for (let n = 1; n <= opts.maxRounds; n++) {
      const w = await call({ name: `writer-${n}`, prompt: writerPrompt(run.research, kept, source.repoUrl, previous), systemPrompt: WRITER_SYSTEM, schema: DRAFT_SCHEMA, tools: [] });
      const draft = asDraft(w.output);
      const issues = lint(draft, kept, source.repoUrl);
      const round: Round = { n, draft, lint: issues, approved: false };
      run.rounds.push(round);
      if (issues.length) {
        log(`round ${n}: lint sent it back (${summarize(issues)})`);
        previous = { draft, issues, earlier: [...feedback] };
        feedback.push(...issues);
        await save();
        continue;
      }
      const c = await call({ name: `critic-${n}`, prompt: criticPrompt(draft, kept), systemPrompt: CRITIC_SYSTEM, schema: CRITIQUE_SCHEMA, tools: [] });
      round.critique = asCritique(c.output, draft);
      round.approved = round.critique.verdict === "approve";
      await save();
      if (round.approved) {
        log(`round ${n}: critic approved. ${round.critique.strengths}`);
        run.criticApproved = true;
        break;
      }
      log(`round ${n}: critic sent it back (${summarize(round.critique.issues)})`);
      previous = { draft, issues: round.critique.issues, earlier: [...feedback] };
      feedback.push(...round.critique.issues);
    }

    run.final = run.rounds.at(-1)?.draft;
    run.status = "awaiting-approval";
    if (!run.criticApproved) log(`no draft passed in ${opts.maxRounds} rounds; the last one goes to you, marked as not approved by the critic`);
  } catch (err) {
    run.error = (err as Error).message;
    run.status = "failed";
    log(`failed: ${run.error}`);
  }
  await save();
  return { run, dir };
}

function summarize(issues: Issue[]): string {
  const counts = new Map<string, number>();
  for (const i of issues) counts.set(i.rule, (counts.get(i.rule) ?? 0) + 1);
  return [...counts].map(([rule, n]) => (n > 1 ? `${rule} x${n}` : rule)).join(", ");
}
