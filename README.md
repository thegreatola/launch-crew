# launch-crew

Three AI agents turn a code repo into launch posts for X: a researcher reads the repo, a writer drafts a post and a thread, and a critic sends drafts back until they're good. Every claim traces back to an exact quote from the repo, and nothing is final until a person approves it. It never posts anything.

```
repo ──> researcher ──> verify quotes ──> writer ──> lint ──> critic ──> you
         Read/Glob/Grep  (drop any fact     no tools   rules    judgment   approve, edit
         in a clean       whose quote        │                    │        or reject
         clone            isn't in the file) └── sent back, with reasons, up to 3 rounds
```

## What a run looks like

A real run on [agent-trace-viewer](https://github.com/thegreatola/agent-trace-viewer):

```
researcher: reading agent-trace-viewer @ 78d8cff
researcher: 14 facts, 14 verified against the files, 0 dropped (3 tool calls)
round 1: critic sent it back (supported, hook)
round 2: critic sent it back (supported, specific, story)
round 3: critic approved. It opens with a concrete bug (a 12-day "model call"), backs every claim with repo facts, ...
```

The critic's reasons are specific and quote the draft. From that run and one on [launch-audit](https://github.com/thegreatola/launch-audit):

> **thread 1**, hook: "Agent runs are raw JSON logs. It's hard to see which steps were slow". This opens on a generic problem statement that any trace tool could use. Start with something only this project has. Examples are the 12-day 'model call' on a resumed session, or the 211 MB session with 1,291 model calls that parses in under a second.

> **thread 8**, supported: "Needs Node 22+, MIT licensed." The quote for f13 only backs Node >=22. Drop "MIT licensed" or replace it with something the quotes support.

> **thread 2**, supported: "The judgment calls go to Claude with screenshots." The facts don't mention screenshots.

> **thread 6**, story: "The bug: measuring phone overflow against innerWidth always reports zero." The post already told this story, so the thread repeats it.

Full reports, with every draft and every rejection: [agent-trace-viewer](docs/examples/agent-trace-viewer.md), [launch-audit](docs/examples/launch-audit.md) (not approved after 3 rounds), [deriv-market-mcp](docs/examples/deriv-market-mcp.md) (approved first time). These are unedited output, not posts anyone approved.

## Use it

Requires Node 22+ and [Claude Code](https://claude.com/claude-code), logged in. Each agent runs as `claude -p`, so a Claude subscription covers it with no API key.

```bash
git clone https://github.com/thegreatola/launch-crew
cd launch-crew
npm install
npm run crew -- run ~/code/my-project                      # or a GitHub URL
npm run crew -- run https://github.com/owner/repo --rounds 2 --model opus
npm run crew -- show                                       # the latest run's report
npm run crew -- approve                                    # you decide
```

`approve` shows the final draft, rechecks it against the lint, and asks you to approve, edit (it opens `$EDITOR`), reject, or decide later. Approving writes `approved.md` for you to copy into X. It needs a person at a terminal and refuses to run without one.

Each run is a folder under `runs/` with `run.json`, `report.md`, and every agent's raw log. The logs are Claude Code stream-json, so [agent-trace-viewer](https://github.com/thegreatola/agent-trace-viewer) opens them as timelines.

## Results

Five live runs on four public repos, with Claude Sonnet:

| Repo | Facts kept | Rounds | Sent back by | Critic approved | Time | Cost at API prices |
|---|---|---|---|---|---|---|
| agent-trace-viewer (before the fix below) | 14 of 14 | 3 | critic x3 | no | 87 s | $0.20 |
| agent-trace-viewer | 14 of 14 | 3 | critic x2 | round 3 | 79 s | $0.19 |
| deriv-market-mcp | 16 of 16 | 1 | none | round 1 | 39 s | $0.12 |
| market-agent-evals | 15 of 15 | 1 | none | round 1 | 44 s | $0.15 |
| launch-audit | 15 of 15 | 3 | lint, critic x2 | no | 87 s | $0.25 |

When no draft passes in time, the last one still goes to you, marked as not approved, with the reasons.

**Is the critic any good?** `npm run crew -- critic-eval` gives the critic 13 hand-written drafts: 10 with one planted flaw each (a hook that opens with a definition, a generic line, three kinds of overclaiming, hype voice, rhetorical-question spam, a part that repeats another, no call to action, four competing ones) and 3 clean drafts. All 13 pass the lint, so this measures only the LLM layer. Over 3 runs:

- **Flawed drafts:** 30 of 30 sent back, each naming the planted flaw at the right part.
- **Clean drafts:** 5 of 9 approved. The 4 rejections were all for amounts no fact gave: "mostly waiting on the human" when the fact says "idle for hours", and "thousands of JSON lines" with no line count anywhere. That's strict, and it's the strictness the critic was told to have.

So the critic misses nothing it was built to catch, and leans strict. In a run, strictness costs an extra round, not a bad post.

## What broke and how it was fixed

**The critic rejected true claims.** The first live run was sent back three times for "unsupported" claims that were in the README. The writer saw each fact's claim and its exact quote, but the critic saw only the claim, and the claims were summaries ("per-tool stats") while the quotes held the detail ("per-tool call counts, errors and p50/p95 latency"). The critic now judges against the same evidence the writer used.

**The writer undid its own fixes.** In that same run, round 3 brought back a line round 1 had made it cut, because the writer only saw the latest round's feedback. It now gets every earlier round's feedback too, marked as still applying. The crew test covers both fixes.

**The first critic eval was wrong, not the critic.** It rejected all three "clean" drafts, and reading why showed the critic was right: the drafts made four claims ("no server", "my eval harness", "every session file") that the eval's hand-written fact list didn't include. The facts now carry the README's wording for them. The remaining rejections are the strict ones described above, and the drafts weren't rewritten to pass.

## Design decisions

**Every fact is checked against the file it quotes.** The researcher has to give, for each fact, a file path and a quote copied from that file. The program opens the file and drops any fact whose quote isn't there, forgiving only whitespace and curly quotes. A researcher that paraphrases or invents loses those facts before the writer sees them.

**Numbers are checked by a program, not a model.** Each part of a draft lists the fact ids it uses, and the lint rejects any number written with digits that isn't in one of those facts. That's the most common way a launch post gets something wrong, and it's checkable exactly.

**Rules before judgment.** The lint (X's 280-character count with links as 23 and emoji as 2, link placement, dashes, hashtags, stock phrases like "game-changer" and "excited to announce", unknown @mentions) runs first, and the LLM critic only sees drafts that pass it. Rule failures are cheaper to find with code, and the critic's attention goes to what needs taste: the hook, specificity, overclaiming, voice, story and the call to action.

**The critic has to quote the draft.** Every issue the critic raises includes a quote, and the program checks it's really in the draft. An issue that isn't is kept but marked, so a critic that invents problems shows up in the report. In the live runs above, every issue was anchored.

**Each agent gets only what its job needs.** The researcher runs in a shallow clone of the last commit, with `.git` removed, so a local `.env`, untracked notes or build output never reach it. It gets Read, Glob and Grep, and Claude Code's `--restricted` mode keeps those inside the clone (tested: a read outside it is refused). The writer and critic get no tools. Every agent runs with no settings, MCP servers, skills or slash commands, and the runner fails an agent whose start-up event lists a tool it wasn't given.

**A person approves, and nothing posts.** There is no X API call anywhere in the code. The crew's job ends at a draft waiting for approval, and approval needs a terminal. Remote URLs are reduced to `github.com/owner/name`, so a token in a git remote never lands in a prompt or a report.

## Tests

```bash
npm test
```

16 tests, all offline:
- **Lint:** X length counting, number extraction, number grounding, every style and link rule, and that every critic-eval draft passes the lint.
- **Research:** quote verification, including paraphrases, wrong files, paths that escape the repo and quotes too short to check.
- **The crew loop** with a scripted runner: lint sends round 1 back, the critic round 2, round 3 is approved. It checks the writer sees all earlier feedback, the critic sees the quotes, dropped facts never reach a prompt, and only the researcher gets tools. Also: running out of rounds, too few facts, and an agent failing.
- **The Claude Code runner** against a fake `claude`: the flags it passes, structured output, and the isolation check.
- **Sources:** credentials stripped from remotes, and a clone that leaves out `.env`, untracked files and `.git`.
- **Approval:** edited drafts keep their fact ids, and the approved text is ready to paste.

CI runs them on Node 22 and 24. The live runs and the critic eval use your Claude login, so they run only when you start them.

## Limits

- X only. The voice rules suit developer launches, not every audience.
- The critic eval is 13 drafts about one project. It shows the critic can catch these flaws, not that it catches every flaw.
- In the live runs the researcher quoted perfectly, so quote verification never had to drop a fact. The tests cover the cases where it does.
- Costs are what the same tokens would cost on the API. On a subscription they count toward your plan's usage instead.

## License

MIT
