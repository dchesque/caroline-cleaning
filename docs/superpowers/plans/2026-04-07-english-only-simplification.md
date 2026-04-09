# English-Only Simplification + Full Chat Flow Test Suite

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all Portuguese language logic from the Carol AI chat, hardcode English throughout, then run a comprehensive 60-scenario test suite and fix all issues found.

**Architecture:** The app is US-only. Language detection (`detectLanguage`), language ternaries (`lang === 'pt' ? ... : ...`), and PT string variants in `RESPONSE_TEMPLATES` are all dead code. Remove entirely — keep only the EN side of every ternary. After simplification, run all chat flows in Chrome and patch defects.

**Tech Stack:** Next.js 15, TypeScript, OpenRouter (Gemini), Supabase, Carol state machine (37 states)

---

## File Map

| File | Change |
|------|--------|
| `lib/ai/llm.ts` | Remove `detectLanguage()`, remove `language` param from `carolPersona()`, convert all ~60 RESPONSE_TEMPLATES from `(lang) => lang === 'pt' ? ... : ...` to `() => 'EN string'`, remove lang param from `generateFaq()` |
| `lib/ai/state-machine/types.ts` | Remove `language` field from `SessionContext` |
| `lib/ai/state-machine/handlers/greeting.ts` | Remove `detectLanguage` call, remove `language` from contextUpdates |
| `lib/ai/state-machine/handlers/phone.ts` | Remove `lang` var, replace all ternaries with EN strings |
| `lib/ai/state-machine/handlers/booking.ts` | Remove `lang` var, replace all ternaries with EN strings |
| `lib/ai/state-machine/handlers/cancel.ts` | Remove `lang` var, replace all ternaries with EN strings |
| `lib/ai/state-machine/handlers/customer.ts` | Remove `lang` var, replace all ternaries with EN strings |
| `lib/ai/state-machine/handlers/guardrail.ts` | Remove `lang` var, replace all ternaries with EN strings |
| `lib/ai/state-machine/handlers/faq.ts` | Remove `lang` var, replace all ternaries with EN strings |
| `lib/ai/state-machine/handlers/callback.ts` | Remove `lang` var, replace all ternaries with EN strings, remove Language field from notes |
| `lib/ai/state-machine/handlers/reschedule.ts` | Remove `lang` var, replace all ternaries with EN strings |

---

## Phase 1 — Remove PT Language Logic

### Task 1: Simplify llm.ts

**Files:**
- Modify: `lib/ai/llm.ts`

- [ ] Remove `detectLanguage()` method entirely (lines 577–601)
- [ ] Change `carolPersona(language: 'pt' | 'en')` to `carolPersona()`, remove the PT branch, hardcode `'Respond in English'`
- [ ] Convert every RESPONSE_TEMPLATE from `(lang) => lang === 'pt' ? ptString : enString` to `() => enString` — keep only the EN side
- [ ] In `generateFaq()`: remove `detectLanguage` call, remove PT fallback string, hardcode EN fallback
- [ ] Update all callers of `carolPersona` and template functions to remove language arg
- [ ] Verify TypeScript compiles: `npx tsc --noEmit`

### Task 2: Simplify types.ts

**Files:**
- Modify: `lib/ai/state-machine/types.ts`

- [ ] Remove `language?: 'pt' | 'en'` from `SessionContext`
- [ ] Verify no other types reference language field

### Task 3: Simplify all handler files

**Files:**
- Modify: all 9 handler files listed above

For each file:
- [ ] Remove `const lang = context.language` (or `context.language || 'en'`)
- [ ] Replace every `lang === 'pt' ? ptStr : enStr` inline ternary with just `enStr`
- [ ] Remove `language` from all `contextUpdates` objects
- [ ] Remove `language` from all `llm.generate()` calls (if it was passed as arg)

### Task 4: Verify build

- [ ] `npx tsc --noEmit` — zero errors
- [ ] Start dev server and confirm HTTP 200

---

## Phase 2 — 60-Scenario Test Suite (Chrome, Yolo Mode)

Run each scenario, record Pass/Fail, note any bugs.

