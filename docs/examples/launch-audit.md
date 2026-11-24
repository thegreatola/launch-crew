# Launch crew: launch-audit

Waiting for your approval. Nothing has been posted.

Repo https://github.com/thegreatola/launch-audit at d04be95. Model sonnet. Started 2026-11-24T14:10:31.775Z.
6 agent runs, 87 s, $0.254 at API prices.

## Final draft (not approved by the critic)

**Post** (268/280, facts f6, f1)

> My mobile overflow check passed every site. It was wrong. Measuring overflow against innerWidth always reports zero. The end-to-end test caught it. Now it compares against 375 px.
> 
> Found while building launch-audit, a 25-point launch checklist.
> https://github.com/thegreatola/launch-audit

**Thread 1/8** (170/280, facts f1)

> Launch checklists are half measurable and half taste. Meta tags, robots.txt, broken links, mobile overflow: code can check those. Is the team photo real? That needs eyes.

**Thread 2/8** (201/280, facts f1, f5)

> So I built launch-audit. It checks a site against a 25-point launch checklist in real Chrome. Code measures what it can. The launch_review prompt runs the audit-and-judge loop and ends with a fix list.

**Thread 3/8** (195/280, facts f2, f9)

> It's safe to point at a live site. It runs locally, needs no API key, and is read only. It never clicks, types or submits forms. Form error states and thank-you pages are marked Look, not tested.

**Thread 4/8** (154/280, facts f8)

> It also crawls politely. It respects robots.txt, fetches one page at a time, defaults to 8 pages, and identifies itself as launch-audit in the user agent.

**Thread 5/8** (220/280, facts f13, f14, f7)

> The small mistakes are the fun ones. A missing page that returns 200 instead of 404. An og:image at the wrong size. A site whose only CTA is an Open menu button, which I now exclude so it can't pass the sticky CTA check.

**Thread 6/8** (144/280, facts f10, f6)

> The end-to-end test serves a small site with known problems from the test process. No internet needed. That test is what caught my overflow bug.

**Thread 7/8** (174/280, facts f4, f11)

> Every check is a pure function of the collected data, so the checks are tested on fixtures with no browser or network. That's 16 check tests plus 1 end-to-end test in Chrome.

**Thread 8/8** (173/280, facts f15, f12, f5)

> Needs Node 22. Use the CLI, with a strict mode for CI, or the MCP server. Ask Claude "Is mysite.com ready to launch?" and get a prioritised fix list.
> https://github.com/thegreatola/launch-audit

## Rounds

### Round 1: sent back by the lint (1 issues)

- **post**, too-long: "My mobile overflow check passed every site I tried. It was w". This is 283 characters as X counts them; cut it to 280.

<details><summary>This draft</summary>

**Post** (283/280, facts f6, f1)

> My mobile overflow check passed every site I tried. It was wrong. Phone Chrome zooms out on wide pages, so innerWidth grows and overflow always read zero. The end-to-end test caught it. Now it compares against 375 px.
> 
> That's one of 25 checks in launch-audit.
> https://github.com/thegreatola/launch-audit

**Thread 1/8** (200/280, facts f1)

> Launch checklists are half measurable and half taste. Meta tags, robots.txt, broken links, mobile overflow: code can check those. Is the team photo real? That needs eyes. People skip the tedious half.

**Thread 2/8** (170/280, facts f1)

> So I built launch-audit. It checks a site against a 25-point launch checklist in real Chrome. Code measures what it can. The judgment calls go to Claude with screenshots.

**Thread 3/8** (195/280, facts f2, f9)

> It's safe to point at a live site. It runs locally, needs no API key, and is read only. It never clicks, types or submits forms. Form error states and thank-you pages are marked Look, not tested.

**Thread 4/8** (154/280, facts f8)

> It also crawls politely. It respects robots.txt, fetches one page at a time, defaults to 8 pages, and identifies itself as launch-audit in the user agent.

