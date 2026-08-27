# Security

## What this repository is, in security terms

It is the *published* half of a `~/.claude` directory. The unpublished half sits in the same
folder on the author's machine and includes `.credentials.json` (an OAuth token), `projects/`
(complete session transcripts), and `history.jsonl` (every prompt ever typed).

Keeping those apart rests on one mechanism: the `.gitignore` is an **allowlist**. Its first
rule is `*` — everything ignored — and only explicitly opted-in paths are un-ignored below
it. A new file Claude Code creates is therefore untracked by default.

**The limit of that guarantee.** Inside the opted-in directories (`rules/`, `skills/`,
`docs/`, `hooks/`, `tests/`, `scripts/`, `project-template/`) the un-ignore rules reach
recursively. Anything placed there **is** tracked, which is required — those directories have
nested content — but it means a secret written into a skill script would be committed. The
allowlist is a path filter, not a secret scanner.

## Reporting

If you find credentials, tokens, private paths or anything else in this repository that
should not be public, please open an issue **without quoting the value**: the file and line
are enough to act on, and an issue is itself public. For anything you would rather not post
at all, use GitHub's private vulnerability reporting on this repository.

There is no bounty and no SLA. This is a personal configuration repository, not a service.

## What runs when you clone this

Two things execute rather than merely being read, and you should know about both before
running them:

**`hooks/bash-guard.mjs`** is registered in `settings.json` as a `PreToolUse` hook, so it runs
before every Bash command in every session. It reads JSON on stdin, matches three patterns,
and either stays silent or returns a deny decision. It touches no files, opens no network
connection, and is fail-open: any error exits 0 and lets the command through. It is about
60 lines — read it.

**`scripts/strip-volatile-settings.mjs`** runs as a git clean filter on `settings.json`. It
removes the keys the Claude Code UI rewrites and sorts the rest. It only ever writes to
stdout.

Nothing else in this repository executes on its own. The status line wrappers run only if you
configure a status line, and `project-template/` is copied out by hand, never loaded.

## A note on the environment rules

`CLAUDE.md` documents several ways this platform fails silently — a doubled backslash being
reduced on its way through a shell, PowerShell writing a BOM into JSON, Node refusing to spawn
a `.cmd`. These are recorded as reliability findings, not as exploitation techniques, and the
same defensive framing is expected of anything added to them.
