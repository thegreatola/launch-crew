/**
 * The writer turns the verified facts into one X post and one thread. It has no
 * tools: it can only use what the researcher found. Each part lists the fact
 * ids it relies on, which is what lets the lint check its numbers.
 */
import { STOCK_PHRASES, THREAD_MAX, THREAD_MIN, X_LIMIT } from "../lint.js";
import type { Draft, Fact, Issue, Research } from "../types.js";

export const WRITER_SYSTEM = `You write launch posts for X about software projects, for an audience of developers and people building with AI.

You get a fact sheet and write two things:
- "post": one standalone post that makes someone stop scrolling and want to look at the project.
- "thread": ${THREAD_MIN} to ${THREAD_MAX} parts that tell the story: the problem, what it does, one or two things that are interesting about how it works, something that broke and how it was fixed if the facts have one, and how to try it.

Rules:
- Use only the facts. For every part, list in "factIds" the ids of the facts it uses. Any number you write with digits must appear in one of the facts you cite.
- Each part is at most ${X_LIMIT} characters, and a link counts as 23.
- If you're given a repo link, put it once: at the end of the post, and in the last part of the thread only.
- Write like a person who built the thing and is telling a friend: plain, specific, first person is fine. Short sentences. No hype words, no em dashes or en dashes, no "not just X but Y", no hashtags, no emoji unless one really helps, no thread numbering like "1/".
- Never use these phrases: ${STOCK_PHRASES.filter((p) => /\w/.test(p)).join(", ")}.
- The first line carries the post. Open with the most surprising concrete fact, a result, or the problem in the reader's words. Never open with the project's name and a definition.`;

export const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["post", "thread"],
  properties: {
    post: { $ref: "#/$defs/part" },
    thread: { type: "array", minItems: 1, items: { $ref: "#/$defs/part" } },
  },
  $defs: {
    part: {
      type: "object",
      additionalProperties: false,
      required: ["text", "factIds"],
      properties: { text: { type: "string" }, factIds: { type: "array", items: { type: "string" } } },
    },
  },
};

export function writerPrompt(research: Research, facts: Fact[], repoUrl: string | null, previous?: { draft: Draft; issues: Issue[]; earlier: Issue[] }): string {
  const sheet = {
    name: research.name,
    oneLiner: research.oneLiner,
    audience: research.audience,
    problem: research.problem,
    angles: research.angles,
    facts: facts.map(({ id, claim, quote }) => ({ id, claim, quote })),
  };
  const lines = [
    `<facts>\n${JSON.stringify(sheet, null, 2)}\n</facts>`,
    repoUrl ? `<link>${repoUrl}</link>` : "<link>none: this repo has no public link, so use no links</link>",
  ];
  if (previous) {
    lines.push(
      `<previous_draft>\n${JSON.stringify(previous.draft, null, 2)}\n</previous_draft>`,
      `<feedback>\n${previous.issues.map(line).join("\n")}\n</feedback>`,
      ...(previous.earlier.length ? [`<earlier_feedback>\n${previous.earlier.map(line).join("\n")}\n</earlier_feedback>`] : []),
      `Your previous draft was sent back. Fix every point in the feedback and keep what was working.${previous.earlier.length ? " The earlier feedback was about older drafts and still applies: don't bring back anything it asked you to remove." : ""} Return the full new draft.`,
    );
  } else lines.push("Write the post and the thread.");
  return lines.join("\n\n");
}

const line = (i: Issue) => `- [${i.where}] ${i.rule}: "${i.quote}". ${i.fix}`;

export function asDraft(output: unknown): Draft {
  const o = output as any;
  const part = (p: any) => ({ text: String(p?.text ?? ""), factIds: Array.isArray(p?.factIds) ? p.factIds.map(String) : [] });
  if (!o?.post || !Array.isArray(o.thread)) throw new Error("writer returned no draft");
  return { post: part(o.post), thread: o.thread.map(part) };
}
