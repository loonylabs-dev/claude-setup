/**
 * Fails when a file in rules/ would load unconditionally, or carries a glob that
 * silently matches nothing.
 *
 * Why this test exists: rules/ holds the sections of CLAUDE.md that only hold for
 * some projects. Their whole point is the `paths` frontmatter — Claude Code loads
 * such a file when it reads a matching file and never otherwise. A rule file WITHOUT
 * that frontmatter is legal and loads in every session of every project: it is a
 * second CLAUDE.md, only invisible, because the one everybody looks at got smaller.
 * Nothing reports that. Hence the guard.
 *
 * The second check is the failure mode the official docs name: glob syntax reads `[`
 * as the start of a bracket expression, so an unbalanced `[` matches nothing and the
 * rule simply never loads. Same silent shape as the first — a rule that is present,
 * costs nothing, and does nothing.
 *
 * What this test canNOT do: verify that a rule actually loads. That takes a live
 * session; the InstructionsLoaded hook with matcher `path_glob_match` is how it was
 * measured on 2.1.245 (docs/context-budget.md, section 5, has the procedure).
 *
 * Run:  node tests/rules-hygiene.test.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RULES = join(ROOT, 'rules')

// The docs cap a rule's whole paths list at 1000 expanded patterns; anything over it
// is used unexpanded, so its literal braces match no files.
const BRACE_BUDGET = 1000

function walk(dir) {
  let out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out = out.concat(walk(full))
    else if (entry.endsWith('.md')) out.push(full)
  }
  return out
}

/** Expanded pattern count for one glob: each brace group multiplies. */
function expansions(pattern) {
  let n = 1
  for (const group of pattern.matchAll(/\{([^{}]*)\}/g)) n *= group[1].split(',').length
  return n
}

/** Bracket expressions must close, else the pattern matches nothing. */
function unbalancedBracket(pattern) {
  let open = false
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i]
    if (c === '\\') { i++; continue }
    if (c === '[') { if (open) return true; open = true }
    else if (c === ']' && open) open = false
  }
  return open
}

/** Minimal reader for the one field we care about — no YAML dependency. */
function readPaths(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const lines = m[1].split(/\r?\n/)
  const start = lines.findIndex(l => /^paths:/.test(l))
  if (start === -1) return null
  const globs = []
  for (const line of lines.slice(start + 1)) {
    const item = line.match(/^\s*-\s*["']?(.+?)["']?\s*$/)
    if (!item) break
    globs.push(item[1])
  }
  return globs
}

let failed = 0
const fail = msg => { console.log('  FAIL  ' + msg); failed++ }
const ok = msg => console.log('  ok  ' + msg)

console.log('rules/ hygiene')

let files
try {
  files = walk(RULES)
} catch {
  console.log('  ok  no rules/ directory — nothing to check')
  process.exit(0)
}

if (files.length === 0) console.log('  ok  rules/ is empty — nothing to check')

for (const file of files) {
  const name = relative(ROOT, file).replace(/\\/g, '/')
  const globs = readPaths(readFileSync(file, 'utf8'))

  if (globs === null) {
    fail(`${name} has no \`paths\` frontmatter — it would load in every session. ` +
      'A rule that always applies belongs in CLAUDE.md, where its cost is visible.')
    continue
  }
  if (globs.length === 0) {
    fail(`${name} has an empty \`paths\` list — it matches nothing and never loads.`)
    continue
  }

  const broken = globs.filter(unbalancedBracket)
  if (broken.length) {
    fail(`${name}: unbalanced [ in ${broken.join(', ')} — matches nothing. ` +
      'Escape a literal bracket as \\[.')
    continue
  }

  const total = globs.reduce((sum, g) => sum + (expansions(g) > 1 ? expansions(g) : 0), 0)
  if (total > BRACE_BUDGET) {
    fail(`${name}: ${total} expanded patterns exceeds the ${BRACE_BUDGET} budget — ` +
      'Claude Code then uses them unexpanded and the literal braces match no files.')
    continue
  }

  ok(`${name} — ${globs.length} glob${globs.length === 1 ? '' : 's'}, conditional`)
}

console.log(failed === 0 ? '\nall passed' : `\n${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
