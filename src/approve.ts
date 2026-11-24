/**
 * The human gate. A run only becomes "approved" here, by a person at a
 * terminal. Approving writes approved.md for you to copy and post yourself; the
 * crew has no way to post anything.
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { lint } from "./lint.js";
import { renderDraft, renderReport } from "./report.js";
import type { Draft, Run } from "./types.js";

export function loadRun(dir: string): Run {
  return JSON.parse(readFileSync(path.join(dir, "run.json"), "utf8"));
}

export function saveRun(dir: string, run: Run): void {
  writeFileSync(path.join(dir, "run.json"), JSON.stringify(run, null, 2));
  writeFileSync(path.join(dir, "report.md"), renderReport(run));
}

/** The text you'd paste into X: the post, then the thread parts, one per block. */
export function approvedText(d: Draft): string {
  return ["POST", "", d.post.text, "", "THREAD", "", ...d.thread.flatMap((p, i) => [`--- ${i + 1}/${d.thread.length}`, p.text, ""])].join("\n");
}

/** Open the draft in $EDITOR as plain text and read it back. Parts are split on lines of "---". */
function editDraft(d: Draft): Draft {
  const dir = mkdtempSync(path.join(os.tmpdir(), "launch-crew-edit-"));
  const file = path.join(dir, "draft.txt");
  try {
    writeFileSync(file, [d.post.text, ...d.thread.map((p) => p.text)].join("\n---\n") + "\n");
    const editor = process.env.VISUAL || process.env.EDITOR || "vi";
    const r = spawnSync(editor, [file], { stdio: "inherit", shell: true });
    if (r.status !== 0) throw new Error(`${editor} exited ${r.status}`);
    return parseEdited(readFileSync(file, "utf8"), d);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export function parseEdited(text: string, before: Draft): Draft {
  const [post, ...thread] = text.split(/^---\s*$/m).map((s) => s.trim()).filter(Boolean);
  const ids = (i: number) => (i === 0 ? before.post.factIds : before.thread[i - 1]?.factIds ?? []);
  return { post: { text: post ?? "", factIds: ids(0) }, thread: thread.map((t, i) => ({ text: t, factIds: ids(i + 1) })) };
}

export async function approve(dir: string): Promise<Run> {
  const run = loadRun(dir);
  if (!run.final) throw new Error(`run ${run.id} has no draft to approve (status: ${run.status})`);
  if (!process.stdin.isTTY) throw new Error("approval needs a person at a terminal: run `launch-crew approve <run>` yourself");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    let draft = run.final;
    for (;;) {
      console.log(`\n${renderDraft(draft)}\n`);
      if (!run.criticApproved) console.log("The critic did not approve this draft. See report.md for why.\n");
      const issues = run.research ? lint(draft, run.research.facts, run.source.repoUrl) : [];
      for (const i of issues) console.log(`  lint: [${i.where}] ${i.rule}: "${i.quote}". ${i.fix}`);
      const a = (await rl.question("[a]pprove, [e]dit, [r]eject, or [q]uit and decide later? ")).trim().toLowerCase();
      if (a === "e") {
        rl.pause();
        draft = editDraft(draft);
        rl.resume();
        continue;
      }
      if (a === "q") return run;
      if (a === "a" || a === "r") {
        const note = (await rl.question("Note for the record (optional): ")).trim();
        run.final = draft;
        run.status = a === "a" ? "approved" : "rejected";
        if (note) run.humanNote = note;
        if (a === "a") writeFileSync(path.join(dir, "approved.md"), approvedText(draft));
        saveRun(dir, run);
        return run;
      }
    }
  } finally {
    rl.close();
  }
}
