# Launch crew: agent-trace-viewer

Waiting for your approval. Nothing has been posted.

Repo https://github.com/thegreatola/agent-trace-viewer at 78d8cff. Model sonnet. Started 2026-11-24T14:08:44.620Z.
7 agent runs, 79 s, $0.189 at API prices.

## Final draft

**Post** (232/280, facts f4)

> On a real session resumed days later, my viewer showed a 12-day "model call". A test covers it now. agent-trace-viewer turns Claude Code traces into one local HTML timeline with tokens, cost and eval grades.
> 
> https://github.com/thegreatola/agent-trace-viewer

**Thread 1/8** (169/280, facts f5)

> A 211 MB Claude Code session with 1,291 model calls parses in under a second. That's the trace viewer I built, and it turns the whole thing into one local HTML timeline.

**Thread 2/8** (171/280, facts f11)

> It reads headless stream-json runs, session files and eval runs. Point it at your newest Claude Code session for the current folder with --latest and you get the timeline.

**Thread 3/8** (151/280, facts f12)

> The overview gives pass rate, median and p95 run time, total cost and tokens, results by variant, and per-tool call counts, errors and p50/p95 latency.

**Thread 4/8** (206/280, facts f6, f7, f8)

> Timing is where I was careful. Idle gaps over 30 seconds are shortened, but step durations stay real. Two parallel tool calls running for two seconds count as two seconds, not four. It never fakes a timing.

**Thread 5/8** (117/280, facts f4)

> A timing bug showed up on a real session resumed days later. It produced a 12-day "model call". Now a test covers it.

**Thread 6/8** (214/280, facts f1, f2, f3)

> Privacy: it builds one HTML file on your machine. The page sets a CSP of default-src 'none', so it can't make a network request. Parsers copy only an allowlist of fields, and a test checks session secrets stay out.

**Thread 7/8** (155/280, facts f14, f9)

> Known gap: subagent steps in session files aren't shown yet. On the build side, the UI is plain DOM with no framework, bundled with esbuild at about 22 KB.

**Thread 8/8** (74/280, facts f13, f11)

> Needs Node 22+. Try it: node dist/cli.js --latest
> 
> https://github.com/thegreatola/agent-trace-viewer

## Rounds

### Round 1: sent back by the critic (2 issues)

- **thread 1**, supported: "what went in and came back, what it cost, or which eval check failed and where in the answer". The facts don't back inputs and outputs, or a failed check located in the answer. Keep only what the facts show, for example: 'which steps were slow, what a run cost in tokens and dollars, and what the pass rate was.'
- **thread 1**, hook: "Agent runs are raw JSON logs. It's hard to see which steps were slow". This opens on a generic problem statement that any trace tool could use. Start with something only this project has. Examples are the 12-day 'model call' on a resumed session, or the 211 MB session with 1,291 model calls that parses in under a second. Then move the problem framing to part 2.

What works: The post opens on a real, odd bug (a 12-day "model call"). The thread then backs it with concrete details: timing rules, the privacy design (CSP and field allowlist), a stated known gap, and a runnable command at the end.

<details><summary>This draft</summary>

**Post** (232/280, facts f4)

> On a real session resumed days later, my viewer showed a 12-day "model call". A test covers it now. agent-trace-viewer turns Claude Code traces into one local HTML timeline with tokens, cost and eval grades.
> 
> https://github.com/thegreatola/agent-trace-viewer

**Thread 1/7** (190/280, facts none)

> Agent runs are raw JSON logs. It's hard to see which steps were slow, what went in and came back, what it cost, or which eval check failed and where in the answer. I built a viewer for that.

**Thread 2/7** (193/280, facts f11)

> It reads headless stream-json runs, session files and eval runs, and builds one timeline of every model call and tool call. --latest finds the newest Claude Code session for the current folder.

**Thread 3/7** (151/280, facts f12)

> The overview gives pass rate, median and p95 run time, total cost and tokens, results by variant, and per-tool call counts, errors and p50/p95 latency.

**Thread 4/7** (206/280, facts f6, f7, f8)

