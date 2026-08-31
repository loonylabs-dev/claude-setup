# Cutting the startup context

Every session starts with a bill before you type anything: the system prompt, the tool
schemas, the skill listing, the memory files. Against Anthropic's own endpoint that bill is
mostly invisible. Against a **custom backend** — your own inference proxy, a local model —
it is the difference between a usable window and a useless one.

Measured on one configuration (Claude Code 2.1.245, 2026-08-26, `ANTHROPIC_BASE_URL`
pointing at a private proxy, `CLAUDE_CODE_MAX_CONTEXT_TOKENS` = 65536):

| | before | after |
|---|---|---|
| startup overhead | ~40k | **~13.3k** |
| share of a 64k window | ~60 % | ~20 % |

**Those totals are measured; the attribution to individual settings below is not** — the
knobs were not toggled one at a time. Treat the per-setting figures as order of magnitude.

**Two of the knobs have since been toggled one at a time, and both came back worse than the
table suggests.** `disableBundledSkills` costs tokens rather than saving them (§2), and
`ENABLE_TOOL_SEARCH` trades its one-time saving for a re-prefill on every tool load (§1). The
~13.3k above was reached with both on, so the honest reading of it is: reproduce the total
yourself before trusting it.

A ready-to-copy settings file and wrapper live in
[`project-template/custom-backend/`](../project-template/custom-backend/).

---

## 1. The big one: `ENABLE_TOOL_SEARCH`

Claude Code normally loads most tools **deferred**: the prompt carries only the tool names,
and the full JSON schema is fetched on demand. That mechanism needs `tool_reference` blocks
in the API protocol — and the client assumes a non-first-party backend cannot handle them:

> **`ENABLE_TOOL_SEARCH`** — Controls MCP tool search. *Disabled by default when
> `ANTHROPIC_BASE_URL` is set to a non-first-party host.* Set to `true` if your proxy
> forwards `tool_reference` blocks.
> — [env var docs](https://code.claude.com/docs/en/env-vars)

So pointing at your own proxy silently inlines **every** tool schema. That is the bulk of the
overhead.

```json
"ENABLE_TOOL_SEARCH": "true"
```

**Estimated saving: 15–20k.**

**This is the one setting that can break the session.** If the proxy does not pass
`tool_reference` through, tool calls fail or the model never calls tools at all. Symptom:
Claude claims a tool exists but calling it errors. Fix: remove this single line, keep the
rest — the remainder still saves an estimated 5–8k.

**How to tell it worked:** `/context` shows the MCP tools as `(loaded on-demand)`.

### What it costs on every load, and why that can outweigh the saving

Deferred loading is not free once the session is running. When `ToolSearch` fetches a schema,
the client does not append the tool — it inserts it into the `tools` array **in name order**.
Measured 2026-08-31 on Claude Code 2.1.251, loading `WebFetch` into a 16-tool session, read
off the raw request bodies through a logging proxy:

| | before the load | after |
|---|---|---|
| tools in the array | 16 | 17 |
| position of the new tool | — | **13**, between `ToolSearch` and `Workflow` |
| `tools` block | 85744 chars | 86669, diverging at char 62983 |
| `system` block | 9697 chars | 9697, **byte-identical** |

The system prompt does not move and the conversation does not move. The insertion on its own
is enough: from that byte on it is a different token sequence. Rendered in the usual `tools`
→ `system` → `messages` order that is **54341 of 117324 characters — 46 % of the whole
prompt — to re-prefill per loaded tool**, and again for the next one.

**Against a backend with a positional prefix cache — llama.cpp, vLLM, Ollama, anything that
reuses the longest common token prefix — this undoes the setting.** It buys 15–20k once at
startup and charges ~46 % of the prompt every time a tool is loaded. A session that loads
three tools has spent the saving several times over, and the sessions where you expect
on-demand loading to help are exactly the ones that pay. Left off, every schema is inlined
once and the `tools` block never changes again.

So the saving below is a *startup* figure, and on your own backend it is the wrong quantity to
optimise unless tool loading is rare. Measure a real session before keeping this on: log the
request bodies and compare the `tools` array across two consecutive requests. If it grows, you
are paying the 46 %.

**Against Anthropic's endpoint it does not cost this.** Measured across six runs, Opus 5 and
Haiku 4.5, first-party and through the proxy: the cache chain stayed exact
(`read(n+1) = read(n) + write(n)`) although the same index-13 insertion was visible in the
forwarded request. Something server-side reconciles it — the `DeferredToolPlaceholder` entry
sitting in the array points that way. **Behaviour measured, mechanism not**, and it does not
transfer to a backend you host yourself, which is what this document is about.

### Why ~11k of tools remains, whatever you do

Deferred means *fetched later*, not *absent*. The core tools — `Bash`, `Read`, `Edit`,
`Write`, `Glob`, `Grep`, `Task`, `Skill`, `TodoWrite` — keep their full schemas, because
routing every file read through an extra round-trip would cost more than it saves. What
remains is those schemas, the name list of every deferred tool, and ToolSearch itself.
**That is the floor** (see [What is not possible](#what-is-not-possible)).

---

## 2. Bundled skills — do not set this one

`disableBundledSkills: true` turns off everything that ships with Claude Code —
`/code-review`, `/dataviz`, `/artifact-design`, `/claude-api`, `/security-review`, `/run`,
`/init`. Their descriptions are long; all of them are listed at startup. `/doctor` stays
available regardless (v2.1.205+).

**It costs 3315 tokens. It does not save 1600.** Measured 2026-08-31 on Claude Code 2.1.251:
five one-shot runs, identical prompt, identical directory, prefix read as
`cache_creation + cache_read` of the first response.

| `disableBundledSkills` | startup prefix |
|---|---|
| `true` | 30979 / 30983 / 30983 |
| `false` | 27665 / 27666 |

The spread inside each arm is under 5 tokens. Turning the setting on made the prompt **larger,
reproducibly**, and cost `/code-review` and the rest on top.

**What grows is the `Workflow` tool.** Its definition goes from 5355 characters to **21925**
when the setting is on — +16570, and every other tool in the request is byte-identical
(`Artifact` 29659, `PowerShell` 9244, `Agent` 3243, … unchanged in both arms); the system
prompt even shrinks by 168. The setting hides bundled skills *and bundled workflows*, and with
no ready-made workflows left to point at, the tool description carries the whole
workflow-authoring guide instead. Measured through a logging proxy, per-tool, both arms.

**What the earlier entry here got wrong.** It measured the skill *listing* — 7964 characters
with 27 skills down to 1607 with the 11 own ones, which is real — and then read that as a
prompt saving. It is not: the listing shrinks and one tool definition grows by four times as
much.

**It does not cause §1 — it doubles the price of it.** With the setting on and off the request
carries the same 16 tools in the same order, and `WebFetch` is inserted at index 13 either
way; `disableBundledSkills` changes neither the tool set nor the loading behaviour. What it
changes is what sits *behind* the insertion point, and `Workflow` is the very next tool after
index 13:

| behind the insertion point | `true` | `false` |
|---|---|---|
| `Workflow` | 21925 | 5355 |
| `DeferredToolPlaceholder` | 204 | 204 |
| `Write` | 639 | 639 |
| `system` | 9691 | 9859 |
| **fixed re-prefill per tool load** | **32459** | **16057** |

So it doubles what every on-demand load costs before the conversation is counted at all, and
it does it by inflating the one tool that happens to sit at the insertion point. Two separate
mechanisms landing on the same byte range — which is why switching this one off can make §1
bearable, and why it can look like the culprit when §1 is the one still set.

**Hiding them one at a time is no better.** Switching off individual bundled skills
through `skillOverrides` saves far less than their listed size, because the listing is
budget-capped (next section) and the remaining descriptions expand into the space freed.
Measured: hiding `dataviz` and `design`, together 2175 characters of listing, saved 831.

---

## 3. Your own skills

Each skill costs one line: name plus description. Two independent switches control that,
and they are covered in detail in [`skill-config.md`](skill-config.md). The short version
for a low-context project:

| Value in `skillOverrides` | Listed to Claude | `/name` | Cost |
|---|---|---|---|
| *(absent)* | name **and** description | yes | full |
| `name-only` | name only | yes | ~20 chars |
| `user-invocable-only` | not at all | yes | none |
| `off` | not at all | no | none |

Note that `user-invocable-only` and `off` cost **the same: nothing**. Reach for `off` only
when you want the skill gone from the `/` menu too — it buys no tokens over the other.

A skill carrying `disable-model-invocation: true` in its own frontmatter already costs
nothing and needs no entry here.

```json
"skillListingBudgetFraction": 0.005
```

Hard-caps the whole listing at 0.5 % of the window regardless of how many skills are
enabled. A backstop, so a newly installed skill cannot quietly re-inflate the prompt. Raise
it if skills you need stop appearing.

**Measured 2026-08-27: 208 characters — a backstop, not a lever.** The listing already runs
at its cap, so lowering the fraction barely moves it, and raising it lets the listing grow:

| `skillListingBudgetFraction` | listing |
|---|---|
| 0.005 (half the default) | 7756 |
| *default* | 7964 |
| 0.02 (double) | 9310 |

The floor is what each entry costs at its shortest. Set this to stop the listing growing
later, not to shrink it now — for that, the lever is the previous section.

---

## 4. Plugins

**Plugin skills are not affected by `skillOverrides`** — they are governed by
`enabledPlugins` or `/plugin`. Turn off what this project does not need:

```json
"enabledPlugins": { "some-plugin@some-marketplace": false }
```

**Estimated saving: ~0.5k per plugin**, more for plugins with many components.

---

## 5. The global CLAUDE.md

A user-scope `CLAUDE.md` loads into every session including this one, however little of it
applies. `claudeMdExcludes` skips memory files by absolute path or glob:

```json
"claudeMdExcludes": [
  "C:/Users/you/.claude/CLAUDE.md",
  "C:\\Users\\you\\.claude\\CLAUDE.md"
]
```

Both spellings, because it is unverified which separator the glob matcher sees on Windows —
a pattern that matches nothing is harmless, so listing both is the cheap safe move.

**Estimated saving: ~1k per 4k characters of CLAUDE.md.**

**Confidence:** the documentation presents `claudeMdExcludes` for *ancestor* files in
monorepos and does not discuss the user-scope file. The rule as written is generic and names
exactly one exception — managed policy files cannot be excluded. **Verified 2026-08-26:**
after the change, `CLAUDE.md` no longer appears under **Memory files** in `/context`. It
works on the user-scope file. Re-check after a Claude Code update.

**Cost:** none of your global conventions apply in that project any more. If you want a
subset back, write a short project-level `.claude/CLAUDE.md` — it costs only what you put
in it.

There is **no CLI flag** for this (`--no-global-instructions` does not exist); it is an open
request, [anthropics/claude-code#30380](https://github.com/anthropics/claude-code/issues/30380).
Renaming the file before a session is not a workaround — it affects every other project on
the machine while renamed.

### Cheaper than excluding it: move the parts that do not hold everywhere

Excluding `CLAUDE.md` is all-or-nothing. The finer cut is to take the sections that are
only true in *some* projects out of it and into `~/.claude/rules/`, where a `paths`
frontmatter makes each one load when Claude reads a matching file and cost nothing
otherwise:

```markdown
---
paths:
  - "**/*.{ts,tsx,mts,cts}"
  - "**/tsconfig*.json"
---

# TypeScript that Node runs directly
...
```

**Measured 2026-08-27 on Claude Code 2.1.245.** The documentation describes `paths` for
*project* rules and says only that user-level rules "apply to every project" — whether
the conditional part survives at user scope was the open question, and several bug
reports said it did not ([#21858](https://github.com/anthropics/claude-code/issues/21858),
[#16853](https://github.com/anthropics/claude-code/issues/16853), both since fixed —
YAML-list `paths` in 2.1.84, symlinked paths in 2.1.198). Two one-shot runs in the same
directory, one reading a `.ts` file and one reading only a `.py` file, with an
`InstructionsLoaded` hook logging every load:

| Run reads | Rule loaded | `load_reason` |
|---|---|---|
| `sample.ts` | yes | `path_glob_match`, `memory_type: User` |
| `sample.py` | **no** | — |

So it holds, and it genuinely saves — the rule is absent from the second run, not merely
unused. Two sections left `CLAUDE.md` this way, 1728 of 13282 characters (**13 %**).

**How to re-measure it after an update** — the hook is the instrument, because asking
the model what it can see is a claim, not a measurement:

```json
{
  "hooks": {
    "InstructionsLoaded": [
      {
        "matcher": "session_start|nested_traversal|path_glob_match|include|compact",
        "hooks": [{ "type": "command", "command": "node /path/to/log-stdin.mjs" }]
      }
    ]
  }
}
```

Pass it with `claude --settings <file> -p "..."` so the versioned `settings.json` stays
untouched. Each event arrives on stdin as JSON carrying `file_path`, `memory_type`,
`load_reason` and — for a `path_glob_match` — the `trigger_file_path` that caused it.

**The trade-off, and it is the sharp edge.** A path-scoped rule loads on a *file being
read*. A rule about a **command** has no file to hang on, so it can be silently absent
exactly when it is needed. That is why `Never run next build while next dev is running`
carries `**/package.json` among its globs — deliberately broad, so the rule is present in
any Node project rather than only when someone opens `next.config.mjs`. A rule that costs
850 characters too often is a cheap mistake; one that is missing when the build breaks is
not. `Claude Code as a subprocess` stayed in `CLAUDE.md` for the same reason: nothing it
warns about is reachable through a file pattern.

`node tests/rules-hygiene.test.mjs` guards the other half of it — a rule file *without*
`paths` is legal and loads in every session, which is a second CLAUDE.md that nobody is
looking at.

---

## 6. Browser and IDE integrations

These auto-connect and are not configured MCP servers, so `disabledMcpjsonServers` does not
apply. Their schemas are on-demand, but their **names** still sit in the prompt.
**Estimated saving: 300–600 tokens** for dropping both.

**Chrome has no settings key** — only the `--chrome` / `--no-chrome` CLI flags. A flag cannot
live in `settings.local.json`, so it needs a wrapper script (see
[`project-template/custom-backend/`](../project-template/custom-backend/)). The
documentation names this exact situation:

> Enabling Chrome by default in the CLI increases context usage since browser tools are
> always loaded. If you notice increased context consumption, disable this setting and use
> `--chrome` only when needed.

**IDE** connects to a running VS Code. The setting `autoConnectIde` lives in the global
`~/.claude.json`, but the environment variable is read first, so it works project-local:

```json
"CLAUDE_CODE_AUTO_CONNECT_IDE": "false"
```

**Unverified:** the accepted false-value spelling is not documented. Some `DISABLE_*`
variables treat *any non-empty value including `0`* as "on", so `"false"` is the least
ambiguous choice. **Check it:** `/context` should no longer list `mcp__ide__*`. If both
entries remain, try `"0"`; if that fails too, the variable does not apply.

**Cost:** no `getDiagnostics` — Claude cannot read your editor's type or lint errors and has
to run the compiler itself. In a real codebase that is worth more than 600 tokens.

---

## 7. Non-essential traffic

```json
"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1"
```

Stops feature-flag fetching and similar background calls. Does not shrink the prompt, but
avoids first-party requests that are pointless against a custom backend. Any non-empty value
enables it.

---

## What is *not* possible

**There is no `disabledTools` setting.** Individual built-in tools cannot be switched off to
reclaim their schema cost. Open requests:

- [#66073 — disabling specific built-in tools](https://github.com/anthropics/claude-code/issues/66073)
- [#54716 — opt-out of built-in deferred tools](https://github.com/anthropics/claude-code/issues/54716)

`permissions.deny` only blocks a tool from being *used*. The schema stays in the prompt, so
it saves nothing in context terms.

**Individual bundled *skills* can be switched off** — `skillOverrides` works on them, which
[#80602](https://github.com/anthropics/claude-code/issues/80602) asked for and got that as
its answer. Two caveats measured here that the issue does not mention:

- **`/context` cannot show you the saving.** It computes the System tools row as "tools
  minus the skill listing", but the listing was never part of the tool definitions — it is
  sent as a separate note beside the first message. So the two rows trade tokens 1:1 and the
  total never moves, however much you trim. Confirmed by Anthropic and still open:
  [#85439](https://github.com/anthropics/claude-code/issues/85439). Until it is fixed, the
  only honest measurement is the listing text itself, from a transcript.
- **The saving is not the sum of what you hid.** The listing is budget-capped and runs at
  its cap, so the remaining descriptions expand into whatever you free up. Hiding two skills
  worth 2175 characters returned 831.

And the switch is sharper than it looks: `user-invocable-only` does not merely hide a skill
from the listing, it **refuses model invocation with an error**. Hiding a skill the model is
instructed to load by itself — `artifact-design`, `dataviz`, `claude-api` — means it silently
works without that guidance. Hide what only a human types.

---

## A separate config profile

`CLAUDE_CONFIG_DIR` isolates session history, credentials and settings entirely. It must be
set *before* the process starts, so it belongs in the wrapper, not in `settings.local.json`:

```bat
set CLAUDE_CONFIG_DIR=C:\path\to\project\.claude-profile
```

**Trade-off:** that is a genuinely different profile, not a filter. Separate history,
separate credentials, separate settings. Worth it only when you want the isolation for its
own sake — the targeted exclusions above are cheaper for the context goal.

The blunter `--setting-sources` flag can drop the `user` scope entirely, which also throws
away your global model choice, status line and effort level. Worse than a targeted
exclusion for this purpose.

---

## Verifying

Settings are read at startup, so restart after any change.

1. `/context` → note the total and the per-section breakdown
2. restart
3. `/context` again → compare

The breakdown is more useful than the total: it tells you which section is still large. If
tool calls misbehave afterwards, suspect `ENABLE_TOOL_SEARCH` first.

From outside a session, the skill listing can be checked with a one-shot run:

```bash
claude -p "List only the names of the skills available to you, comma-separated."
```

A run that produces no output at all is a failed run, not an empty listing — read the raw
output before concluding anything.

---

## Security

A `settings.local.json` for a custom backend holds an auth token in plaintext. `.local.json`
files are conventionally gitignored — if such a folder ever becomes a git repository, make
sure the file and any `.bak-*` copies are excluded **before** the first commit.
