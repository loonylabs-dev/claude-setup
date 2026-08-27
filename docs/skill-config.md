# Skill placement and visibility

Where a skill lives decides **whether it loads at all**; how it is declared decides **what it
costs and who can start it**. The two are independent, and conflating them is what made the
2026-08-24 reshuffle go wrong before it went right.

This file is about placement and visibility only, and only about what was measured here. The
frontmatter fields themselves live at https://code.claude.com/docs/en/skills — linked rather
than copied, because a local copy of someone else's reference goes stale silently.

---

## 1. Placement — where a skill loads from

| Location | Loaded when |
|---|---|
| `~/.claude/skills/<name>/SKILL.md` | always, in every project |
| `<project>/.claude/skills/<name>/SKILL.md` | only when Claude Code was **started in that exact directory** |

**Parent directories are not searched.** Measured 2026-08-24: with six skills in
`<collector>/.claude/skills/`, a run started in `<collector>/` saw all six; a run started one
level down, in `<collector>/<repository>/`, saw none.

The trap this sets: a folder that groups repositories but is never itself a working directory
becomes a dead letterbox. Sessions start one level down, in the individual repositories — and a
skill placed in the collector is invisible from every one of them.

**Rule of thumb.** Put a skill in a project only when it is bound to *that* repository and that
repository is where sessions actually start — a skill that names one product in its own
description belongs in that product's repository. A skill that is a tool *across* projects belongs in
`~/.claude/skills/`, and its context cost is handled by visibility, not by placement. A third
case appeared later: a skill bound to a *framework* rather than a single repository — those live
in a plugin now (section 5), which is placement by a different route.

To check where sessions really start: `ls -1t ~/.claude/projects/` — one directory per working
directory, newest first.

---

## 2. Visibility — what a skill costs

A skill costs context as one line in the skill listing: its name plus its description. That
listing is capped — `skillListingBudgetFraction` defaults to 1% of the context window, and
descriptions are shortened automatically when the cap is hit. It cannot run away on its own.

Two independent switches control visibility:

### `disable-model-invocation: true` in the SKILL.md frontmatter

Owned by the skill. Removes it from the model listing entirely; `/name` still works. Costs
nothing. Use for skills that are always deliberately started by hand. **This is the switch to
reach for by default** — it travels with the skill, including into a plugin, where the other one
stops working (section 5).

### `skillOverrides` in `settings.json`

Owned by the configuration, keyed by skill name. Four levels:

| Value | In the model's listing | `/name` | Cost |
|---|---|---|---|
| *(absent)* | name **+ description** | yes | full |
| `name-only` | name only | yes | ~20 chars |
| `user-invocable-only` | not at all | yes | none |
| `off` | not at all | no | none |

Use this when the skill file should stay untouched — a shared skill, or one whose availability
should differ per project. **Not for plugin skills:** the keys are simply ignored there, see
section 5.

**`user-invocable-only` is stronger than "hidden".** It does not only drop the skill from the
listing; a model invocation is *refused with an error*, not quietly skipped. For a skill the
model is told to load by itself that turns into silent degradation — it works without the
guidance and nothing says so. Reach for it on skills a human types, not on ones Claude reaches
for. Measured 2026-08-27.

---

## 3. Turning a hidden skill back on for one project

Settings load `user` → `project` → `local`, and later layers override earlier ones per key. So a
skill hidden globally can be restored in a single project:

```jsonc
// ~/.claude/settings.json — hidden everywhere
"skillOverrides": { "some-skill": "user-invocable-only" }
```

```jsonc
// <project>/.claude/settings.json — visible again, here only
"skillOverrides": { "some-skill": "on" }
```

Measured 2026-08-24 with `wake` in one project: hidden by the global entry, listed again once
that project's file set `"on"`.

The same layering works for plugins, and that is the mechanism that replaced this one for the
project-bound skills:

```jsonc
// <project>/.claude/settings.json
"enabledPlugins": { "ll@loonylabs": true }
```

**A project settings file only applies in a trusted workspace.** In a directory that has never
been opened interactively, Claude Code prints `Ignoring N permissions.allow entry from
.claude/settings.json: this workspace has not been trusted` and skips the file. Start `claude`
there once, accept the trust dialog, and it takes effect.

---

## 4. How a hidden skill still gets used

With `user-invocable-only`, Claude does not know the skill exists. Three ways in, two of them
open:

- Claude proposing it by itself — **no**, it is not in the listing.
- `/name` — yes, unchanged. For a plugin skill that is `/<plugin>:<name>`.
- Naming it in plain prose ("use <name> for this") — yes. Names typed by the user are valid
  for the Skill tool even when they are absent from the listing, so the slash is optional.