> Timing is where I was careful. Idle gaps over 30 seconds are shortened, but step durations stay real. Two parallel tool calls running for two seconds count as two seconds, not four. It never fakes a timing.

**Thread 5/7** (156/280, facts f4, f5)

> The 12-day "model call" came from a real session resumed days later. Now a test covers it. A 211 MB session with 1,291 model calls parses in under a second.

**Thread 6/7** (214/280, facts f1, f2, f3)

> Privacy: it builds one HTML file on your machine. The page sets a CSP of default-src 'none', so it can't make a network request. Parsers copy only an allowlist of fields, and a test checks session secrets stay out.

**Thread 7/7** (197/280, facts f14, f9, f13, f11)

> Known gap: subagent steps in session files aren't shown yet. The UI is plain DOM, no framework, about 22 KB. Needs Node 22+, MIT licensed. Try it: node dist/cli.js --latest
> 
> https://github.com/thegreatola/agent-trace-viewer

</details>

### Round 2: sent back by the critic (3 issues)

- **thread 8**, supported: "Needs Node 22+, MIT licensed.". The quote for f13 only backs Node >=22. Drop "MIT licensed" or replace it with something the quotes support.
- **thread 2**, specific: "agent runs are raw JSON logs. It's hard to see which steps were slow, what a run cost in tokens and dollars, and what the pass rate was.". This is a generic problem statement, and "raw JSON logs" isn't in the facts. Cut the part or swap it for something only this project can say. For example, say what the 211 MB session looked like before the viewer, or go straight to what the timeline shows.
- **thread 8**, story: "Known gap: subagent steps in session files aren't shown yet. The UI is plain DOM, no framework, about 22 KB. Needs Node 22+, MIT licensed. Try it: node dist/cli.js --latest". The ending crowds the known gap, UI size, requirements and the try-it step into one part. Move the known gap and the 22 KB detail into a part of their own. Keep the last part to the requirement, the one command and the link.

What works: The post opens on a concrete 12-day \"model call\" bug, and the thread is full of specifics: the 211 MB session, the CSP, the allowlist and the parallel-time rule. It also states a known gap honestly.

<details><summary>This draft</summary>

**Post** (232/280, facts f4)

> On a real session resumed days later, my viewer showed a 12-day "model call". A test covers it now. agent-trace-viewer turns Claude Code traces into one local HTML timeline with tokens, cost and eval grades.
> 
> https://github.com/thegreatola/agent-trace-viewer

**Thread 1/8** (169/280, facts f5)

> A 211 MB Claude Code session with 1,291 model calls parses in under a second. That's the trace viewer I built, and it turns the whole thing into one local HTML timeline.

**Thread 2/8** (152/280, facts f12)

> Why I built it: agent runs are raw JSON logs. It's hard to see which steps were slow, what a run cost in tokens and dollars, and what the pass rate was.

**Thread 3/8** (193/280, facts f11)

> It reads headless stream-json runs, session files and eval runs, and builds one timeline of every model call and tool call. --latest finds the newest Claude Code session for the current folder.

**Thread 4/8** (151/280, facts f12)

> The overview gives pass rate, median and p95 run time, total cost and tokens, results by variant, and per-tool call counts, errors and p50/p95 latency.

**Thread 5/8** (206/280, facts f6, f7, f8)

> Timing is where I was careful. Idle gaps over 30 seconds are shortened, but step durations stay real. Two parallel tool calls running for two seconds count as two seconds, not four. It never fakes a timing.

**Thread 6/8** (117/280, facts f4)

> A timing bug showed up on a real session resumed days later. It produced a 12-day "model call". Now a test covers it.

**Thread 7/8** (214/280, facts f1, f2, f3)

> Privacy: it builds one HTML file on your machine. The page sets a CSP of default-src 'none', so it can't make a network request. Parsers copy only an allowlist of fields, and a test checks session secrets stay out.

**Thread 8/8** (197/280, facts f14, f9, f13, f11)

