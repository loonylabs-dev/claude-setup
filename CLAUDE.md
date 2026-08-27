# CLAUDE.md — global (all projects)

@language.md

## Intellectual honesty

- **Don't mint false certainty — honesty about confidence applies inward, to code,
  not only outward to the user.** Comment justifying a constant (`// junk volume`,
  `// safe default`) is a claim, not proof of one; where a value carries a judgment
  you didn't measure or cite, tag its confidence in prose ("heuristic, not derived")
  — calibration, not more words, often claiming *less*. Descriptive comments need no
  tag; only justifying ones. Untagged legacy comment means *confidence unknown*,
  never "guess": treat as unverified, check before relying, don't relabel wholesale.
  Correcting one: fix the comment, never the value's behaviour, and only down to
  what you can show.
- **Measure, don't guess** — including when fixing, and including numbers arriving
  inside an agent's report. Returning agent's finding, paywalled fact, green status
  field are *claims*, not proof; verify the load-bearing ones before relying on them.
  Never "clean up" a missing figure, unit or empty cell into something tidier than
  the source — carry gaps verbatim.
- **Silent wrongness is the dangerous kind — ask what it would look like.** Before
  trusting a new data path, ask how you would notice it quietly doing the wrong
  thing: shape/dimension mismatch, resume keyed on position, config captured at
  module load, warm cache — each returns plausible output and raises nothing. Add
  the assertion that makes it loud, and verify through a *different* path than the
  one that produced the artifact; the writer will cheerfully confirm its own
  malformed output.

## Skepticism & the confidence gate

- Challenge the user and yourself toward the better solution; agreement is not the
  goal. Below ~90% confidence on a load-bearing assumption, research or ask — don't
  guess. On non-trivial work, confirm the understanding before implementing.

## Tests

- **Keep tests fast — everywhere, and watch the clock.** Fast feedback is a standing
  goal in every project; the everyday loop should feel like seconds, not minutes.
  Don't reflexively run the whole suite on every change. When a suite's time creeps
  up, say so **unprompted** and propose a fix — fast/default lane, split,
  parallelization — instead of treating the wait as unavoidable. The concrete lane
  is per-project; the vigilance is not.
- Where a project has tests and the change is testable, fix bugs **red→green**:
  write the failing test first and run it RED — a test you never saw fail may be
  testing nothing — then fix to green and keep it as the regression guard. Not
  blanket TDD for features; purely visual findings verify by screenshot.
- **A convenient stand-in can hide the one thing that breaks.** Subprocess test
  driving `process.execPath` proves the mechanism and nothing about the real
  program — that path is an `.exe` and never exercises the wrapper the tool
  actually ships. Where the environment is part of the contract, build the real
  artefact in the test rather than the substitute that is easy to reach for.

## Session handover

- At session start read `docs/HANDOVER.md` where the project has one — the previous
  session's baton. Before acting on it run `git log <its-sha>..HEAD --oneline` and
  `git status`: where they disagree the **tree wins** — the baton says what was
  intended, not what is, and its open items may already be done. Then answer in this
  order — where things stand, what the baton got wrong, the next step as a proposal
  — and wait for a yes before building.
- No baton, or no git: say so and answer from what you can measure, instead of
  reconstructing a plausible state.
- Refresh with `/handover`, and offer it unprompted once work has landed and the
  baton no longer matches HEAD.

## Communication

- The user is a product engineer, not a software developer: explain what a decision
  means for the end user and the trade-offs it carries, recommend rather than
  enumerate options, keep answers short and focused.

## Claude Code as a subprocess

- **Never pass `--bare`.** It ignores the subscription credentials, leaving only
  `ANTHROPIC_API_KEY` to authenticate with, so it bills by token behind the user's
  back — the opposite of what starting the logged-in CLI is for. Without that
  variable it refuses outright: `Not logged in · Please run /login`, exit 1. Same
  reason: never set that variable in the environment of a `-p` run.
- `--output-format stream-json` requires `--verbose`, else there is no stream. Its
  last line is the `result` object carrying text and cost; `--resume <session_id>`
  continues a conversation, enough to build a chat on the subscription without any
  API key.
- **`api_error_status` is present-and-null on success**, so `!== undefined` reads
  every successful run as a failure. Measured 2026-08-26: it silently replaced each
  run's own summary with `""`. Test a harness field for a *value*, never for presence
  — and prefer `is_error`, which the same `result` object carries.
- `--include-partial-messages` adds `stream_event` lines carrying
  `content_block_delta` — the answer while it is written, which fills a stage that
  otherwise sends nothing for minutes. **Most deltas are `thinking_delta`**, not
  `text_delta`, so filtering on the latter alone reproduces the very silence this
  flag exists to fix. Forward the text so far rather than each fragment, and let the
  finished turn replace it.

## Environment (this machine)

- Multi-line commit messages: write to a file and `git commit -F <file>`. PowerShell
  here-strings and pipelines pass only the first line to a Bash commit.
- Never round-trip an existing UTF-8 project file through PowerShell text pipelines
  (mangles the encoding) — edit through the Edit tool. Same for the scripts
  themselves: 5.1 reads a UTF-8 `.ps1` as ANSI, so a literal umlaut in a regex never
  matches what the program emitted — keep scripts ASCII.
