# What was measured

Claims about a tool age badly and quietly. Everything in this repository that steers
behaviour is supposed to rest on something observed rather than assumed, and this file is
where the observations live — with the date and the version, so a reader can tell when a
statement stopped being trustworthy.

It is deliberately not a changelog. It records **what was measured, how, and what came
out**, including the cases where the answer contradicted what was written here before.

Every measurement below is from **Claude Code 2.1.245 on Windows 11** unless stated
otherwise. A different platform may well behave differently; nothing here was checked on
macOS or Linux.

---

## How to measure these things

Three instruments, in descending order of trustworthiness.

**The `InstructionsLoaded` hook.** It fires when a CLAUDE.md or a `rules/*.md` file enters
context, and its payload names the file, the scope, the reason (`session_start`,
`path_glob_match`, `include`, …) and — for a glob match — the file whose reading triggered
it. This answers "was it loaded" without asking the model, which would be a claim rather
than an observation.

```json
{ "hooks": { "InstructionsLoaded": [ { "matcher": "session_start|path_glob_match|include",
  "hooks": [ { "type": "command", "command": "node /path/to/log-stdin.mjs" } ] } ] } }
```

Pass it with `claude --settings <file> -p "…"` so the versioned `settings.json` stays out
of it. **Note the exception:** `PreToolUse` hooks are *not* loaded from a `--settings`
file — measured twice with two matchers in two directories, never invoked, while
`InstructionsLoaded` from the same file worked. From `settings.json` it fires immediately.

**The session transcript.** `~/.claude/projects/<dir>/<session>.jsonl` holds every message,
attachment and tool result, with token counts per API response. It shows what was actually
sent, which the `/context` display does not always agree with (see below).

**A one-shot run.** `claude -p "…"` in a prepared directory, varying exactly one thing. A
run producing no output at all is a failed run, not an empty result — read the raw output
before concluding anything.

---

## Path-scoped rules work at user scope

