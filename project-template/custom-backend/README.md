# Custom-backend project setup

For a project that runs Claude Code against your own inference backend rather than
Anthropic's endpoint. There the startup context is the binding constraint: measured on one
setup, ~40k of a 64k window was gone before the first prompt, and these two files brought it
to ~13k.

**What each knob does, what it costs and what is not possible** is in
[`docs/context-budget.md`](../../docs/context-budget.md). This folder is only the copyable
part.

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