**Thread 5/8** (220/280, facts f13, f14, f7)

> The small mistakes are the fun ones. A missing page that returns 200 instead of 404. An og:image at the wrong size. A site whose only CTA is an Open menu button, which I now exclude so it can't pass the sticky CTA check.

**Thread 6/8** (239/280, facts f6, f10)

> The bug: measuring phone overflow against innerWidth always reports zero. The end-to-end test found it. It serves a small site with known problems from the test process, no internet. The collector now compares against the requested 375 px.

**Thread 7/8** (174/280, facts f4, f11)

> Every check is a pure function of the collected data, so the checks are tested on fixtures with no browser or network. That's 16 check tests plus 1 end-to-end test in Chrome.

**Thread 8/8** (204/280, facts f15, f12, f5)

> Needs Node 22. Use the CLI, with a strict mode for CI, or the MCP server. Ask Claude "Is mysite.com ready to launch?" and the launch_review prompt ends with a prioritised fix list.
> https://github.com/thegreatola/launch-audit

</details>

### Round 2: sent back by the critic (4 issues)

- **post**, supported: "Phone Chrome zooms out on wide pages, so innerWidth grows and overflow always read zero.". The facts only back that measuring overflow against innerWidth always reports zero. Drop the claim about Chrome zooming out, or say: 'Measuring overflow against innerWidth always reports zero, so my check passed every site.'
- **thread 2**, supported: "The judgment calls go to Claude with screenshots.". The facts don't mention screenshots. Use what the facts say: 'The launch_review prompt runs the audit-and-judge loop and ends with a fix list.'
- **thread 1**, supported: "People skip the tedious half.". This is a claim about other people's behavior that the facts don't show. Cut it, or reword as the builder's own view, e.g. 'The Look items are the ones I'd skip.'
- **thread 6**, story: "The bug: measuring phone overflow against innerWidth always reports zero. The end-to-end test found it.". The post already told this story, so the thread repeats it. Shorten this part to the end-to-end test setup (a small site with known problems, no internet), or swap in a different detail such as the Look vs. graded scoring.

What works: The post opens on a real bug the builder hit, and the thread is packed with details only this project has: soft 404s, the Open menu CTA exclusion, and a read-only guarantee. It ends on one link.

<details><summary>This draft</summary>

**Post** (275/280, facts f6, f1)

> My mobile overflow check passed every site. It was wrong. Phone Chrome zooms out on wide pages, so innerWidth grows and overflow always read zero. The end-to-end test caught it. Now it compares against 375 px.
> 
> That's one of 25 checks in launch-audit.
> https://github.com/thegreatola/launch-audit

**Thread 1/8** (200/280, facts f1)

> Launch checklists are half measurable and half taste. Meta tags, robots.txt, broken links, mobile overflow: code can check those. Is the team photo real? That needs eyes. People skip the tedious half.

**Thread 2/8** (170/280, facts f1)

> So I built launch-audit. It checks a site against a 25-point launch checklist in real Chrome. Code measures what it can. The judgment calls go to Claude with screenshots.

**Thread 3/8** (195/280, facts f2, f9)

> It's safe to point at a live site. It runs locally, needs no API key, and is read only. It never clicks, types or submits forms. Form error states and thank-you pages are marked Look, not tested.

**Thread 4/8** (154/280, facts f8)

> It also crawls politely. It respects robots.txt, fetches one page at a time, defaults to 8 pages, and identifies itself as launch-audit in the user agent.

**Thread 5/8** (220/280, facts f13, f14, f7)

> The small mistakes are the fun ones. A missing page that returns 200 instead of 404. An og:image at the wrong size. A site whose only CTA is an Open menu button, which I now exclude so it can't pass the sticky CTA check.

**Thread 6/8** (239/280, facts f6, f10)

