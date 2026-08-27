#!/usr/bin/env node
// Git clean filter for settings.json. It does two things, against two different
// ways the file gets rewritten behind your back:
//
//   1. Drops the keys the UI rewrites on its own, so a model switch or an effort
//      change never shows up as a diff.
//   2. Sorts the remaining keys, so a rewrite that only REORDERS them shows up as
//      nothing at all. `claude plugin install` does exactly that: it rewrote this
//      file on 2026-08-27 and moved one key from third position to last, for a diff
//      with no content in it.
//
// Sorting costs the file's thematic grouping (permissions, then model, then UI) —
// but only in the versioned copy. Your working file keeps whatever order the last
// writer left, because a clean filter runs on the way INTO git and never back out.
// A fresh clone is where you would notice: it arrives sorted.
//
// The local file keeps every key — only what git sees is filtered. Registered per
// machine (it lives in .git/config, not in the repository):
//
//   git config filter.claude-settings.clean "node scripts/strip-volatile-settings.mjs"
//   git config filter.claude-settings.required true
//
// `required true` makes a broken filter abort the commit instead of silently
// committing the unfiltered file. tests/settings-hygiene.test.mjs checks both the
// registration and the result.

const VOLATILE_KEYS = [
  'model',          // /model, and the model picker
  'effortLevel',    // /config effort switch
  'modelSettings',  // per-model effort, written alongside effortLevel
  'fastMode',       // /fast toggle

  // Not a UI toggle but the same problem: `claude plugin marketplace add` writes an
  // absolute path of THIS machine here. It is a per-machine registration, like the
  // filter's own git config entry, and it breaks on any other checkout. Which
  // marketplaces to add is documented in the README instead. `enabledPlugins` stays
  // versioned — that one is a decision, not a location.
  'extraKnownMarketplaces',
]

const chunks = []
for await (const chunk of process.stdin) chunks.push(chunk)
const raw = Buffer.concat(chunks).toString('utf8')

let settings
try {
  settings = JSON.parse(raw)
} catch (error) {
  process.stderr.write(`strip-volatile-settings: settings.json is not valid JSON — ${error.message}\n`)
  process.exit(1)
}

for (const key of VOLATILE_KEYS) delete settings[key]

// Top level only. Nested objects keep their own order, because that order is
// written by whoever owns the block (enabledPlugins by the plugin CLI, permissions
// by hand) and reordering it would trade one kind of noise for another.
const sorted = Object.fromEntries(Object.keys(settings).sort().map((k) => [k, settings[k]]))

process.stdout.write(JSON.stringify(sorted, null, 2) + '\n')
