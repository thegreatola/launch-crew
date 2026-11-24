#!/usr/bin/env node
// Stands in for `claude -p`. It records its arguments, then prints stream-json
// whose structured output comes from FAKE_CLAUDE_OUTPUT. FAKE_CLAUDE_TOOLS sets
// the tools the init event reports, to test the isolation check.
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
if (process.env.FAKE_CLAUDE_ARGS) writeFileSync(process.env.FAKE_CLAUDE_ARGS, JSON.stringify({ args, cwd: process.cwd() }));
const tools = process.env.FAKE_CLAUDE_TOOLS ? process.env.FAKE_CLAUDE_TOOLS.split(",") : ["StructuredOutput"];
const output = JSON.parse(process.env.FAKE_CLAUDE_OUTPUT ?? "{}");
const ts = (s) => new Date(Date.UTC(2026, 10, 24, 9, 0, s)).toISOString();
const lines = [
  { type: "system", subtype: "init", tools, model: "fake", timestamp: ts(0) },
  { type: "assistant", message: { id: "m1", content: [{ type: "tool_use", id: "t1", name: "Read", input: { file_path: "README.md" } }] }, timestamp: ts(1) },
  { type: "user", message: { content: [{ type: "tool_result", tool_use_id: "t1", content: "# readme" }] }, timestamp: ts(2) },
  { type: "assistant", message: { id: "m2", content: [{ type: "tool_use", id: "t2", name: "StructuredOutput", input: output }] }, timestamp: ts(3) },
  { type: "result", subtype: "success", is_error: false, duration_ms: 3000, total_cost_usd: 0.01, num_turns: 2, result: JSON.stringify(output), structured_output: output, usage: { input_tokens: 10, output_tokens: 20, cache_read_input_tokens: 5 }, timestamp: ts(3) },
];
process.stdout.write(lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
