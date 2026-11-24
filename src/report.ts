/** A readable record of a run: what the researcher found, what the critic rejected and why, and the final draft. */
import { xLength } from "./lint.js";
import type { Draft, Issue, Run } from "./types.js";

const STATUS: Record<Run["status"], string> = {
  "awaiting-approval": "Waiting for your approval. Nothing has been posted.",
  approved: "Approved by you. Nothing has been posted: copy it from approved.md.",
  rejected: "Rejected by you.",
  failed: "Failed.",
};

export function renderDraft(d: Draft): string {
  const block = (label: string, text: string, ids: string[]) => `**${label}** (${xLength(text)}/280, facts ${ids.join(", ") || "none"})\n\n${quote(text)}`;
  return [block("Post", d.post.text, d.post.factIds), ...d.thread.map((p, i) => block(`Thread ${i + 1}/${d.thread.length}`, p.text, p.factIds))].join("\n\n");
}

const quote = (s: string) => s.split("\n").map((l) => `> ${l}`).join("\n");

function issueLine(i: Issue): string {
  const flag = i.by === "critic" && i.anchored === false ? " (quote not found in the draft)" : "";
  return `- **${i.where}**, ${i.rule}${flag}: "${i.quote}". ${i.fix}`;
}

export function renderReport(run: Run): string {
  const out: string[] = [`# Launch crew: ${run.source.name}`, ""];
  out.push(`${STATUS[run.status]}${run.error ? ` ${run.error}` : ""}`, "");
  out.push(`Repo ${run.source.repoUrl ?? "(no public link)"} at ${run.source.commit}. Model ${run.model}. Started ${run.started}.`);
  const cost = run.agents.reduce((s, a) => s + a.costUsd, 0);
  const secs = run.agents.reduce((s, a) => s + a.durationMs, 0) / 1000;
  out.push(`${run.agents.length} agent runs, ${secs.toFixed(0)} s, $${cost.toFixed(3)} at API prices.`, "");

  if (run.final) {
    out.push(`## Final draft${run.criticApproved ? "" : " (not approved by the critic)"}`, "", renderDraft(run.final), "");
    if (run.humanNote) out.push(`Your note: ${run.humanNote}`, "");
  }

  if (run.rounds.length) {
    out.push("## Rounds", "");
    for (const r of run.rounds) {
      const verdict = r.lint.length ? `sent back by the lint (${r.lint.length} issues)` : r.critique?.verdict === "approve" ? "approved by the critic" : `sent back by the critic (${r.critique?.issues.length ?? 0} issues)`;
      out.push(`### Round ${r.n}: ${verdict}`, "");
      for (const i of r.lint) out.push(issueLine(i));
      for (const i of r.critique?.issues ?? []) out.push(issueLine(i));
      if (r.critique?.strengths) out.push("", `What works: ${r.critique.strengths}`);
      if (r.n < run.rounds.length || !r.approved) out.push("", "<details><summary>This draft</summary>", "", renderDraft(r.draft), "", "</details>");
      out.push("");
    }
  }

  if (run.research) {
    out.push("## Research", "", `${run.research.oneLiner}`, "", `For: ${run.research.audience}. Problem: ${run.research.problem}`, "");
    out.push(`${run.research.facts.length} facts verified against the files:`, "");
    for (const f of run.research.facts) out.push(`- **${f.id}** ${f.claim} (\`${f.path}\`: "${f.quote}")`);
    if (run.dropped.length) {
      out.push("", `${run.dropped.length} dropped because the quote didn't check out:`, "");
      for (const d of run.dropped) out.push(`- ${d.fact.claim} (${d.reason})`);
    }
    out.push("");
  }

  out.push("## Agent runs", "", "Each log is Claude Code stream-json, which agent-trace-viewer opens.", "");
  for (const a of run.agents) out.push(`- ${a.agent}: ${(a.durationMs / 1000).toFixed(1)} s, ${a.inputTokens} in / ${a.outputTokens} out, $${a.costUsd.toFixed(4)}, \`${a.log}\``);
  return out.join("\n") + "\n";
}
