# Lessons from wiring agent-skills into an autonomous loop

Reply draft for [addyosmani/agent-skills#97](https://github.com/addyosmani/agent-skills/issues/97) — what fought automation, and where boundaries went fuzzy under load. Grounded in production use on an 80+ agent platform and in the ASIL open-source extract.

---

## Draft reply (ready to paste)

@addyosmani Glad the write-up was useful — here is the gold you asked for. After running 14 skills + the 3 personas unsupervised at production scale, these are the places the skills fought the automation or a boundary went fuzzy.

### 1. Personas assumed a human merge step (biggest friction)

`agents/code-reviewer.md`, `security-auditor.md`, and `test-engineer.md` are excellent for human-in-the-loop review. Unattended, they over-reject.

- The code reviewer audited the *file*, not the *diff* — pre-existing issues in unchanged lines became blockers.
- The security auditor treated dead-code / unused-export cleanups as attack-surface changes.
- The test engineer demanded new tests for pure deletions and visibility tweaks.

**Fix that stuck:** a hard scoping preamble on every persona prompt — "review the DIFF only; pre-existing issues are out of scope; calibrate scrutiny to change risk." Same preamble on the adversarial (Codex) gate. Without it, trivial tasks never cleared the gate.

### 2. Section title mismatch silently dropped the anti-rationalization tables

Your skills title the table **Common Rationalizations**. Our executor originally looked for **Anti-Rationalization Table**. Under automation that meant the tables — the piece we called out as most important — were never injected into the enforcement block. Agents fell through to a generic one-liner fallback.

**Fix:** accept both headers. (Shipped in this repo's skill loader.)

### 3. Skill path / name layout was not automation-friendly

Submodule layout is `skills/<name>/SKILL.md`. Early ASIL expected `skills/<name>.md`, and several category/thinker names did not match upstream folders 1:1 (`security-review` vs `security-and-hardening`, `testing-strategy` / `test-coverage-improvement` vs `test-driven-development`, etc.). Missing files failed open into inline fallbacks — so the loop "worked" while ignoring the submodule.

**Fix:** resolve flat file → `SKILL.md` → alias chain, in that order.

### 4. Skills written for feature work fought cleanup categories

| Skill / persona | Fought when… |
|---|---|
| `test-driven-development` | Applied to dead-code / simplification — insisted on RED-GREEN for no behavior change |
| `security-and-hardening` | Applied to one-line visibility changes — invented auth concerns |
| `code-simplification` | Fine alone; combined with TDD persona → thrash on "simplify but also add tests" |
| `incremental-implementation` | Wanted thin slices; the scanner queued whole-file TODO clusters |

**Pattern:** skills encode *how a human should work a feature*. Autonomous categories are often *mechanical cleanup*. Mapping category → skill needs an explicit "no behavior change → skip TDD ceremony" delta, not just "load the skill."

### 5. Priority queues let one skill monopolize the run

Strict priority (`test-failure` → … → `documentation`) meant a noisy test suite starved security / type-error work for an entire grind. Round-robin across categories fixed starvation without abandoning severity ordering inside a category.

### 6. Scanner false-positives became skill false-confidence

Dead-code skill + shallow "no in-repo references" detection = the loop confidently proposed deleting public API surface from package entry points. The skill did its job; the *task* was wrong. We had to exempt entry points and put honest uncertainty in the task description before the skill ran.

### 7. What held up under load

- **Common Rationalizations / Red Flags** — once actually injected, they were the highest-leverage content. Unsupervised agents rationalize exactly the rows in those tables.
- **Fail-closed JSON** from personas and the adversarial gate (unparseable → reject).
- **Cost checkpoints around the review fan-out** — three personas + Codex after a fat executor call is where budgets die; force-check before the fan-out.
- **Domain-question markers** — the cleanest "skill stops here" boundary we found. Skills should say when to emit one instead of inventing domain logic.

Happy to go deeper on any of these. The reference implementation is [TelivityAI/asil](https://github.com/TelivityAI/asil); the skill-loader / rationalization fixes from this write-up live there too.

---

## Mapping: ASIL names → upstream skills

| ASIL category / thinker | Primary name | Upstream alias |
|---|---|---|
| vulnerability | `security-review` | `security-and-hardening` |
| test-failure / coverage-gap | `test-coverage-improvement` | `test-driven-development` |
| test-strategist thinker | `test-driven-development` | (`testing-strategy` still aliases) |
| security thinker | `security-and-hardening` | (`security-review` still aliases) |
| dead-code | `dead-code-removal` | `code-simplification` |
| dependency-update | `dependency-update` | `deprecation-and-migration` |
| documentation | `documentation-generation` | `documentation-and-adrs` |
| todo-resolution | `todo-resolution` | `incremental-implementation`, `debugging-and-error-recovery` |
| type-error / complexity | `code-simplification` | (exact match) |
| planner / spec-writer | `planning-and-task-breakdown` / `spec-driven-development` | (exact match) |

Resolution order for every name: `skills/<name>.md` → `skills/<name>/SKILL.md` → same for each alias.