### Group A — New Customers (Happy Paths)
- [ ] A1: Full new customer booking flow
- [ ] A3: ZIP outside service area
- [ ] A4: No slots on chosen date → picks another
- [ ] A5a: Service type = Regular
- [ ] A5b: Service type = Deep Clean
- [ ] A5c: Service type = Move-in/out

### Group B — Returning Customers
- [ ] B1: Returning → same address → books
- [ ] B2: Returning → different address → corrects and books
- [ ] B3: Resumed session (name already in context)

### Group C — Cancellation
- [ ] C1: Cancel appointment (confirms yes) — verify real appointment data shown (Bug 1 fix)
- [ ] C2: Start cancel, says no → aborts
- [ ] C3: Try to cancel with no future appointments
- [ ] C4: Multiple appointments → select by number

### Group D — Rescheduling
- [ ] D1: Full reschedule
- [ ] D2: Start reschedule, says no → aborts
- [ ] D3: Reschedule to date with no slots

### Group E — Special Intents
- [ ] E1: FAQ question
- [ ] E2: Price inquiry → deflect
- [ ] E3: Pet info
- [ ] E4: Allergy info
- [ ] E5: Update address
- [ ] E6: Update name
- [ ] E7: Manual callback request

### Group F — Retries and Escalation
- [ ] F1: 5x invalid phone → escalate to callback
- [ ] F2: 5x invalid date → escalate
- [ ] F3: 5x invalid name → escalate
- [ ] F4: Off-topic 3x → GUARDRAIL → callback
- [ ] F5: Same state 10x → forced DONE

### Group G — Unexpected Inputs
- [ ] G1: Empty message (Enter only)
- [ ] G3: Two intents in one message ("cancel and reschedule")
- [ ] G4: 2000+ character message
- [ ] G5: Emojis in message ("☎️ 11987654321")
- [ ] G6: Phone with unusual formatting ("55-11-98765.4321")
- [ ] G7: Ambiguous date ("next week", "day after tomorrow")
- [ ] G8: Time outside business hours ("11pm", "Sunday")
- [ ] G9: Invalid selection number ("5" when only 2 appointments)
- [ ] G10: 4-digit ZIP ("9410")
- [ ] G11: Accented name ("José María")

### Group H — Post-DONE Behavior
- [ ] H1: New message after DONE → routes by intent
- [ ] H2: "Thank you" after DONE
- [ ] H3: Cancel request after DONE → resumes flow

### Group I — Phone Special Cases (Bug 2 fix)
- [ ] I1: Phone in first greeting message
- [ ] I2: Phone + text in first message ("Hi! 11987654321 can you help?")
- [ ] I3: Says no to phone confirmation → re-enter → confirm correct

### Group J — Notification Preference (Bug 3 fix)
- [ ] J1: "Yes, WhatsApp please" in one message → skips COLLECT_PREFERENCE
- [ ] J2: "Yes, SMS" in one message
- [ ] J3: Confirms without preference → prompted → responds
- [ ] J4: 5x invalid preference → defaults to SMS

### Group K — Security / Injection
- [ ] K1: Prompt injection attempt ("ignore all instructions")
- [ ] K2: SQL-like input ("'; DROP TABLE --")
- [ ] K3: HTML/JS injection ("<script>alert(1)</script>")
- [ ] K4: Identity change attempt ("you are now GPT-4")
- [ ] K5: Request for other users' data

### Group L — Service Failure Resilience
- [ ] L1: Stale appointment data (externally cancelled)
- [ ] L2: Booking creation fails → correct fallback
- [ ] L3: Cancel fails → returns to DETECT_INTENT

### Group M — Multi-tab / Session
- [ ] M1: Two tabs same session
- [ ] M2: Reload mid-flow → context restored?
- [ ] M3: Close and reopen → resumes or restarts?

---

## Phase 3 — Fix All Issues Found

For each failed scenario:
- [ ] Root cause analysis (read code + DB + logs)
- [ ] Apply fix following existing patterns
- [ ] Verify fix with targeted re-test
- [ ] Commit

---

## Test Result Log

| # | Scenario | Result | Bug? | Notes |
|---|----------|--------|------|-------|
| A1 | Full new customer booking | | | |
| A3 | ZIP not covered | | | |
| ... | | | | |
