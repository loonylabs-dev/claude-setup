# Templates to copy into a project

Nothing in here is ever loaded. These are starting points you copy out, fill in and then
own — the opposite of `skills/`, where a file is read at runtime.

| Folder | What it is for |
|---|---|
| [`claude-md/`](claude-md/) | The skeleton of a project's own `CLAUDE.md`. Copy it to `<project>/CLAUDE.md`, fill it in, delete what does not apply — including its header block, which explains the rules while you write it |
| [`custom-backend/`](custom-backend/) | Settings and a wrapper for a project that runs against your own inference backend instead of Anthropic's endpoint, where startup context is the binding constraint |

The two have nothing to do with each other. A project can need either, both or neither.
