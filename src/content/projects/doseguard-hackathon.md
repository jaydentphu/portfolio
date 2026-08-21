---
title: "DoseGuard"
summary: "An AI verification layer that catches medication-translation errors invisible to standard translation tools — independent back-translation checks, semantic drift detection, and a dedicated diacritic validator for Yoruba, where one dropped accent mark can silently double a dose."
status: "hackathon prototype"
period: "24 hours · SoCal Claude Builder Club Hackathon · team of 4"
order: 2
tags: ["claude", "nextjs", "typescript", "react", "tailwind"]
builtWith:
  - name: "Semantic drift detection"
    note: "canonicalization layer that normalizes translated text before comparison, so phrasing differences don't bury real errors in false positives"
  - name: "Yoruba diacritic validator"
    note: "an independent safety check against a 22-term checklist — catches tonal-mark errors a correct back-translation can't reveal"
  - name: "Claude Haiku back-translation gate"
    note: "an independent model instance re-translates to the source language with no memory of the original, to verify clinical meaning survived"
  - name: "Next.js + React frontend"
    note: "streams progress through the pipeline's seven stages in real time instead of a blocking spinner"
repo: "https://github.com/AK20202007/ClaudeHackathon/tree/main"
---

## the problem

Medication mistranslation kills people. The WHO estimates medication errors harm 1.3
million people a year in high-income countries alone, where translation infrastructure
is strong — for the hundreds of millions of patients receiving care in a language they
don't speak fluently, the risk is worse and mostly unmeasured.

The failure is sharpest in tonal, low-resource languages. Yoruba, spoken by over 50
million people, carries meaning through diacritics — small accent marks that a generic
translation model routinely drops or misreads. A missing sub-dot can silently turn
"three tablets" into "six." No error message, no warning, just a doubled dose. There's
currently no systematic safety layer between a translated discharge instruction and the
patient who has to act on it at home.

## the approach

DoseGuard isn't a consumer app — it's a verification layer for the clinicians and
health workers responsible for that handoff (full write-up on
[Devpost](https://devpost.com/software/doseguard)). It takes a medication label or
discharge instruction, runs it through a multi-stage safety pipeline, and outputs a
risk score with a plain-language explanation of what to double-check before trusting
the translation. The core rule: never trust a single model's word for it — every
safety-critical claim gets checked against an independent source.

A teammate built the OCR ingestion layer (a four-engine ensemble across Mistral,
EasyOCR, RapidOCR, and Tesseract). My work covered the four stages downstream of it:

- **Semantic extraction and drift analysis.** Instructions get broken into structured
  fields — drug name, dose, frequency, route, duration, warnings. I built the
  canonicalization layer that normalizes original and translated text before comparing
  them, since a naive string diff flags noise instead of danger: "14 days" and
  "fourteen days" needed to collapse to the same value. Without that step, real errors
  would have been buried under false positives within the first few test runs — which
  would have killed clinician trust in the tool immediately.
- **Diacritic validation for Yoruba.** The piece I'm most proud of, because it's a
  failure mode back-translation structurally cannot catch — a translation can
  back-translate perfectly in meaning while the tonal marks are still wrong, and wrong
  tonal marks in Yoruba can flip a clinical instruction with no visible error in the
  English round-trip. This validator runs independent of the back-translation pipeline,
  checking safety-critical terms like *gbe* (swallow) and *lọ* (grind) against a
  22-entry checklist of numerals, frequency words, and clinical terms — and can flag a
  translation the rest of the pipeline already cleared.
- **Claude Haiku back-translation gate.** Every translated instruction gets
  independently converted back into the source language by a separate model instance
  that never sees the original. If the round-trip preserves clinical meaning, nothing
  gets flagged; if it doesn't, the instruction is marked unsafe. The real engineering
  constraint was the prompt: a model's first instinct is to "improve" a rough
  translation on the way back, which defeats the entire point. I had to explicitly
  instruct it to act as a faithful mirror, not a polished re-render, and verify that
  behavior held across varied medical phrasing before trusting it as a safety gate
  rather than a suggestion.
- **Frontend and streaming UX.** The pipeline runs seven sequential steps, some of them
  multi-second API calls. I built the interface in Next.js, React, and Tailwind to
  stream progress through each stage in real time — a 7-step AI pipeline with no
  visibility into what's happening reads as broken even when it's working.

## what was hard

Back-translation only works if you fight the model's instincts. The default behavior of
a translation model asked to translate back into the source language is to smooth over
rough edges — useful most of the time, dangerous here, since a smoothed-over
back-translation hides exactly the drift the gate exists to catch. Getting the prompt
right — telling the model explicitly not to improve anything — was a bigger unlock than
any of the deterministic logic in the pipeline.

Small models turned out underrated for narrow, binary judgment calls. I expected to
need a larger model or a large rule set to check semantic equivalence reliably; Haiku
handled it well once scoped to a yes/no equivalence question, and it generalized across
paraphrasing patterns a regex-based approach would have missed entirely.

Tonal orthography is a distinct risk category, not a subset of translation risk.
Building the diacritic layer forced me to stop treating "translation is correct" and
"translation is safe to read aloud or on paper" as the same claim — they aren't. That's
why the diacritic validator runs independent of everything else instead of as
post-processing on the back-translation output.

## results & takeaways

In 24 hours, the four stages I owned shipped as a working, independently-checked safety
pipeline: canonicalized drift detection, a Yoruba diacritic validator running in
parallel with everything else, a back-translation gate that actually resists a model's
urge to "fix" the translation it's supposed to be verifying, and a frontend that makes
a 7-step AI pipeline feel transparent instead of broken.

Given more than 24 hours, the next steps are clear: extend diacritic validation to
other tonal orthographies (Vietnamese, Thai, Hausa), add an offline/low-bandwidth mode
since the clinics that need this most often have the worst connectivity, build a
clinician-facing dashboard aggregating drift patterns across a language pair over time,
and replace the 22-entry Yoruba checklist with one sourced from real linguistic
resources like MENYO-20k instead of a hackathon-scoped list.

We didn't place in this hackathon. That's fine — the interesting problem was never the
leaderboard, it was figuring out how to catch an error class that most translation
tooling doesn't even know exists, in a language the industry has largely ignored.
