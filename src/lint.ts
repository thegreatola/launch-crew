/**
 * The deterministic half of the critic. These rules don't need judgment, so a
 * program checks them on every draft before the LLM critic sees it: X's length
 * limit, numbers that must come from the facts, links, and phrases that read as
 * machine-written.
 */
import type { Draft, Fact, Issue, Part, Where } from "./types.js";

export const X_LIMIT = 280;
const URL_WEIGHT = 23;
export const THREAD_MIN = 3;
export const THREAD_MAX = 8;

/** Phrases that make a post read as generated. Matched case-insensitively. */
export const STOCK_PHRASES = [
  "game-changer", "game changer", "delve", "unlock", "unleash", "supercharge", "revolutionize", "revolutionise",
  "seamless", "effortless", "elevate", "empower", "cutting-edge", "next-level", "in today's", "here's the thing",
  "let that sink in", "the future of", "excited to announce", "excited to share", "thrilled to", "introducing",
  "look no further", "say goodbye to", "buckle up", "a thread", "🧵", "🚀", "dive in", "deep dive",
];

const URL_RE = /\bhttps?:\/\/[^\s)]+/g;

/** Length as X counts it: links are 23, emoji 2, most CJK 2, Latin text 1. */
export function xLength(text: string): number {
  let n = 0;
  const withoutUrls = text.replace(URL_RE, () => {
    n += URL_WEIGHT;
    return "";
  });
  const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
  for (const { segment } of seg.segment(withoutUrls)) {
    if (/\p{Extended_Pictographic}/u.test(segment)) {
      n += 2;
      continue;
    }
    for (const ch of segment) {
      const c = ch.codePointAt(0)!;
      const light = c <= 4351 || (c >= 8192 && c <= 8205) || (c >= 8208 && c <= 8223) || (c >= 8242 && c <= 8247);
      n += light ? 1 : 2;
    }
  }
  return n;
}

/** Numbers written with digits, normalized: "1,291" -> "1291". Thread counters like "1/5" and anything in a link are skipped. */
export function numbersIn(text: string): string[] {
  const clean = text.replace(URL_RE, " ").replace(/(^|\s)\d+\/\d*(?=\s|$)/g, " ");
  const out: string[] = [];
  for (const m of clean.matchAll(/(?<![\w.])\d[\d,]*(?:\.\d+)?/g)) out.push(m[0].replace(/,(?=\d{3}\b)/g, "").replace(/,$/, ""));
  return out;
}

function parts(draft: Draft): [Where, Part][] {
  return [["post", draft.post], ...draft.thread.map((p, i): [Where, Part] => [`thread ${i + 1}`, p])];
}

export function lint(draft: Draft, facts: Fact[], repoUrl: string | null): Issue[] {
  const issues: Issue[] = [];
  const add = (where: Where, rule: string, quote: string, fix: string) => issues.push({ where, rule, quote, fix, by: "lint" });
  const byId = new Map(facts.map((f) => [f.id, f]));
  const all = parts(draft);

  if (draft.thread.length < THREAD_MIN || draft.thread.length > THREAD_MAX)
    add("thread 1", "thread-size", `${draft.thread.length} parts`, `Write a thread of ${THREAD_MIN} to ${THREAD_MAX} parts.`);

  let hashtags = 0;
  for (const [where, part] of all) {
    const text = part.text;
    const len = xLength(text);
    if (len > X_LIMIT) add(where, "too-long", text.slice(0, 60), `This is ${len} characters as X counts them; cut it to ${X_LIMIT}.`);
    if (!text.trim()) add(where, "empty", "", "Write this part or remove it.");

    for (const m of text.matchAll(/[—–]/g)) add(where, "dash", around(text, m.index!), "Use a comma, a full stop or brackets instead of a dash.");

    const lower = text.toLowerCase();
    for (const p of STOCK_PHRASES) {
      const i = lower.indexOf(p);
      if (i >= 0) add(where, "stock-phrase", text.slice(i, i + p.length), `"${p}" reads as machine-written. Say the specific thing instead.`);
    }
    const notJust = text.match(/\bnot just\b[^.!?\n]*\bbut\b/i);
    if (notJust) add(where, "not-x-but-y", notJust[0], "Drop the \"not just X but Y\" frame and state the point directly.");

    const tags = text.match(/(?<!\w)#\w+/g) ?? [];
    hashtags += tags.length;

    for (const m of text.matchAll(/(?<![\w@])@(\w{1,15})/g)) {
      const known = part.factIds.some((id) => byId.get(id)?.quote.includes(m[0]) || byId.get(id)?.claim.includes(m[0]));
      if (!known) add(where, "mention", m[0], "Don't tag accounts the facts don't name.");
    }

    const emoji = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(text)].filter((s) => /\p{Extended_Pictographic}/u.test(s.segment));
    if (emoji.length > 1) add(where, "emoji", emoji.map((e) => e.segment).join(""), "Use one emoji at most per part, or none.");

    const urls = text.match(URL_RE) ?? [];
    for (const u of urls) if (!repoUrl || u.replace(/[.,!?]+$/, "").replace(/\/$/, "") !== repoUrl) add(where, "unknown-link", u, repoUrl ? `The only link should be ${repoUrl}.` : "This repo has no public URL, so leave links out.");
    if (where === "post" && urls.length > 1) add(where, "links", urls.join(" "), "Use one link at most in the post.");
    if (where.startsWith("thread") && urls.length && where !== `thread ${draft.thread.length}`) add(where, "link-placement", urls[0]!, "Put the link in the last part of the thread only.");

    for (const id of part.factIds) if (!byId.has(id)) add(where, "unknown-fact", id, `There is no fact ${id}. Cite only the facts you were given.`);
    const cited = part.factIds.map((id) => byId.get(id)).filter((f): f is Fact => !!f);
    const allowed = new Set(cited.flatMap((f) => [...numbersIn(f.claim), ...numbersIn(f.quote)]));
    for (const n of numbersIn(text)) {
      if (!allowed.has(n)) add(where, "ungrounded-number", n, cited.length ? `${n} is not in the facts this part cites (${part.factIds.join(", ")}). Cite the fact it comes from, or drop it.` : `${n} needs a fact behind it. Cite the fact it comes from, or drop it.`);
    }
  }
  if (hashtags > 1) add("post", "hashtags", `${hashtags} hashtags`, "Use one hashtag at most in the whole draft, or none.");
  return issues;
}

function around(text: string, i: number): string {
  return text.slice(Math.max(0, i - 20), i + 21).trim();
}
