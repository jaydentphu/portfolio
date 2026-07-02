---
title: "Kalshi Trading Bot"
summary: "An async Python trading system that streams live prediction-market data over WebSocket and manages simulated positions against Kalshi's sandbox — with a FastAPI control layer and SQLite-backed state."
status: "live · sandbox"
period: "2026 · personal project"
order: 1
tags: ["asyncio", "fastapi", "websockets", "sqlite"]
builtWith:
  - name: "Python + asyncio"
    note: "one event loop coordinating market streams, strategy evaluation, and order flow concurrently"
  - name: "WebSockets"
    note: "persistent connection to Kalshi's market feed with automatic reconnect and resubscribe"
  - name: "FastAPI"
    note: "REST control layer for inspecting positions and monitoring the bot while it runs"
  - name: "SQLite"
    note: "durable store for orders, fills, and position history — persistence that survives restarts"
# TODO: add the real repo URL (and a demo/walkthrough link if one exists — see PRD open question #2)
# repo: "https://github.com/CHANGEME/kalshi-trading-bot"
---

<!-- TODO(jayden): verify every claim below against the actual project, add real
     numbers where you have them (markets tracked, uptime, simulated P&L), and
     uncomment the repo link in the frontmatter above. -->

## the problem

Kalshi is a regulated prediction market — you trade yes/no contracts on
real-world events, and prices move the moment news does. Trading it by hand
means watching order books all day. I wanted to know what it actually takes to
trade it programmatically: consume live market data, react in milliseconds,
and keep positions consistent even when the network or the API misbehaves.

Kalshi's sandbox environment made this a safe problem to take seriously. Real
API, real market mechanics, simulated money — so the engineering challenges
are authentic without the financial risk.

## the approach

The design principle was **separation of concerns under one event loop**.
Everything runs as cooperating asyncio tasks:

- A **market data client** holds a WebSocket connection to Kalshi's feed and
  subscribes to order book and ticker updates for the markets I care about.
  It normalizes raw messages into typed events before anything else sees them.
- A **strategy module** consumes those events and emits order intents. It
  never talks to the exchange directly, which keeps strategies small and
  testable against recorded market data.
- An **execution module** turns intents into API calls, with rate limiting
  and client-generated order IDs so a retried request can never place the
  same order twice.
- A **FastAPI layer** exposes the running bot over REST: current positions,
  open orders, and P&L, plus endpoints to pause or resume trading without
  killing the process.
- **SQLite** records every order, fill, and position snapshot. It's
  zero-ops persistence — the whole system restarts cleanly and reconciles
  its local state against the exchange on boot.

## what was hard

The interesting bugs were all about **failure, not strategy**. WebSocket
connections drop silently; the reconnect path has to re-authenticate,
resubscribe, and reconcile any fills that happened during the gap. Exponential
backoff, idempotent order placement, and treating the exchange — not local
memory — as the source of truth for positions ended up being most of the
real engineering.

## results & takeaways

The bot runs unattended against the sandbox: streaming live markets, placing
simulated orders end to end, and surviving restarts and disconnects with its
position state intact. More than any single feature, the project taught me how
to design for the unhappy path — the version of the system that only worked
when everything went right was maybe 20% of the final code.
