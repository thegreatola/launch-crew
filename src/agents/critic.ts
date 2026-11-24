/**
 * The LLM half of the critic: the things a rule can't check. It sees only
 * drafts that already pass the lint. Every issue it raises has to quote the
 * draft; an issue whose quote isn't in the draft is kept but marked unanchored,
 * so a critic that invents problems shows up in the report.
 */
import type { Critique, Draft, Fact, Issue, Where } from "../types.js";

export const CRITIC_SYSTEM = `You are the critic on a launch crew. A writer drafted an X post and a thread about a software project. Decide whether it is good enough to show the person who will post it, or send it back.

A program has already checked length, links, dashes, hashtags, stock phrases and that every number comes from the facts. You judge what it can't:
- hook: the first line of the post and of the thread must make a developer stop. Opening with the project name and a definition, or a vague claim, fails.
- specific: every part should say something only this project could say. Generic lines ("makes your workflow easier", "built for developers") fail.
- supported: no claim may go beyond the facts. Words like "production-ready", "fastest", "first", "anyone can", or implied users and adoption that the facts don't show fail.
- voice: it should sound like the builder talking, not like marketing or an AI. Hype, filler and forced rhetorical questions fail.
- story: the thread should move forward. Parts that repeat each other, or a thread with no clear "how to try it" at the end, fail.
- cta: exactly one clear next step (the link, or what to try). None, or several competing ones, fails.

Be strict but fair: approve a draft you'd post yourself, and don't send back a good draft to look busy. For each problem, give "where" ("post" or "thread N", 1-based), the rule, a quote copied exactly from the draft, and a concrete fix. If you approve, return no issues. In "strengths", say in one sentence what works.`;

export const CRITIQUE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["verdict", "issues", "strengths"],
  properties: {
    verdict: { type: "string", enum: ["approve", "revise"] },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["where", "rule", "quote", "fix"],
        properties: {
          where: { type: "string" },
          rule: { type: "string", enum: ["hook", "specific", "supported", "voice", "story", "cta"] },
          quote: { type: "string" },
          fix: { type: "string" },
        },
      },
    },
    strengths: { type: "string" },
  },
};

export function criticPrompt(draft: Draft, facts: Fact[]): string {
  const view = {
    post: draft.post.text,
    thread: draft.thread.map((p, i) => ({ part: i + 1, text: p.text })),
  };
  return [
    `<facts>\n${JSON.stringify(facts.map(({ id, claim }) => ({ id, claim })), null, 2)}\n</facts>`,
    `<draft>\n${JSON.stringify(view, null, 2)}\n</draft>`,
    "Review the draft.",
  ].join("\n\n");
}

const norm = (s: string) => s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim().toLowerCase();

export function asCritique(output: unknown, draft: Draft): Critique {
  const o = output as any;
  if (o?.verdict !== "approve" && o?.verdict !== "revise") throw new Error("critic returned no verdict");
  const texts = norm([draft.post.text, ...draft.thread.map((p) => p.text)].join("\n"));
  const issues: Issue[] = (Array.isArray(o.issues) ? o.issues : []).map((i: any) => {
    const quote = String(i.quote ?? "");
    return {
      where: toWhere(String(i.where ?? "post"), draft.thread.length),
      rule: String(i.rule ?? ""),
      quote,
      fix: String(i.fix ?? ""),
      by: "critic" as const,
      anchored: quote.trim() !== "" && texts.includes(norm(quote)),
    };
  });
  return { verdict: o.verdict, issues, strengths: String(o.strengths ?? "") };
}

function toWhere(s: string, threadLength: number): Where {
  const m = s.match(/(\d+)/);
  if (/thread/i.test(s) && m) {
    const n = Math.min(Math.max(1, Number(m[1])), Math.max(1, threadLength));
    return `thread ${n}`;
  }
  return "post";
}
