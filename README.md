# claude-setup

[![tests](https://github.com/loonylabs-dev/claude-setup/actions/workflows/tests.yml/badge.svg)](https://github.com/loonylabs-dev/claude-setup/actions/workflows/tests.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![platform](https://img.shields.io/badge/platform-Windows%20%C2%B7%20Linux-lightgrey)](#does-this-fit-your-setup)
[![context](https://img.shields.io/badge/startup%20context-measured-green)](docs/measurements.md)

**A `~/.claude` you can clone, with the parts that cost context measured rather than
guessed.** The repository *is* the directory Claude Code reads — there is no sync step and
nothing can drift — and every number in its documentation was taken from a running session
rather than estimated.

```bash
git clone https://github.com/loonylabs-dev/claude-setup.git ~/.claude
cd ~/.claude
git config filter.claude-settings.clean "node scripts/strip-volatile-settings.mjs"
git config filter.claude-settings.required true
node tests/settings-hygiene.test.mjs     # says so if that registration is missing
```

If `~/.claude` already exists — it usually does — see
[Restore on an existing machine](#restore-on-an-existing-machine). Do not delete the folder:
it holds your credentials and session history.

## Does this fit your setup?

The honest answer first, because much of what is here is shaped by one machine.

| | |
|---|---|
| **Portable** | the `.gitignore` allowlist, the settings clean filter, the five tests, the way rules and skills are split, the per-OS environment split, and every measurement in [`docs/`](docs/) that is about Claude Code itself |
| **Per-OS** | `env-windows.md` and `env-linux.md`, and the status line wrappers. One environment file is loaded at session start, the other is inert on disk — see [Environment rules per OS](#environment-rules-per-os) |
| **Personal** | the eleven skills, and the working conventions in `CLAUDE.md` |

The status line is the one place a machine still needs un-versioned configuration:
`settings.json` names `statusline-wrapper.cmd`, and a Linux install overrides `statusLine`
to `statusline-wrapper.sh` in its own `settings.local.json` — verified rendering there on
2026-08-29. Whether Windows can use the `.sh` directly is unmeasured; if it can, the
`.cmd` and the override both go away.

Measured on Windows and, since 2026-08-28, on Linux — the numbers in [`docs/`](docs/) say
which. macOS is untried: `env-macos.md` does not exist yet, and the hook that would select
it says so in prose rather than loading nothing quietly. The mechanisms are documented in
enough detail to check them yourself — that is what
[`docs/measurements.md`](docs/measurements.md) is for.

## What you get that a dotfiles repository does not

Copying somebody's config is easy. Three things here are not.

**Numbers instead of folklore.** "Turn off the bundled skills, it saves a lot" is the kind of
advice that circulates without anyone checking. Measured: it returns 6357 characters — but
hiding *two* skills returns 831 rather than the 2175 they occupy, and lowering
`skillListingBudgetFraction` returns 208, because the listing already runs at its cap and the
survivors expand into whatever you free. `/context` cannot show you any of this: it has a
[confirmed accounting bug](https://github.com/anthropics/claude-code/issues/85439) that keeps
the total still while the rows trade tokens. How to measure it properly is written down.

**A safety model that fails closed.** `~/.claude` also holds `.credentials.json`, every
session transcript, and your shell history. The `.gitignore` here is an **allowlist**: its
first rule is `*`, and everything tracked is opted in below it. A new file Claude Code drops
into the directory is ignored by default — the safe direction to be wrong in.

**Tests for the configuration itself.** Five, plain `node`, no dependencies: that the settings
clean filter is registered on this machine, that no German prose slipped into an English
repository, that every file in `rules/` is genuinely conditional, that the Bash guard
still refuses the three commands it exists for, and that the per-OS environment split is
wired up rather than silently loading nothing. Four run in CI; the fifth checks this
machine and says so rather than pretending otherwise.

## What it is not

- **Not a starter kit.** No install script, no opinionated bootstrap. It is one person's
  `~/.claude`, published because the measurements in it are worth more than the config.
- **Not a cross-platform promise.** It runs on Windows and Linux, and the split that makes
  that work is real — but `env-linux.md` is nearly empty, because it has to earn its
  entries the same way the Windows one did. macOS is untried.
- **Not a skill collection.** Eleven skills, all about *working* rather than any domain. The
  project-bound ones live in a private plugin — that split is the point.

## Where to start

| If you want to … | go here |
|---|---|
| know **what was actually measured**, and how to repeat it | [`docs/measurements.md`](docs/measurements.md) |
| **cut the startup context**, especially against your own inference backend | [`docs/context-budget.md`](docs/context-budget.md) |
| understand **where a skill has to live** to load at all, and what it costs | [`docs/skill-config.md`](docs/skill-config.md) |
| see how instructions are **split by scope** | [the three-way split](#the-three-way-split-of-instructions) |
| **restore this on a machine** | [Restore on an existing machine](#restore-on-an-existing-machine) |
| **change something** without breaking it | [`tests/`](tests/) and [CONTRIBUTING.md](CONTRIBUTING.md) |
| report something that behaves differently **for you** | an issue — the one thing this repo cannot measure for itself |

## Layout

| | |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | loaded into **every** session of every project; only rules that hold everywhere |
| [`rules/`](rules/) | rules for a *kind* of project — a `paths` glob loads each one only when a matching file is read |
| [`language.md`](language.md) | the two language axes, imported by `CLAUDE.md`, and the only place either is named |
| `env-windows.md`, `env-linux.md` | environment rules for one operating system; exactly one is imported per session, the others sit inert |
| `env-local.md`, `env-machine.md` | **not versioned** — the generated pointer, and this installation's own notes |
| [`skills/`](skills/) | everything invocable by name |
| [`docs/`](docs/) | what was measured about this setup and is documented nowhere else |
| [`hooks/`](hooks/) | the Bash guard: three "never" rules as a gate rather than a request |
| [`tests/`](tests/) | guards on the setup itself |
| [`scripts/`](scripts/) | the settings clean filter |
| [`project-template/`](project-template/) | starting points to copy into a project; never loaded |

Counts are deliberately not given here — they go stale silently. `git ls-files skills` is the
answer that cannot be wrong.

## The three-way split of instructions

Where a rule lives decides when it costs anything.

**`CLAUDE.md`** loads in full, in every session, in every project. It is the most expensive
text in the repository, so it holds only what is true everywhere.

**`rules/*.md`** carry a `paths` glob and load when Claude reads a matching file — measured to
work at user scope, and measured to be genuinely *absent* otherwise. TypeScript, Next.js and
CLAUDE.md-hygiene rules moved here, taking 2429 characters out of the always-on file.

**Skills** load only when invoked. A rule that is really a procedure belongs there.

The boundary that matters: a path-scoped rule hangs on a *file being read*. A rule about a
**command** has nothing to hang on, and would be silently missing exactly when it is needed —
so those stay in `CLAUDE.md`, or become a hook. That is why [`hooks/`](hooks/) exists.

## Environment rules per OS

`CLAUDE.md` holds what is true everywhere. Environment rules are not that: PowerShell 5.1
encoding, `taskkill`, Git Bash path rewriting are Windows facts, and on Linux they are not
merely unused but misleading.

They cannot go in [`rules/`](rules/) — a path glob hangs on a *file being read*, and an
environment rule has no file. And an `@` import is unconditional, so an import line chosen
per OS would sit in the versioned `CLAUDE.md` and be a merge conflict on every machine,
forever.

So the one branch Claude Code cannot express is done by a `SessionStart` hook,
[`hooks/select-env.mjs`](hooks/select-env.mjs). It reads `process.platform` and writes
`env-local.md` — the pointer `CLAUDE.md` imports:

```
CLAUDE.md  ->  @env-local.md  ->  @env-windows.md   (generated per machine)
                               -> @env-machine.md   (this installation's own notes)
```

`CLAUDE.md`, `settings.json` and the hook are byte-identical on every machine. `env-local.md`
and `env-machine.md` are un-versioned, and the allowlist ignores them without needing a rule.
There is **no per-machine registration** — unlike the settings filter, a fresh clone is
correct on its first start.

**Measured 2026-08-28, Claude Code 2.1.241.** The open question was ordering: a hook that
runs after the instruction files are read would fix things one session late, silently.
`env-local.md` was deleted, then a session started with both a `SessionStart` and an
`InstructionsLoaded` hook attached:

| | |
|---|---|
| `SessionStart` | wrote `env-linux.md` as the target |
| `InstructionsLoaded` | `env-linux.md` — `load_reason: include` |
| `InstructionsLoaded` | `CLAUDE.md` — `load_reason: session_start` |
| `InstructionsLoaded` | `env-local.md` — `load_reason: include` |

Both files' markers reached the model in that same run, from a pointer that did not exist
when the session was invoked. Nested imports work two levels deep. `resume` fires the hook
too — the pointer was deleted between two runs and the resumed session restored it.
`clear` and `compact` need an interactive session and are not measured; nothing depends on
them, since the file persists and the hook is idempotent.

**The failure mode this is built around is silence, and it is silent twice over.** With
`env-local.md` absent, Claude Code started without a word, `InstructionsLoaded` logged only
`CLAUDE.md`, and the session simply had no environment rules. And the hook cannot report
its own failure either: one exiting 1 with a message on stderr produced no output, no
warning and exit 0 from `claude -p` — both channels discarded. (Headless mode; the
interactive TUI is unverified.)

So the only channel left is the file the model reads, which is what the hook writes to in
both cases — prose rather than a dangling import when an OS file is missing, and prose
rather than a stale pointer when selection itself fails. A leftover pointer naming another
machine's OS is the worse outcome of the two: it loads confidently wrong rules.
`tests/env-select.test.mjs` covers both shapes.

## Restore on an existing machine

Move the `.git` directory in rather than deleting the folder — `.credentials.json` and your
session history live there and are not in this repository:

```bash
git clone https://github.com/loonylabs-dev/claude-setup.git /tmp/claude-setup
mv /tmp/claude-setup/.git ~/.claude/.git
cd ~/.claude && git checkout -- .
git config filter.claude-settings.clean "node scripts/strip-volatile-settings.mjs"
git config filter.claude-settings.required true
```

Note that `git checkout -- settings.json` restores the file *without* the volatile keys
below; Claude Code falls back to its defaults and nothing breaks.

Not restored by design: credentials (log in again), session transcripts, caches, and
installed plugins.

Plugins need one more step, and it is the one the clean filter deliberately takes away:
`extraKnownMarketplaces` records an absolute path of the machine that added it, so it is
stripped on the way into git. A fresh clone therefore has no marketplaces at all, without
saying so. `enabledPlugins` names five plugins from the official one:

```bash
claude plugin marketplace add anthropics/claude-plugins-official
```

`enabledPlugins` also carries one entry from a private marketplace. It is set to `false`,
and for anyone else it is simply inert — measured 2026-08-28: a session with an
unregistered marketplace in that list starts with no warning, no error and exit 0.

### Why `settings.json` needs a filter

Claude Code writes `model`, `effortLevel`, `modelSettings` and `fastMode` into
`settings.json` itself, every time either is switched in the UI. Versioned as-is, a choice
made for one afternoon becomes the default every machine restores. `.gitattributes` therefore
runs the file through a clean filter that drops exactly those keys and sorts the rest: the
local file keeps them, git never sees them, and the diff shows what was decided rather than
what was toggled.

The binding lives in the repository, the registration in `.git/config` — so a fresh clone has
the first and not the second, and would commit the file unfiltered without a word. That is
what `node tests/settings-hygiene.test.mjs` is for, and why it is the one test that cannot run
in CI: it checks *this machine*. `required true` means a broken filter aborts the commit
instead of quietly letting the raw file through.

## Maintenance

- **Adding a skill:** `skills/<name>/SKILL.md`, commit. Write it in English —
  `tests/language-census.test.mjs` fails on German prose, per file *and* per line. Every skill
  here carries `disable-model-invocation: true`: they are started by hand with `/name` and cost
  the listing nothing. Leave it out only for a skill you want Claude to offer on its own, and
  know that it then costs its description in every session.
- **Adding an environment rule:** decide whose truth it is. True on this OS ->
  `env-windows.md` / `env-linux.md`. True of this one installation (a tool being
  installed, how it is authenticated) -> `env-machine.md`, which is not versioned. True
  everywhere -> the **Tools and runtime** section of `CLAUDE.md`. That last one is the
  case people get wrong: Node, Claude Code and tool behaviour read as "environment"
  and are not.
- **Adding a rule:** `rules/<topic>.md` **with** a `paths` frontmatter.
  `tests/rules-hygiene.test.mjs` refuses one without, because it would load in every session:
  a second CLAUDE.md that nobody is looking at.
- **Adding a top-level file:** add a `!` rule to `.gitignore` first, or it stays invisible.
  **Never `git add -f`** — the Bash guard refuses it.
- **Adding a test:** decide whether it checks the repository's content or this machine. The
  first kind goes into the CI workflow; the second stays local, and the workflow says why.
- **Keeping `CLAUDE.md` lean:** a rule that would be wrong in any one project belongs in that
  project's file; one that is right for a *kind* of project belongs in `rules/` with the glob
  that selects it.
- **Switching the conversation language:** set `language` in `settings.json` and replace the
  language-specific section of `language.md`. Nothing else names a language.
- **Before committing:** `git status --short`. Anything unexpected means an allowlist rule is
  too broad.

## Security

The allowlist is a path filter, not a secret scanner. Inside the opted-in directories the
un-ignore rules reach recursively, so a secret written into a skill script *would* be
committed. Reporting a finding: [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