> Known gap: subagent steps in session files aren't shown yet. The UI is plain DOM, no framework, about 22 KB. Needs Node 22+, MIT licensed. Try it: node dist/cli.js --latest
> 
> https://github.com/thegreatola/agent-trace-viewer

</details>

### Round 3: approved by the critic


What works: It opens with a concrete bug (a 12-day "model call"), backs every claim with repo facts, including the privacy details and the known subagent gap, and the thread moves from the speed hook through timing and privacy to a single "try it" ending.

## Research

Turns Claude Code traces and eval runs into a single local HTML timeline of every model call and tool call, with tokens, cost and eval grades.

For: Developers who run Claude Code or agent evals and want to see what an agent actually did, and why an eval trial failed.. Problem: Agent runs are raw JSON logs. It is hard to see which steps were slow, what went in and came back, what it cost, or which eval check failed and where in the answer.

14 facts verified against the files:

- **f1** It builds one local HTML file; nothing is uploaded and the page can't make network requests. (`README.md`: "It builds one HTML file on your machine. Nothing is uploaded, and the page can't make a network request.")
- **f2** The page sets a CSP of default-src 'none'. (`README.md`: "The page sets a Content-Security-Policy of `default-src 'none'`, so it can't load or send anything.")
- **f3** Parsers copy only an allowlist of fields, and a test checks session secrets don't reach the HTML. (`README.md`: "The parsers copy only an allowlist of fields into a trace")
- **f4** A bug produced a 12-day 'model call' on a resumed session; a test now covers it. (`README.md`: "On a real session resumed days later, that produced a 12-day "model call". Now a test covers it.")
- **f5** A 211 MB session with 1,291 model calls parses in under a second. (`README.md`: "A 211 MB session with 1,291 model calls parses in under a second.")
- **f6** Idle gaps over 30 seconds are shortened on the timeline, while per-step durations stay real. (`README.md`: "Idle gaps over 30 seconds are shortened on the timeline")
- **f7** Parallel time is counted once in the time split. (`README.md`: "Two tool calls running together for two seconds take two seconds, not four.")
- **f8** The viewer never fakes timing; untimed traces are drawn as ordered steps. (`README.md`: "The viewer never fakes a timing.")
- **f9** The UI is plain DOM with no framework, bundled with esbuild at about 22 KB. (`README.md`: "the viewer: plain DOM, no framework, bundled with esbuild (~22 KB)")
- **f10** There are 17 offline tests, and CI runs on Node 22 and 24. (`README.md`: "There are 17 tests, all offline:")
- **f11** Reads headless stream-json runs, session files and eval runs; --latest finds the newest session. (`README.md`: "node dist/cli.js --latest               # newest Claude Code session for the current folder")
- **f12** The overview reports pass rate, median and p95 run time, cost, tokens, and per-tool latency. (`README.md`: "Pass rate, median and p95 run time, total cost and tokens, results by variant, and per-tool call counts, errors and p50/p95 latency.")
- **f13** Requires Node 22+ and is MIT licensed. (`package.json`: ""node": ">=22"")
- **f14** Known limit: subagent steps in session files aren't shown yet. (`README.md`: "Subagent steps inside session files are kept in separate sidechain records and aren't shown yet.")

## Agent runs

Each log is Claude Code stream-json, which agent-trace-viewer opens.

- researcher: 18.7 s, 24056 in / 2303 out, $0.0436, `logs/01-researcher.jsonl`
- writer-1: 10.7 s, 3347 in / 1471 out, $0.0237, `logs/02-writer-1.jsonl`
- critic-1: 13.4 s, 3694 in / 1432 out, $0.0266, `logs/03-critic-1.jsonl`
- writer-2: 9.8 s, 4509 in / 1300 out, $0.0266, `logs/04-writer-2.jsonl`
- critic-2: 10.6 s, 3752 in / 1253 out, $0.0230, `logs/05-critic-2.jsonl`
- writer-3: 9.5 s, 4996 in / 1296 out, $0.0285, `logs/06-writer-3.jsonl`
- critic-3: 6.4 s, 3697 in / 642 out, $0.0167, `logs/07-critic-3.jsonl`
