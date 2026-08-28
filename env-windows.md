# Environment — Windows

Loaded only on a Windows machine, through `env-local.md`, which `hooks/select-env.mjs`
writes at session start. Nothing here is true on Linux or macOS; anything that turned
out to hold everywhere belongs in the **Tools and runtime** section of `CLAUDE.md`
instead.

- Multi-line commit messages: write to a file and `git commit -F <file>`. PowerShell
  here-strings and pipelines pass only the first line to a Bash commit.
- Never round-trip an existing UTF-8 project file through PowerShell text pipelines
  (mangles the encoding) — edit through the Edit tool. Same for the scripts
  themselves: 5.1 reads a UTF-8 `.ps1` as ANSI, so a literal umlaut in a regex never
  matches what the program emitted — keep scripts ASCII.
- **In PowerShell a missing command exits 1, not 127** — the Unix "command not
  found" code never arrives there, so a check written for it never fires. (Bash
  *does* return 127; the general rule lives in `CLAUDE.md`.)
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
- **This one is a machine fact, not a Windows fact** — it belongs in `env-machine.md`,
  which is not versioned. Moving it would delete it from the repository with nowhere to
  put it, so it stays here until this machine writes it into its own file.
  `gh` (GitHub CLI) **is** installed and authenticated as `loonylabs-dev`, scopes
  `repo`/`workflow`/`gist`/`read:org` — creating a repo, opening a PR or querying the
  API needs no manual step. Verified 2026-08-27; the previous entry claimed the
  opposite and was believed for months because nobody ran `gh --version`.
  *(volatile — verify before relying)*