> The bug: measuring phone overflow against innerWidth always reports zero. The end-to-end test found it. It serves a small site with known problems from the test process, no internet. The collector now compares against the requested 375 px.

**Thread 7/8** (174/280, facts f4, f11)

> Every check is a pure function of the collected data, so the checks are tested on fixtures with no browser or network. That's 16 check tests plus 1 end-to-end test in Chrome.

**Thread 8/8** (204/280, facts f15, f12, f5)

> Needs Node 22. Use the CLI, with a strict mode for CI, or the MCP server. Ask Claude "Is mysite.com ready to launch?" and the launch_review prompt ends with a prioritised fix list.
> https://github.com/thegreatola/launch-audit

</details>

### Round 3: sent back by the critic (3 issues)

- **thread 2**, supported: "It checks a site against a 25-point launch checklist in real Chrome.". The facts only show Chrome in the end-to-end test. Drop "in real Chrome" or say "The end-to-end test runs in Chrome." Keep the claim to "checks a site against a 25-point launch checklist."
- **thread 1**, hook: "Launch checklists are half measurable and half taste.". This is a vague general claim, and "half and half" is a ratio the facts don't give. Open with something only this project can say, e.g. "Some launch checks a script can't grade, so launch-audit marks them Look instead of guessing." Then give the examples.
- **thread 5**, voice: "The small mistakes are the fun ones.". Cut this filler line and start with the concrete cases: "It catches a missing page that returns 200 instead of 404 (a soft 404), and an og:image at the wrong size."

What works: The post opens with a real bug the builder hit (overflow always reading zero) and a concrete fix. The thread backs it with specifics like read-only behavior, polite crawling and pure-function tests, and it ends on one link.

<details><summary>This draft</summary>

**Post** (268/280, facts f6, f1)

> My mobile overflow check passed every site. It was wrong. Measuring overflow against innerWidth always reports zero. The end-to-end test caught it. Now it compares against 375 px.
> 
> Found while building launch-audit, a 25-point launch checklist.
> https://github.com/thegreatola/launch-audit

**Thread 1/8** (170/280, facts f1)

> Launch checklists are half measurable and half taste. Meta tags, robots.txt, broken links, mobile overflow: code can check those. Is the team photo real? That needs eyes.

**Thread 2/8** (201/280, facts f1, f5)

> So I built launch-audit. It checks a site against a 25-point launch checklist in real Chrome. Code measures what it can. The launch_review prompt runs the audit-and-judge loop and ends with a fix list.

**Thread 3/8** (195/280, facts f2, f9)

> It's safe to point at a live site. It runs locally, needs no API key, and is read only. It never clicks, types or submits forms. Form error states and thank-you pages are marked Look, not tested.

**Thread 4/8** (154/280, facts f8)

> It also crawls politely. It respects robots.txt, fetches one page at a time, defaults to 8 pages, and identifies itself as launch-audit in the user agent.

**Thread 5/8** (220/280, facts f13, f14, f7)

> The small mistakes are the fun ones. A missing page that returns 200 instead of 404. An og:image at the wrong size. A site whose only CTA is an Open menu button, which I now exclude so it can't pass the sticky CTA check.

**Thread 6/8** (144/280, facts f10, f6)

> The end-to-end test serves a small site with known problems from the test process. No internet needed. That test is what caught my overflow bug.

**Thread 7/8** (174/280, facts f4, f11)

> Every check is a pure function of the collected data, so the checks are tested on fixtures with no browser or network. That's 16 check tests plus 1 end-to-end test in Chrome.

**Thread 8/8** (173/280, facts f15, f12, f5)

> Needs Node 22. Use the CLI, with a strict mode for CI, or the MCP server. Ask Claude "Is mysite.com ready to launch?" and get a prioritised fix list.
> https://github.com/thegreatola/launch-audit

</details>

## Research

An agent that checks a website against a 25-point launch checklist in real Chrome, measuring what code can and handing the rest to Claude with screenshots.

