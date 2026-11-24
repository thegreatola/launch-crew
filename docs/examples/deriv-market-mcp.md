# Launch crew: deriv-market-mcp

Waiting for your approval. Nothing has been posted.

Repo https://github.com/thegreatola/deriv-market-mcp at 3cab2e5. Model sonnet. Started 2026-11-24T14:10:31.669Z.
3 agent runs, 39 s, $0.123 at API prices.

## Final draft

**Post** (208/280, facts f9, f1)

> Ask Deriv for six daily gold candles over a weekend and you get five. An agent eval caught it. I fixed it in a read-only MCP server that gives agents live market data with no API key.
> 
> https://github.com/thegreatola/deriv-market-mcp

**Thread 1/7** (188/280, facts f1, f2)

> I wanted an AI agent to check live market data without accounts, keys, or any chance of placing a trade. So I built an MCP server that is read only and needs no API key. It has five tools.

**Thread 2/7** (235/280, facts f2, f3, f4)

> The tools: list_markets, get_price, get_prices, get_candles, get_trading_hours. Symbols can be Deriv codes like frxEURUSD or names like EUR/USD. get_prices takes up to 10 symbols, and a bad one lands in errors without failing the rest.

**Thread 3/7** (200/280, facts f9)

> An agent eval found a nasty bug. Deriv's count is a time span, so over a weekend six daily gold candles come back as five. The server now widens the window, up to twice, to get the bars you asked for.

**Thread 4/7** (154/280, facts f8)

> Related: Deriv cuts the window mid-period, so the oldest candle can be partial. The server drops it, so the agent never compares a half day to a full one.

**Thread 5/7** (243/280, facts f5, f6, f12)

> It never retries. Deriv rate-limits by IP, so a retry ladder keeps you throttled. Requests go through one paced socket, 500 ms apart by default. An empty reply is treated as a possible rate limit, so the agent doesn't decide a market vanished.

**Thread 6/7** (219/280, facts f7, f10)

> Another gotcha: the subscribing ticks call fails with "already subscribed" on a second read of the same symbol. get_price uses ticks_history instead. Trading hours are cached for an hour, the symbol list for 10 minutes.

**Thread 7/7** (237/280, facts f15, f16)

> To try it, you need Node 22+. Clone, build, then run: claude mcp add deriv-market -- node /absolute/path/to/deriv-market-mcp/dist/index.js
> 
> Weekly and monthly candles aren't served, so build them from daily bars.
> 
> https://github.com/thegreatola/deriv-market-mcp

## Rounds

### Round 1: approved by the critic


What works: The post opens on a concrete bug (six daily gold candles come back as five), and the thread builds on it with real design decisions (no retries, paced socket, dropped partial candle, the ticks_history workaround). Every claim traces to the quoted facts, it sounds like the builder, and it ends on one clear install step with the link.

## Research

A read-only MCP server that gives AI agents live market data (prices, OHLC candles, market lists, trading hours) from Deriv's public feed, with no API key.

For: Developers and AI-agent users (Claude Code, Claude Desktop, any MCP client) who want an agent to look up forex, indices, commodities, crypto and synthetic-index data.. Problem: Agents need live, structured market data without accounts, keys or any risk of placing trades. Deriv's public feed is rate limited by IP and has quirks (partial first candles, short windows over weekends, empty replies under load). This server handles those so agents get clean results.

16 facts verified against the files:

- **f1** It is read only and needs no account or API key. (`README.md`: "It is read only. It cannot place trades, and it needs no account or API key.")
- **f2** Five tools: list_markets, get_price, get_prices, get_candles, get_trading_hours. (`README.md`: "| `get_trading_hours` | Today's open and close times, trading days, and upcoming holidays or early closes. |")
- **f3** get_prices takes up to 10 symbols, and a bad symbol is reported in errors without failing the rest. (`README.md`: "A bad symbol is reported in `errors` and does not fail the rest.")
- **f4** Symbols can be given as Deriv codes or human names. (`README.md`: "Symbols can be given as Deriv codes (`frxEURUSD`, `R_75`, `cryBTCUSD`) or by name (`EUR/USD`, `eurusd`, `Volatility 75 Index`).")
- **f5** The server never retries on its own, because the rate limit is per IP and retries keep the address throttled. (`README.md`: "**One paced socket, no retry ladder.** Deriv rate-limits its public feed by client IP address, not by connection.")
- **f6** Empty replies are treated as a possible rate limit, so agents don't conclude a market vanished. (`README.md`: "**An empty reply is treated as a possible rate limit.**")
- **f7** get_price uses ticks_history rather than the subscribing ticks call, which fails with 'already subscribed' on a second read. (`README.md`: "A second read of the same symbol on that socket then fails with "already subscribed"")
- **f8** Partial oldest candles are dropped because Deriv cuts the window mid-period. (`README.md`: "**The oldest candle is dropped when it is partial.**")
- **f9** Deriv's count is a time span, so weekends yield fewer bars; the server widens the window up to twice. An agent eval found this bug. (`README.md`: "six daily gold candles come back as five")
- **f10** Caching: symbol list 10 minutes, trading hours an hour, price one second. (`README.md`: "The symbol list is cached for 10 minutes, trading hours for an hour, and a price for one second.")
- **f11** 19 offline tests run against a fake socket with no network; CI runs on Node 22 and 24. (`README.md`: "npm test          # 19 offline tests against a fake socket, no network")
- **f12** Default pacing is 500 ms between requests, configurable via DERIV_MIN_INTERVAL_MS. (`README.md`: "| `DERIV_MIN_INTERVAL_MS` | `500` | Minimum gap between two requests to Deriv. |")
- **f13** Invalid pacing env values fall back to 500 instead of silently disabling pacing. (`src/deriv.ts`: "A bad value (e.g. "abc" -> NaN) would silently turn pacing off, so fall back to 500.")
- **f14** Every tool is annotated read-only and idempotent. (`src/tools.ts`: "readOnlyHint: true,")
- **f15** Install: Claude Code one-liner after clone and build; requires Node 22+. (`README.md`: "claude mcp add deriv-market -- node /absolute/path/to/deriv-market-mcp/dist/index.js")
- **f16** Known limits: weekly and monthly candles are not served. (`README.md`: "Weekly and monthly candles are not served; build them from daily bars.")

## Agent runs

Each log is Claude Code stream-json, which agent-trace-viewer opens.

- researcher: 20.9 s, 37752 in / 2817 out, $0.0780, `logs/01-researcher.jsonl`
- writer-1: 11.3 s, 3777 in / 1512 out, $0.0258, `logs/02-writer-1.jsonl`
- critic-1: 7.2 s, 4040 in / 737 out, $0.0190, `logs/03-critic-1.jsonl`