**Question:** the documentation describes `paths` frontmatter for *project* rules and says
only that `~/.claude/rules/` "applies to every project". Does the conditional part survive
at user scope? Several bug reports said it did not
([#21858](https://github.com/anthropics/claude-code/issues/21858),
[#16853](https://github.com/anthropics/claude-code/issues/16853)); both were fixed since —
YAML-list `paths` in 2.1.84, symlinked paths in 2.1.198.

**Method:** two one-shot runs in the same directory containing `sample.ts` and `sample.py`,
with an `InstructionsLoaded` hook logging every load. Three probe rules: one unconditional,
one scoped to `**/*.ts`, one scoped to a pattern matching nothing.

**Result (2026-08-27):**

| run reads | `.ts` rule loaded | reason |
|---|---|---|
| `sample.ts` | yes | `path_glob_match`, `memory_type: User`, trigger `sample.ts` |
| `sample.py` | **no** | — |

The rule is *absent* from the second run, not merely unused. The never-matching probe never
appeared. So the mechanism holds, and the saving is real.

### How the rule arrives, and what it costs

This decides whether the mechanism is worth using, so it was measured separately.

The rule body arrives as a `nested_memory` attachment **behind the tool result** of the Read
that triggered it — 31 ms later, which is a disk read, not a network call. The frontmatter is
stripped; the model sees the body only.

- **No extra API call.** An A/B pair with identical prompts, one reading a `.ts` file and one
  a `.py` file, produced 2 API responses and 1 tool call either way. The difference was 295
  tokens.
- **The prompt cache survives it.** The block is appended, never inserted, so the prefix stays
  byte-identical: the call after the injection read back exactly the previous
  `cache_read + cache_write`.
- **Once per session, not per file.** A second `.ts` file triggered nothing further.
- **Read triggers it; Grep does not.** A `Grep` over `*.ts` that found the file loaded
  nothing.

**The consequence that shapes how rules are written here:** a path-scoped rule hangs on a
file being *read*. A rule about a **command** has no file to hang on and would be silently
absent exactly when it is needed. Such rules stay in `CLAUDE.md`, or become a hook.

**After a `/compact` a path-scoped rule is gone** until a matching file is read again — the
documentation says so, and it follows from the mechanism: the injected block lives in the
conversation, and compaction rewrites the conversation. This setup runs with
`autoCompactEnabled: false`, so it cannot happen unnoticed here; with the default setting it
would, which is worth knowing before copying the rules directory into a machine that
compacts on its own.

---

## What the skill listing costs

Measured from the `skill_listing` attachment in a transcript, because `/context` cannot
answer this (next section).

| configuration | listing | skills |
|---|---|---|
| default | 7964 chars | 27 |
| 2 bundled skills hidden | 7133 | 25 |
| 9 bundled skills hidden | 6381 | 18 |
| …plus all 11 own skills hidden *(current)* | **4787** | 7 |
| 13 hidden, 3 kept | 3190 | 14 |
| `disableBundledSkills` | 1607 | 11 |
| `skillListingBudgetFraction` doubled | 9310 | 27 |
| …halved | 7756 | 27 |

Three things follow.

**The listing runs at its cap.** Doubling the budget grows it; halving it returns 208
characters. The fraction is a backstop against future growth, not a lever on today's size.

**Hiding a few skills returns far less than they measure.** Two skills worth 2175 characters
returned 831, because the survivors expand into the space freed. The eleven own skills cost
405 characters when the listing is full and 1607 when they are alone — the same skills.

**And none of this is a prompt saving.** The table above measures the listing text and nothing
else. Toggled on its own, `disableBundledSkills` makes the whole prompt 3315 tokens *larger* —
see the section further down. A shrinking listing is not evidence of a shrinking prompt, which
is the mistake `context-budget.md` §2 carried until 2026-08-31.

**Hiding is a refusal, not an omission.** A model invocation of a skill hidden by
`user-invocable-only` or `disable-model-invocation` comes back as an error. Asking for it in
prose does not help — the model is not the user, and the call is refused the same way.

**And the refusal is not what the model reports.** Asked in prose for something a hidden skill
covers, Claude improvises the task by hand rather than saying a tool is unavailable: "use the
handover skill" produced an ad-hoc answer, not the skill's procedure, with nothing indicating
that anything had been skipped. Hiding trades context against the risk of a worse answer that
looks like a normal one.

### `/context` under-reports this, and it is a known bug

`/context` computes its System tools row as "tools minus the skill listing" — but the listing
was never part of the tool definitions; it is sent as a separate note beside the first
message. So the Skills row is carved out of a number that never contained it: the two rows
trade tokens 1:1 and the total does not move, however much you trim.

Confirmed by Anthropic and still open:
[#85439](https://github.com/anthropics/claude-code/issues/85439). Until it is fixed, measure
the listing text from a transcript.

---

## A deploy from a HEAD that is behind its upstream

**The incident (2026-08-27, another project).** A clone sat on the 21st while `origin/main`
carried eleven commits from the 24th. Deploying from there rolled production back three days:
an auth optimisation, a logging fix and the deploy script itself were gone.

**Nothing went red.** The working tree was clean, the gates were green, and the post-deploy
marker verification was correct — all three answer questions about the tree you *have*.

**No `fetch` was missing.** The remote ref was current and `git status -sb` had been printing
`behind 11` for hours. The session had only used `git status --short`, which does not show
branch divergence. The information was there and was never read — which is the argument for a
gate rather than a rule: a rule works only while it is in context.

`hooks/bash-guard.mjs` therefore refuses `railway up`, `npm|yarn|pnpm [run] deploy[:x]` and
`vercel|fly|netlify deploy` while `git rev-list --count HEAD..@{upstream}` is greater than
zero. `git push` is deliberately not in that list: it is the way *out* of the divergence, and
git refuses a non-fast-forward by itself.

**Verified against a real repository**, not only against its own tests: a clone made three
commits behind its upstream, with a clean working tree. Through the hook's real stdin/stdout
path, `railway up`, `npm run deploy` and `cd sub && npm run deploy:prod` were refused, while
`git push`, `npm run build` and `echo "railway up"` passed. After `git pull --rebase` the same
three ran through.

**Three limits, all deliberate:**

- **It does not fetch.** Network inside a `PreToolUse` hook can hang, and with fail-open a
  hang would mean "let it through" in exactly the situation the gate exists for. A clone that
  has not fetched in weeks reports `behind 0` with full confidence. The incident above *would*
  have been caught; that other half belongs in the project's deploy script, where the network
  is in play anyway.
- **It asks about the session's cwd**, so `cd elsewhere && npm run deploy` is measured against
  the wrong repository.
- **A command that does not pass the permission check never reaches the hook.** Measured:
  `railway up` came back as "requires approval" before the guard was consulted, in three
  permission modes. The gate matters where a deploy command is allowed — a project allowlist,
  an autonomous run. Where it prompts anyway, a human sees the command, though not that HEAD
  is behind.

## Auto memory

`autoMemoryEnabled: false` really does stop `MEMORY.md` from loading — it is not merely a
switch on *writing*. Measured with a marker token in a project's `MEMORY.md`: with the
setting false the model answered `NONE`, with it true the marker came back.

Old memory directories from an earlier period therefore cost nothing while the setting is
off. They return the moment it is switched on.

---

## A tool loaded on demand is inserted into the middle of the `tools` array

**Measured 2026-08-31 on Claude Code 2.1.251**, with a logging proxy on `127.0.0.1` in front
of `api.anthropic.com` and `ANTHROPIC_BASE_URL` pointed at it, so the raw request bodies could
be read. `ENABLE_TOOL_SEARCH=true`, `disableBundledSkills: true`, one one-shot run told to
call `ToolSearch` for `WebFetch` and nothing else.

The tool arrives **sorted by name, not appended**:

```
Agent, Artifact, Bash, Edit, Glob, Grep, ListAgents, PowerShell, Read, ReportFindings,
ScheduleWakeup, Skill, ToolSearch, WebFetch, Workflow, DeferredToolPlaceholder, Write
                                            ^^^^^^^^ index 13 of 17
```

`last3` stayed `Workflow, DeferredToolPlaceholder, Write` across all requests, so this is an
insertion, not growth at the end.

| | request 1 | request 2 |
|---|---|---|
| `tools` | 85744 chars | 86669, common prefix ends at 62983 |
| `system` | 9697 chars | 9697, byte-identical |
| `messages` | 20548 chars | 20958 |

Nothing else moved. Rendered `tools` → `system` → `messages`, **54341 of 117324 characters
(46 %) sit after the divergence** — that is what a positional prefix cache has to re-prefill
per loaded tool. This is the cost `context-budget.md` §1 now warns about.

There are **no `cache_control` breakpoints in the `tools` block at all**; they sit in `system`
(two) and in `messages`.

### But Anthropic's endpoint does not charge for it

Same insertion, six runs — Opus 5 and Haiku 4.5, first-party and through the proxy, `Skill`
loads as well as `ToolSearch` loads. The chain held exactly every time:

| request | write | read | expected read |
|---|---|---|---|
| 1 | 10227 | 31042 | — |
| 2 (tools 16 → 17) | 474 | 41269 | 31042 + 10227 = 41269 |
| 3 (tools 17 → 18) | 414 | 41743 | 41269 + 474 = 41743 |

A prefix rebuild would have shown `read` collapsing to 0. It never did, in any run. The
documented invalidation hierarchy says a tool-definition change invalidates all three cache
tiers, so something server-side reconciles this; the `DeferredToolPlaceholder` in the array is
the visible hint. **Behaviour measured over six runs, mechanism not established** — and it says
nothing about a self-hosted backend, which has no such reconciliation.

**Instrument note:** the proxy must not diff the serialised request body top to bottom. The
key order is `model, messages, system, tools, …`, so a naive common-prefix diff reports the
divergence inside `messages` and misses the point entirely. Compare `tools`, `system` and
`messages` separately.

---

## `disableBundledSkills` costs 3315 tokens

**Measured 2026-08-31 on Claude Code 2.1.251.** Five one-shot runs, identical prompt,
identical working directory, alternating. The startup prefix is
`cache_creation_input_tokens + cache_read_input_tokens` of the first response.

| `disableBundledSkills` | startup prefix |
|---|---|
| `true` | 30979 / 30983 / 30983 |
| `false` | 27665 / 27666 |

Spread inside each arm under 5 tokens; the gap is **+3315 for turning it on**. A sixth and
seventh run with a different prompt gave 30856 vs 27678 — same direction, +3178.

The runs were verified to differ as intended: the `true` transcripts contain no `dataviz` and
no `code-review`, the `false` ones do.

### What grows is one tool definition

Same day, per-tool sizes read off the request bodies for both arms:

| tool | `true` | `false` | delta |
|---|---|---|---|
| `Workflow` | **21925** | **5355** | **+16570** |
| `Artifact` | 29659 | 29659 | 0 |
| `PowerShell` | 9244 | 9244 | 0 |
| `ScheduleWakeup` | 4631 | 4631 | 0 |
| `Agent` | 3243 | 3243 | 0 |
| *(all 12 others)* | — | — | 0 |
| `system` | 9691 | 9859 | −168 |

Every tool but one is byte-identical, and the system prompt shrinks slightly. The setting
hides bundled skills **and bundled workflows** — and with no ready-made workflows left to
point at, the `Workflow` tool description carries the whole authoring guide instead. 16570
characters is ~4.1k tokens raw, against the +3315 measured in the prompt; the same effect.

The skill listing does shrink as recorded above (7964 → 1607 characters). It is simply the
smaller of the two movements, which is what made the original claim look right.

### It does not cause the insertion, it doubles what the insertion costs

Run through the proxy with the setting on and off, otherwise identical:

|  | `true` | `false` |
|---|---|---|
| tools at request 1 | 16 | 16 |
| tool order | identical | identical |
| index of `WebFetch` after the load | 13 | 13 |
| `tools` block | 85744 → 86669 | 69174 → 70099 |

So the insertion behaviour belongs to `ENABLE_TOOL_SEARCH` alone. But the tool that grows is
`Workflow`, and `Workflow` is the **next tool after index 13** — precisely where ToolSearch
inserts. Everything from the insertion point to the end of the system prompt has to be
re-prefilled on a positional cache, and that block is:

| behind the insertion point | `true` | `false` |
|---|---|---|
| `Workflow` | 21925 | 5355 |
| `DeferredToolPlaceholder` | 204 | 204 |
| `Write` | 639 | 639 |
| `system` | 9691 | 9859 |
| **sum** | **32459** | **16057** |

Two independent mechanisms landing on the same byte range. Setting `disableBundledSkills`
doubles the fixed cost of every on-demand tool load, on top of the +3315 tokens it costs
standing still. Where both are set, switching this one off halves the per-load cost while
leaving the loads themselves in place — which makes it easy to blame the wrong knob.

---

## Claims that did not survive

Seven of this repository's own statements were spot-checked on 2026-08-27. Three were wrong
or misleading. They are recorded here because the corrected text no longer shows what it used
to say.

**`tsconfig` inheritance warned about the wrong case.** The rule said a child config for an
excluded subtree "passes instantly while checking zero files". It does not pass — `tsc`
reports `TS18003: No inputs were found` and exits 2. Loud, not silent. The silent case is a
*partial* overlap: the child checks what the parent did not exclude, exits 0, and a genuine
type error inside the excluded part is never seen. Both were reproduced. The advice
(`--listFiles`, not the exit code) was right for the wrong reason.

**`--bare` refuses differently than described.** The rule predicted a demand for
`ANTHROPIC_API_KEY`. Actual: `Not logged in · Please run /login`, exit 1.

**`--include-partial-messages` mostly delivers `thinking_delta`.** Measured over one answer:
5 `thinking_delta`, 1 `signature_delta`, 1 `text_delta`. Code filtering on `text_delta` alone
sees almost nothing and reproduces the silence the flag exists to fix.

Confirmed as written, several word for word: `stream-json` requires `--verbose`;
`api_error_status` is present-and-null on success (though `is_error` sits beside it and is
the better field); `--resume <session_id>` continues a conversation;
`ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` for `enum`, `namespace` and constructor parameter
properties, exit 1 each; the whole Node `.cmd` rule, including the *synchronous* `EINVAL` for
an absolute path and `shell: true` truncating an argument at the first space; a missing
command exits 127 in Bash and 1 in PowerShell; Git Bash rewriting `/news/` into
`C:/Program Files/Git/news/` and `MSYS_NO_PATHCONV=1` preventing it; `Set-Content -Encoding
utf8` writing a BOM that makes `JSON.parse` throw.

### A doubled backslash does not survive the Bash tool

`\\` arrives as `\` — inside a quoted heredoc and inside single quotes alike, so no quoting
style protects it. Writing `C:\\Program Files\\nodejs` into a script produces a path with a
real newline in it (`\n` after the reduction), the script stays syntactically valid, and the
program then works on a path nobody asked for. It cost one silently meaningless measurement
in this session before it was noticed. Write anything carrying Windows paths or regex escapes
through the Write/Edit tool.

---

## The language census had a blind spot, and it was narrow

The census reads ratios over whole files. Three German passages had survived inside otherwise
English files — two skill bodies and the `handover` description, which sits in the skill
listing of *every* session.

| file | German-marker density | threshold | umlauts | limit |
|---|---|---|---|---|
| `analyze-fix/SKILL.md` | 0.0078 | 0.015 | 2 | 3 |
| `analyze-fix-cheap/SKILL.md` | 0.0101 | 0.015 | 2 | 3 |
| `handover/SKILL.md` | 0.0035 | 0.015 | 2 | 3 |

Every one just under, on both signals at once. No threshold would have caught them without
firing elsewhere — the file was simply the wrong unit. The census now also reads per line: one
umlaut plus two function words in the same line. A line quoting "ß" as a character carries no
German sentence around it, so the language documentation still passes.