For: Founders, developers and agencies about to launch a website, and Claude Code or Claude Desktop users who want an AI-assisted pre-launch review.. Problem: Launch checklists mix measurable items (meta tags, robots.txt, broken links, mobile overflow) with judgment calls (is the team photo real?). People skip the tedious ones. This tool runs the measurable ones automatically and flags the rest for an AI or a human to look at, without touching the live site.

15 facts verified against the files:

- **f1** It audits a site against a 25-point launch checklist before it goes live. (`README.md`: "An agent that checks a website against a 25-point launch checklist before it goes live.")
- **f2** It runs locally, needs no API key, and is read only. (`README.md`: "needs no API key, and is read only: it never clicks, types or submits forms.")
- **f3** Scoring: Improve counts half, and Look and N/A items are not graded. (`src/checks.ts`: "/** Warns count half. Review and n/a items don't count either way. */")
- **f4** Checks are pure functions over collected facts, so they are unit tested without a browser or network. (`README.md`: "Every check is a pure function of that data, so the whole checklist is tested with fixtures, without a browser or network.")
- **f5** A launch_review prompt in the MCP server runs the full audit-and-judge loop and ends with a fix list. (`README.md`: "The `launch_review` prompt runs that whole loop and ends with a prioritised fix list.")
- **f6** A bug found by the end-to-end test: measuring phone overflow against innerWidth always reports zero, so the collector compares against the requested 375 px. (`README.md`: "Measuring overflow against `innerWidth` therefore always reports zero.")
- **f7** Menu, search and close toggles are excluded from CTA detection so a site with only an Open menu button doesn't pass the sticky CTA check. (`README.md`: "counting "Open menu" as a sticky CTA would pass a site that has none.")
- **f8** Crawling is polite: respects robots.txt, one page at a time, default 8 pages, identifies as launch-audit. (`README.md`: "identifies itself as `launch-audit` in the user agent.")
- **f9** Form error states and thank-you pages are marked Look rather than tested, because testing would submit forms on a live site. (`README.md`: "because testing them means submitting forms on someone's live site.")
- **f10** The end-to-end test serves a small site with known problems from the test process, with no internet needed. (`README.md`: "The end-to-end test serves a small site from the test process (no internet) with known problems")
- **f11** The test suite has 16 check tests plus one end-to-end test in Chrome. (`README.md`: "npm test      # 16 check tests on fixtures + 1 end-to-end test in Chrome")
- **f12** The CLI has options for page limit, output dir, JSON output and a strict CI mode. (`README.md`: "Exit with code 1 if anything fails, for CI.")
- **f13** It detects soft 404s, where a missing page returns 200. (`src/checks.ts`: "A missing page returns 200 instead of 404 (a soft 404).")
- **f14** It flags og:image problems such as wrong size, and tells you to use 1200x630. (`src/checks.ts`: "use 1200×630 so it stays sharp.")
- **f15** It requires Node 22 and ships both a CLI and an MCP server binary. (`package.json`: ""launch-audit-mcp": "dist/mcp.js"")

## Agent runs

Each log is Claude Code stream-json, which agent-trace-viewer opens.

- researcher: 33.3 s, 47421 in / 4948 out, $0.1203, `logs/01-researcher.jsonl`
- writer-1: 11.5 s, 3567 in / 1601 out, $0.0259, `logs/02-writer-1.jsonl`
- writer-2: 8.2 s, 4676 in / 1223 out, $0.0265, `logs/03-writer-2.jsonl`
- critic-2: 12.1 s, 3924 in / 1411 out, $0.0253, `logs/04-critic-2.jsonl`
- writer-3: 11.9 s, 5118 in / 1701 out, $0.0331, `logs/05-writer-3.jsonl`
- critic-3: 10.0 s, 3879 in / 1155 out, $0.0226, `logs/06-critic-3.jsonl`
