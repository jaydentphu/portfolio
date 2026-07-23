---
title: "Fade"
summary: "A Telegram-native trading bot for Polymarket prediction markets — solo trading, per-user non-custodial wallets, and a social layer where friends copy or fade each other's trades with one tap."
status: "code-complete · pre-launch"
period: "2026 · personal project"
order: 0
tags: ["python", "telegram", "asyncio", "polymarket", "sqlalchemy", "postgres"]
builtWith:
  - name: "Python + python-telegram-bot"
    note: "async handlers for a bot whose only UI is chat messages, inline keyboards, and DMs"
  - name: "Polymarket's builder SDK"
    note: "authenticated CLOB trading, market orders with a slippage guard, and tamper-proof builder-fee attribution on every order"
  - name: "Per-user deposit wallets"
    note: "each user gets their own on-chain wallet; the backend holds trade-scoped signing power only, never withdrawal authority"
  - name: "SQLAlchemy + Postgres"
    note: "users, positions, leaderboards, clan state, and an idempotency ledger that survives restarts"
# TODO: add the real repo URL and a demo clip/screenshot of a live Fade broadcast card
repo: "https://github.com/jaydentphu/fade"
---

<!-- TODO(jayden): verify every claim below against docs/HANDOFF.md before publishing,
     swap in real deployment numbers once Stage 0 (first real user) happens, and
     uncomment the repo link above. -->

## the problem

Polymarket prediction markets are inherently social. People already argue about
elections and rate decisions in group chats; what's missing is a way to put money
behind the argument without leaving the conversation. Two bots pointed at pieces of
this: Polycule let people trade Polymarket from Telegram, and pvp.trade made trading
competitive by letting a group copy or counter-trade each other's positions. Neither
existed for Polymarket in the pvp.trade style, and the incumbent had a bigger problem —
Polycule was hacked for roughly $230K in January 2026 because it held user private
keys on a central server. That's the gap Fade is built to fill: Polymarket trading,
from Telegram, built social-first, with a custody model that doesn't repeat that
mistake.

The constraint that shaped everything else: this had to be buildable and maintainable
by one person, for free, using infrastructure that already existed rather than
reinventing exchange plumbing.

## the approach

The product's whole interaction model is a chat message with buttons under it, so the
architecture is organized around who's allowed to see what, not just what the code
does:

- **Wallets are DM-only, always.** Every command that touches an address or a balance
  redirects a group invocation straight to DM, and it's enforced at the handler level,
  not by convention.
- **The signing module is the only code that touches key material.** No other module
  can import it except through its own interface, so a bug anywhere else in the bot
  can't leak a key.
- **Every trade is an idempotent, builder-attributed order.** Each order carries a
  client-generated key so a retried Telegram webhook update can never place the same
  trade twice, and every order carries Fade's builder code so Polymarket computes and
  pays the trading fee automatically, no custom fee logic anywhere in the codebase.
- **The social layer is broadcast, not polling.** When someone trades in a group, the
  bot posts a trade card with **Fade** and **Copy** buttons underneath it. One tap
  either takes the opposite side of the market or mirrors it, and the reply posts back
  to the same thread so the rivalry stays visible.
- **Clans compete on realized PnL**, weekly and all-time, with a Sunday-evening league
  across every registered group.

Custody turned out to be the decision that mattered most. The plan (worked out before
writing any code, see `docs/DECISIONS.md`) was the pvp.trade pattern adapted to
Polymarket: each user's funds live in their own on-chain wallet, and the backend only
ever holds trade-scoped signing power that can place or cancel orders, never move
funds to an arbitrary address. A full compromise of the app server should mean an
attacker can make bad trades with someone's money, not steal it.

## what was hard

The interesting problems weren't the trading logic, they were everything the SDK
didn't tell me in advance.

**The library I planned around didn't exist by the time I started building.** The
PRD's spike phase discovered `py-clob-client` had been archived in favor of a newer,
still-beta official SDK with a different auth model and a genuinely different order
structure (builder attribution moved from an HTTP header into a signed field of the
order itself). Finding that out in week one instead of week six is the entire reason
to run a throwaway spike before writing real code.

**"Deposit a Safe" wasn't the real custody model.** Polymarket's deposit wallets don't
hold USDC directly, they hold Polymarket's own collateral token, and getting money in
or out is a two-step bridge request, not a single transfer. The PRD's original mental
model was one generation out of date by the time the spike ran it against live
infrastructure, and the fix (a bridge-based deposit/withdraw flow) turned out to
double as free cross-chain deposits, since the bridge accepts assets from other chains
too.

**Brand-new users have no existing on-chain wallet to trade from**, which meant the
very first `/start` for a real user had to auto-deploy a wallet on the spot through a
gasless relayer, a flow that only reveals its missing pieces (a specific relayer
credential, not the trading credential) when you actually try it end to end with a
fresh account instead of an existing Polymarket login.

**Everything downstream of "give a stranger's money to a bot" needed its own rail.**
Beyond basic trading: a first-time withdrawal address gets a cooldown and an immediate
security-notice DM, so a hijacked Telegram session can't drain a wallet in the seconds
before the real owner notices; a per-user daily trade-volume cap and an anomaly-alert
threshold cap the blast radius of a bug or a compromised account without ever
restricting withdrawals, which stay live no matter what; and a kill switch can freeze
all new trading instantly while leaving read access and withdrawals untouched.

## results & takeaways

The full PRD scope is implemented and passing its own test suite — solo trading,
deposits and withdrawals, group broadcasting with one-tap Copy/Fade, weekly clan
leaderboards and a cross-clan league, resolution notifications with shareable "called
it" flex-card images, head-to-head challenges, and an admin kill switch — plus several
hardening passes that went beyond the original spec: withdrawal-address cooldowns,
input sanitization against malformed Telegram data, background-job crash resilience,
and error reporting that pages the admin directly. All of it currently runs against
mocked Telegram and exchange calls; no test hits a live network, which was a
deliberate rule from day one.

The honest gap, and the obvious next step: no real second person has used it yet. A
codebase can prove its own logic is internally consistent; it can't prove a bot is fun
to lose money to your friend on. The next milestone isn't a feature, it's putting this
in front of one real group chat and finding out what the tests couldn't tell me.
