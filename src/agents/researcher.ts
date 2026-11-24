/**
 * The researcher reads the repo with read-only file tools and returns a fact
 * sheet. Every fact carries a short exact quote from a file; verifyFacts() then
 * opens that file and drops any fact whose quote isn't there.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { DroppedFact, Fact, Research } from "../types.js";

export const RESEARCHER_TOOLS = ["Read", "Glob", "Grep"];

export const RESEARCHER_SYSTEM = `You are the researcher on a launch crew. A writer will turn your notes into posts for X, so everything you hand over must be true and checkable.

Read the repository in your working folder with Glob, Grep and Read. Start with the README, then package or project files, source, tests and docs.

Return:
- name, a one-line description, who it is for, and the problem it solves, in plain words.
- 8 to 15 facts. Each is one specific claim plus the exact text from one file that backs it: "path" is the file's path relative to the repo root, and "quote" is copied character for character from that file (one line or a short phrase, under 200 characters). A program checks every quote against the file and throws out any fact whose quote it cannot find, so never paraphrase inside "quote".
- 3 to 5 angles: different ways a launch post could open, each grounded in the facts.

Good facts are concrete: what it does, numbers (tests, speed, results, sizes), a design decision and why, something that broke and how it was fixed, how to try it. Skip vague praise. Never invent anything, and never state a number that isn't in the quoted text.`;

export const RESEARCH_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["name", "oneLiner", "audience", "problem", "facts", "angles"],
  properties: {
    name: { type: "string" },
    oneLiner: { type: "string" },
    audience: { type: "string" },
    problem: { type: "string" },
    facts: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["claim", "path", "quote"],
        properties: { claim: { type: "string" }, path: { type: "string" }, quote: { type: "string" } },
      },
    },
    angles: { type: "array", items: { type: "string" } },
  },
};

export function researcherPrompt(name: string): string {
  return `Research the repository "${name}" in your working folder and return the fact sheet.`;
}

/** Give facts stable ids (f1, f2, ...) in the order the researcher returned them. */
export function withIds(raw: Omit<Fact, "id">[]): Fact[] {
  return raw.map((f, i) => ({ id: `f${i + 1}`, claim: String(f.claim ?? ""), path: String(f.path ?? ""), quote: String(f.quote ?? "") }));
}

const squash = (s: string) =>
  s
    .normalize("NFKC")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

/** Keep facts whose quote is really in the named file. Whitespace and curly quotes are forgiven, nothing else. */
export async function verifyFacts(facts: Fact[], repoDir: string): Promise<{ kept: Fact[]; dropped: DroppedFact[] }> {
  const kept: Fact[] = [];
  const dropped: DroppedFact[] = [];
  const cache = new Map<string, string | null>();
  const root = path.resolve(repoDir);
  for (const fact of facts) {
    const quote = squash(fact.quote);
    if (quote.length < 8) {
      dropped.push({ fact, reason: "quote too short to check" });
      continue;
    }
    const file = path.resolve(root, fact.path.replace(/^\/+/, ""));
    if (file !== root && !file.startsWith(root + path.sep)) {
      dropped.push({ fact, reason: "path is outside the repo" });
      continue;
    }
    if (!cache.has(file)) cache.set(file, await readFile(file, "utf8").then(squash, () => null));
    const text = cache.get(file);
    if (text == null) dropped.push({ fact, reason: `no such file: ${fact.path}` });
    else if (!text.includes(quote)) dropped.push({ fact, reason: `quote not found in ${fact.path}` });
    else kept.push(fact);
  }
  return { kept, dropped };
}

export function asResearch(output: unknown): Research {
  const o = output as any;
  if (!o || !Array.isArray(o.facts)) throw new Error("researcher returned no facts");
  return {
    name: String(o.name ?? ""),
    oneLiner: String(o.oneLiner ?? ""),
    audience: String(o.audience ?? ""),
    problem: String(o.problem ?? ""),
    facts: withIds(o.facts),
    angles: Array.isArray(o.angles) ? o.angles.map(String) : [],
  };
}
