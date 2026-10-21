---
title: "Paper Hands"
summary: "An experiment that tests whether an LLM research agent can beat a rule-based screener and plain cash at picking options trades. A paper-trading harness with a read-only data gateway, deterministic risk rules, and a React dashboard."
status: "phase 1 complete · results pending"
period: "2026 · personal project"
order: 1
tags: ["python", "fastapi", "postgres", "docker", "react", "typescript", "mcp", "claude-api"]
builtWith:
  - name: "Python + FastAPI"
    note: "a scheduled worker that runs the daily pipeline, and a read-only API that feeds the dashboard"
  - name: "Robinhood Trading MCP"
    note: "live quotes, option chains, earnings dates, and headlines over an OAuth session that renews itself"
  - name: "Anthropic API (claude-sonnet-5)"
    note: "one structured trade hypothesis per ticker per day, validated against a schema before anything else touches it"
  - name: "PostgreSQL + SQLAlchemy + Alembic"
    note: "9 tables with reversible migrations, and money stored as NUMERIC(12,4) and handled as Decimal end to end"
  - name: "Docker Compose + GitHub Actions"
    note: "four services and six CI jobs, one of them dedicated to the safety boundary"
  - name: "React + TypeScript"
    note: "a four-view dashboard built in strict mode"
  - name: "pytest, ruff, mypy --strict"
    note: "154 tests"
repo: "https://github.com/jaydentphu/paperhands"
---

## the problem

I wanted AI to help me trade options, but I had only ever swing traded, and Robinhood has no paper trading mode. Option contracts cost real money, so the only way to test an idea was to put a few thousand dollars behind it. Most "AI trading bot" projects get around that by showing a backtest, which says very little about how a model behaves on days it has never seen.

So I turned the question around. Instead of building a bot and hoping it makes money, I built an experiment that asks whether an LLM research agent adds anything over a simple rule and over doing nothing, scored on live data going forward. A negative result counts as a result. The second constraint shaped the architecture more than the first. The broker connection I was using could place real orders, so the system had to be built so that the agent could not.

## the approach

The whole codebase follows one rule. The LLM handles judgment calls, and deterministic code handles everything that has to be right.

- **Three cohorts see the same data on the same day.** Cash does nothing and is the benchmark. A screener built on 20-day return and RSI thresholds is the control. The agent is the hypothesis. Each makes one decision per ticker per day across a 5-ticker watchlist.
- **The agent argues a direction and nothing else.** It returns a long call, long put, or no-trade idea with a thesis, evidence for, evidence against, a confidence score, and an invalidation condition. It never computes P&L, max loss, or liquidity, and any output containing a number other than its own confidence is rejected and logged.
- **Code decides what is allowed.** Every contract is checked against days to expiry, bid/ask spread, open interest, and a premium cap before the agent sees it, and a validator rejects any pick that is not on that eligible list.
- **Fills are deliberately pessimistic.** Simulated buys fill at the ask, marks and closes happen at the bid, and a missing bid counts as zero. Positions close after 5 trading days, or 2 trading days before expiry if that comes first.
- **The agent cannot reach the broker's order tools.** Robinhood's token turned out to have full trading scope, so the safety boundary lives in my code, in two separate places, and CI checks it on every commit.

I planned it before I built it. A PRD, a set of engineering rules, and a stage-by-stage build plan came first, and then I built it in staged Claude Code loops, reading the diffs and the tests at every stage. The planning docs and a running NOTES.md of every decision and bug are in the repo.

![Paper Hands architecture. The top row shows the capability boundary from the Robinhood MCP down to the agent. The bottom row shows the daily pipeline from snapshot to dashboard.](/projects/paper-hands/paper-hands-architecture.svg)

## what was hard

**The credential could do more than the project was allowed to.** I tested the Robinhood connection first, in a throwaway script. Headless OAuth worked, and the token renewed itself for about 9 days at a time. It also came back with 73 tools, including every function that places, cancels, or exercises an order, and Robinhood offers no read-only scope. Nothing about the credential would protect me, so I built the boundary myself. The agent gets five bound functions and never sees the gateway or the adapter. The transport layer keeps its own separate list of seven read-only tool names. A dedicated CI job fails the build if either list changes, if order-placement strings show up in the agent code, or if the worker's environment declares anything with EXEC, TRADING, or AGENTIC in its name.

**A strategy bug that looked like a feature.** The screener picked the contract closest to a target expiry and then closest to the money, and because of that order it could quietly drift far out of the money to find something under the premium cap. I added a hard 2% moneyness limit so it returns no-trade instead of reaching. Around the same time I ran the strategy past a second model, which suggested letting code choose the direction and contract and having the agent only explain the result. I declined, because that would have turned the experiment into the screener compared with itself.

**Making the evaluator trustworthy.** Scoring whether the agent picked the right direction needs the underlying stock price at open and at close, and I had not stored either one. Rebuilding them later from snapshots would have been fragile, so positions now record both at fill and at close. I then wrote a synthetic month of trades for all three cohorts, worked every metric out by hand, and built a test that runs the real pipeline and has to match to the cent.

**Checks that pass while proving nothing.** If the Postgres service ever failed to start in CI, the integration tests would have skipped and the build would have stayed green, so CI now fails instead when Postgres is required and missing. The frontend container also reported healthy once while serving a page no browser could run, which taught me that a healthcheck shows a process is alive and nothing more.

## results & takeaways

The pipeline runs end to end on live data. The first full run captured 3,852 option contracts across 5 tickers in about a minute, produced 15 decisions, and opened one simulated position. There are 154 tests across 6 CI jobs with mypy in strict mode, and the safety boundary has a job of its own.

The experiment itself is still running. A position takes 5 trading days to mature and the evaluator only scores closed ones, so the scoreboard fills in over weeks. I will publish per-cohort hit rate, P&L, and drawdown here once there are enough closed positions to mean something, including if the agent loses to the screener. Everything the dashboard shows is simulated with conservative fills.

![The Today view, showing each strategy's decision for a ticker side by side with the validator's verdict.](/projects/paper-hands/today.png)

The honest gaps are that this is a personal tool with no other users and that it has never placed a real order. My own end-of-build review ranked the most likely bugs, and the top one is a scheduler that keeps its jobs in memory, so if the worker is down at 10:30 ET the whole day is skipped. That already cost me one run. Fixing it is next. Real money only enters the conversation after I have read a few weeks of scored results and built per-trade approval and loss limits that live in code.

![The Scoreboard view, comparing the three cohorts on hit rate, P&L, and drawdown. All figures are simulated with conservative fills.](/projects/paper-hands/scoreboard.png)