- **A doubled backslash reaches the Bash tool as a single one** — inside a quoted
  heredoc and inside single quotes alike, so no quoting style protects it. `C:\\Users`
  written into a script becomes `C:\Users`, and where the next character forms an
  escape the file gets a real newline or backspace and stays syntactically valid: the
  program runs and works on a path nobody asked for. Write anything carrying Windows
  paths or regex escapes through the Write/Edit tool. Measured 2026-08-27.
- **Python heredoc patching source code eats its escapes, and one is invisible.** In
  a non-raw string `\b` is a *backspace character*: goes into the file, `tsc` accepts
  it, the regex silently stops matching. `\n` becomes a real line break, `\s`/`\d`/`\w`
  only warn. Patch code through the Edit tool; where a script is unavoidable, use raw
  strings or `chr(92)`. Measured 2026-08-26.
- **In PowerShell a missing command exits 1, not 127** — the Unix "command not found"
  code never arrives there, so a check written for it never fires. Bash *does* return
  127 (measured 2026-08-27; the entry claimed otherwise for both shells). Ask PATH
  (`which`) rather than the exit code, and resolve a path-shaped command against the
  project.
- **5.1 writes and sends the wrong bytes unless told otherwise, and both are silent.**
  `Set-Content -Encoding utf8` emits a **BOM**, making `JSON.parse` throw in every
  consumer that does not strip it; `Invoke-RestMethod -Body "<json>"` sends Latin-1,
  so umlauts arrive mojibaked server-side. Write files through the Edit/Write tools,
  and drive an app's HTTP API from the app, not from a shell. Measured 2026-08-25.
- PowerShell tool is **Windows PowerShell 5.1 on .NET Framework**: cannot reflect over
  a .NET 5+ assembly. `GetManifestResourceNames()` returning empty means *wrong tool*,
  not missing resources — verify from the target runtime.
- Screenshot a window with **PrintWindow**, not `CopyFromScreen`: a background process
  cannot raise the window, so the capture silently shows whatever is on top — privacy
  leak as well as useless test. Call `SetProcessDPIAware()` first, else
  `GetWindowRect` (logical px) and PrintWindow (physical px) disagree and the image is
  a crop.
- **Node cannot start a `.cmd`/`.bat` without a shell — and npm installs its programs
  as exactly those.** `claude`, `npx`, `aider` are wrappers, not executables: bare name
  fails `ENOENT`, absolute path throws `EINVAL` *synchronously*, escaping a
  `child.on("error")` handler and surfacing as an exception where every other failure
  is a result. Resolve the name over PATH×PATHEXT yourself and start it via
  `cmd.exe /c <resolved>`. Not `shell: true` — truncates an argument at the first space
  with no error, so an agent silently works on a fragment. Measured 2026-08-18. And
  cmd.exe reads one line: an argument containing a **newline** silently truncates the
  whole command line at it, following flags included, exit 0 (measured 2026-08-24) —
  multi-line text must travel via stdin, never as an argument.
- **Killing a process needs `taskkill /T /F`, immediately — from PowerShell.**
  `child.kill()` reaches only the direct process, and `taskkill /T` without `/F` sends
  console applications a window-close message they ignore — so children keep working
  while the UI reports "cancelled". Windows has no SIGTERM; the graceful attempt only
  costs time. Git Bash (MSYS) rewrites `/T /F /PID` as paths and the process survives.
- **Git Bash rewrites any argument that looks like a Unix path.** Not just `taskkill`
  flags: a literal `/news/` passed to a program arrives as `C:/Program Files/Git/news/`,
  so the program searches for something never asked for and reports zero matches rather
  than failing. Prefix with `MSYS_NO_PATHCONV=1` whenever an argument starts with `/`.
  Bash builtins are unaffected — `echo /news/` proves nothing, test with a native
  program.
- **A helper script outside the project cannot import the project's dependencies.**
  ESM resolves `node_modules` from the *script's* location, not the cwd, so a
  scratchpad tool importing `cheerio` dies with `ERR_MODULE_NOT_FOUND` however the
  invocation is written. Put throwaway analysis scripts in the repo and delete them
  afterwards.
- claude.ai/design share link (`/design/p/<uuid>`) is 403 for WebFetch; `DesignSync
  get_project` / `list_files` / `get_file` with that uuid returns the files (plain
  projects too, not only design systems).
- Browser pane: `navigate` to 127.0.0.1 *or* localhost is "blocked by policy" — open
  local servers with `preview_start {url}`. `computer key "Return"` never reaches the
  page as Enter, `"Enter"` does. Screenshot without `scale` is a 1:1 crop of the
  top-left; `scale: 1` is the whole viewport shrunk; `zoom` unsupported — and any
  screenshot fails outright while the pane is hidden, so verify server-rendered pages
  by fetching the HTML instead. *(volatile — tool behaviour)*
- `gh` (GitHub CLI) **is** installed and authenticated as `loonylabs-dev`, scopes
  `repo`/`workflow`/`gist`/`read:org` — creating a repo, opening a PR or querying the
  API needs no manual step. Verified 2026-08-27; the previous entry claimed the
  opposite and was believed for months because nobody ran `gh --version`.
  *(volatile — verify before relying)*
- **`fetch` gives up on a slow local model server after 5 minutes.** undici's
  headersTimeout (300 s) is not settable through fetch options and surfaces as a bare
  `TypeError: fetch failed` / `UND_ERR_HEADERS_TIMEOUT` — indistinguishable from the
  server being down. Use `node:http` with `setTimeout(0)` for model calls.
