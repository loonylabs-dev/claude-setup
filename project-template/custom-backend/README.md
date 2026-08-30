# Custom-backend project setup

For a project that runs Claude Code against your own inference backend rather than
Anthropic's endpoint. There the startup context is the binding constraint: measured on one
setup, ~40k of a 64k window was gone before the first prompt, and these two files brought it
to ~13k.

**What each knob does, what it costs and what is not possible** is in
[`docs/context-budget.md`](../../docs/context-budget.md). This folder is only the copyable
part.

**Two knobs were dropped from this file on 2026-08-31 and are now commented out in it.**
`disableBundledSkills` was measured at **+3315 tokens for turning it on**, the opposite of what
it was here for. `ENABLE_TOOL_SEARCH` still saves 15–20k at startup, but every on-demand tool
load then inserts a schema into the middle of the `tools` array, and on a backend with a
positional prefix cache that is ~46 % of the prompt to re-prefill — each time. The ~13k above
was reached with both on, so treat it as a number to reproduce rather than to expect.

## Use

1. Copy `settings.local.json.example` → `<project>/.claude/settings.local.json`
2. Fill in the four `REPLACE-ME`-style values: base URL, token, and the two model names
3. Replace `YOU` in the `claudeMdExcludes` paths with your username, or drop those two lines
   if you want your global `CLAUDE.md` to apply in this project after all
4. Copy `start-claude.cmd.example` → `<project>/<project-name>.cmd` and start the project
   with it instead of `claude`
5. Start once, run `/context`, and compare against the breakdown in the doc

`skillOverrides` and `enabledPlugins` are left empty on purpose — what belongs there depends
on which skills and plugins you have. `docs/context-budget.md` §3 and §4 explain the values.

## Before the first commit

`settings.local.json` holds an auth token in plaintext. If the project becomes a git
repository, `.gitignore` has to cover `.claude/settings.local.json` **and** any `.bak-*`
copies before anything is committed. That is why the file here carries `.example` and no
real values.
