import assert from "node:assert/strict";
import { test } from "node:test";
import { CRITIC_CASES, EVAL_FACTS, EVAL_REPO } from "../src/critic-eval.js";
import { lint, numbersIn, xLength } from "../src/lint.js";
import type { Draft, Fact } from "../src/types.js";

const REPO = "https://github.com/someone/thing";
const facts: Fact[] = [
  { id: "f1", claim: "There are 17 offline tests.", path: "README.md", quote: "There are 17 tests, all offline" },
  { id: "f2", claim: "A 211 MB session with 1,291 model calls parses in under a second.", path: "README.md", quote: "A 211 MB session with 1,291 model calls parses in under a second." },
];
const ok = (thread = 3): Draft => ({
  post: { text: `Seventeen tests and no network needed. ${REPO}`, factIds: ["f1"] },
  thread: Array.from({ length: thread }, (_, i) => ({ text: i === thread - 1 ? `Try it: ${REPO}` : "This part is plain.", factIds: [] })),
});
const rules = (d: Draft) => lint(d, facts, REPO).map((i) => `${i.where}:${i.rule}`);

test("xLength counts links as 23 and emoji as 2", () => {
  assert.equal(xLength("abc"), 3);
  assert.equal(xLength(`see ${REPO}`), 4 + 23);
  assert.equal(xLength("ok 👍🏽"), 3 + 2);
  assert.equal(xLength("日本"), 4);
});

test("numbersIn normalizes thousands and skips links and thread counters", () => {
  assert.deepEqual(numbersIn("1/ It has 1,291 calls and 0.6 s, see https://x.com/a/123"), ["1291", "0.6"]);
  assert.deepEqual(numbersIn("Node 22 and 24."), ["22", "24"]);
});

test("a clean draft passes", () => {
  assert.deepEqual(rules(ok()), []);
});

test("numbers must come from a cited fact", () => {
  const d = ok();
  d.thread[0] = { text: "It has 17 tests and parses 211 MB.", factIds: ["f1"] };
  assert.deepEqual(rules(d), ["thread 1:ungrounded-number"]);
  d.thread[0].factIds = ["f1", "f2"];
  assert.deepEqual(rules(d), []);
  d.thread[0] = { text: "It has 18 tests.", factIds: ["f1"] };
  assert.deepEqual(rules(d), ["thread 1:ungrounded-number"]);
});

test("the style and link rules", () => {
  const d = ok(2);
  d.post.text = `Introducing a game changer — with #ai #agents and 🚀🔥 https://example.com ${REPO}`;
  d.thread[0] = { text: `Not just fast but also small. @someone ${REPO}`, factIds: ["f9"] };
  const got = rules(d);
  for (const r of ["thread 1:thread-size", "post:dash", "post:stock-phrase", "post:emoji", "post:unknown-link", "post:links", "post:hashtags", "thread 1:not-x-but-y", "thread 1:mention", "thread 1:link-placement", "thread 1:unknown-fact"]) assert.ok(got.includes(r), `${r} in ${got.join(", ")}`);
});

test("too long for X", () => {
  const d = ok();
  d.thread[0] = { text: "word ".repeat(60), factIds: [] };
  assert.deepEqual(rules(d), ["thread 1:too-long"]);
});

test("every critic-eval draft passes the lint, so the eval measures only the LLM critic", () => {
  for (const c of CRITIC_CASES) assert.deepEqual(lint(c.draft, EVAL_FACTS, EVAL_REPO), [], c.id);
});