---

## 5. A third source: plugins — and the switch that does NOT apply to them

**`skillOverrides` has no effect on plugin skills.** They are governed by `enabledPlugins`
and by each skill's own `disable-model-invocation`, nothing else.

Measured 2026-08-27, and it cost a defect to find out. Sixteen project-bound skills moved from
`~/.claude/skills/` into a plugin. Seven of them had been hidden through `skillOverrides` in the
global settings; after the move they were listed again, with their full descriptions, because
those entries no longer applied to them. The fix is the frontmatter flag, which travels with the
skill wherever it lives:

```yaml
disable-model-invocation: true
```

**The rule that follows:** a skill that should never be proposed carries that in its own
frontmatter. `skillOverrides` is for the exceptions — a skill you want visible *here* and not
elsewhere, or one whose file you cannot edit.

Two more things that surfaced with it:

- `claude plugin marketplace add` writes an **absolute path of the local machine** into
  `extraKnownMarketplaces` in `settings.json`. Registering a marketplace is per machine, like a
  git filter config; it does not travel with a checkout.
- Registering a marketplace does **not** load its plugin. `claude plugin install <plugin>@<marketplace>`
  is a separate step, and without it the skills simply do not appear — no error, no hint.
- `claude plugin details <plugin>` reports an "always-on" token cost per component even for
  skills carrying `disable-model-invocation` (~50 each). The listing test shows them absent, so
  the estimate appears to ignore the flag — but **`/context` cannot settle this**, which was the
  plan until 2026-08-27. Its Skills row is carved out of the tool total, which never contained
  the listing, so the two rows trade tokens and the sum never moves
  ([#85439](https://github.com/anthropics/claude-code/issues/85439), confirmed by Anthropic,
  still open). Measure the listing text from a transcript instead.

## 6. Current configuration

`~/.claude/skills/` holds eleven skills, all of them proposable — they answer situations rather
than domains, which is the only kind a description can usefully advertise. Together they cost
405 characters of listing; they are not the expensive part.

`skillOverrides` hides nine of the **bundled** skills — the ones a check of 18255 history
entries showed had never once been typed. Listing 7964 → 6381 characters, measured 2026-08-27:

```jsonc
"skillOverrides": {
  "design": "user-invocable-only",
  "run": "user-invocable-only",
  "simplify": "user-invocable-only"
  // …and six more; see settings.json
}
```

**What is deliberately NOT hidden, and why.** `user-invocable-only` does not just drop a skill
from the listing — it makes model invocation fail with an error. So the skills Claude is
instructed to load by itself (`dataviz` before a chart, the three `artifact-*` before a page,
`claude-api` before LLM code) stay visible: hiding them would mean silently working without
that guidance. Hide what only a human types. The wider cost picture is in
[`context-budget.md`](context-budget.md).

Everything project-bound lives in a private plugin, off globally:

```jsonc
"enabledPlugins": { "ll@loonylabs": false }
```

A project that needs them turns it on in its own `.claude/settings.json`. Each of those skills
carries `disable-model-invocation`, so enabling the plugin costs the listing nothing.

One skill lives in a project rather than here, because it names that product in its own
description — the case section 1 describes.

---

## 7. Decision path for a new skill

1. **Is it bound to one repository, and do sessions actually start there?**
   Yes → `<project>/.claude/skills/`. Done; nothing else to configure.
   No → continue.
2. **Is it bound to a framework, a private product, or anything a stranger would not have?**
   Yes → the `ll` plugin, off globally, on in the projects that need it.
   No → `~/.claude/skills/`, continue.
3. **Will it always be started by hand?**
   Yes → `disable-model-invocation: true` in the frontmatter. Done — and this is the only switch
   that keeps working if the skill later moves into a plugin.
4. **Should Claude propose it on its own?**
   Yes → nothing to do, the description is doing its job.
   Only in some projects → `user-invocable-only` globally, `"on"` in those projects.

Bigger levers than any of this, if context is the goal: plugin skills. Their descriptions
outweigh all local skills combined; `enabledPlugins` in `settings.json` turns off the ones that
are never used.

---

## 8. Verifying a change

The listing is only visible from inside a session, so check it from one:

```bash
cd <the directory in question>
claude -p "List only the names of the skills available to you, comma-separated."
```

Grep the output for the skill in question. A run that produces no output at all is a failed run,
not an empty listing — read the raw output before concluding anything.
