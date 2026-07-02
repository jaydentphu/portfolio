---
title: "Notion CRM Migration"
summary: "Restructured a dental-practice brokerage's multi-database Notion CRM — normalized fragile rollups into editable fields and migrated 98 legacy records without data loss, then automated intake with Make.com."
status: "in production"
period: "2026 · MDBL internship"
order: 2
tags: ["data-modeling", "notion", "make.com", "automation"]
builtWith:
  - name: "Notion"
    note: "relational databases, rollups, and views modeling the deal pipeline end to end"
  - name: "Data modeling"
    note: "schema redesign — one source of truth per entity, relations instead of duplicated fields"
  - name: "Make.com"
    note: "automation scenarios handling record intake and cross-database status updates"
  - name: "Migration process"
    note: "staged, field-by-field validated migration of legacy records — zero data loss"
---

<!-- TODO(jayden): PRD open question #3 — confirm with Laurent which MDBL
     internals can be shown publicly. This write-up is already genericized
     (no client data, no internal field names) but get a sign-off before launch.
     Also verify the details below match what you actually did. -->

## the context

MDBL is a dental practice brokerage — they connect dentists selling their
practices with buyers, and every deal moves through a long pipeline of
contacts, listings, and negotiations. Their CRM lives in Notion, spread
across multiple related databases. It grew organically, and by the time I
joined as an intern it was showing the strain.

## the problem

The core issue was that **key pipeline fields were computed rollups**.
Rollups in Notion are read-only: they aggregate values across a relation, and
when the underlying relation is wrong — or the business reality doesn't match
what the formula assumes — nobody can just fix the record. The team was
working around the schema instead of with it.

On top of that, years of legacy records had accumulated in inconsistent
formats: duplicated fields across databases, half-filled relations, and
records that predated the current structure entirely. The data everyone
depended on was exactly the data nobody trusted.

## the approach

I started with an audit rather than a redesign: for every field in every
database, who writes it, who reads it, and does it ever need a manual
override? That question — *does this ever need a human to correct it?* —
became the dividing line. Fields that were genuinely derived stayed computed;
fields the business needed to own became **plain editable properties, seeded
from the old rollup values** so no information was lost in the conversion.

The migration itself ran in stages. Each batch of legacy records was mapped
to the new schema, migrated, then validated field-by-field against the
original before the old structure was retired. **All 98 legacy records made
it across with zero data loss.**

With the schema stable, I moved the repetitive work into **Make.com
scenarios**: new-record intake, cross-database status updates, and the small
sync jobs that people had been doing by hand between databases.

## results

- The team edits pipeline fields directly instead of filing schema workarounds
- One source of truth per entity — relations replaced duplicated fields
- 98 legacy records migrated and validated, none lost
- Routine intake and status updates run automatically through Make.com

The bigger lesson: the hard part of internal tooling isn't the tool. It's
sitting with the people who use it long enough to understand which parts of
the "messy" data are mistakes — and which parts are the business telling you
your schema is wrong.
