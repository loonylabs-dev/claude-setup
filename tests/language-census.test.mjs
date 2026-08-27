/**
 * Fails when a tracked text file is German that is not on one of the two lists below.
 *
 * Why this test exists: the repository carries a German layer from the July 2026
 * consolidation and an English one written since, and nothing kept them apart. The
 * rule in language.md says artefacts are English — but a rule that only lives in
 * prose is exactly what produced the mix: on the day the language was switched to
 * English, a German skill was added, and months later a German comment went into
 * .gitignore inside an otherwise English commit. Neither raised anything.
 *
 * MIGRATING is the work list: every entry is a file still to be translated, and the
 * migration is done when the array is empty. Shrink it as blocks land — never grow it.
 *
 * ARCHIVE is permanent: dated records of something that happened (a concept protocol,
 * a measurement log). Translating those would rewrite history rather than maintain it,
 * which language.md and the README both rule out.
 *
 * The detector is a heuristic, not a language identifier, and it needs two signals
 * because one is not enough. Function-word density catches German prose: a long
 * English file trips a few markers by chance, a German file trips them in every
 * sentence — hence a ratio, not a raw count. But German diluted across a large code
 * file stays under any useful ratio, so umlauts count separately: three or more mean
 * German whatever the density says. (One or two are a quotation, as in language.md,
 * which cites ß while being English.) Neither signal sees a single German sentence
 * buried in a long English file.
 *
 * Run:  node tests/language-census.test.mjs
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const THRESHOLD = 0.015
const UMLAUT_LIMIT = 3
const UMLAUT = /[äöüßÄÖÜ]/g

const GERMAN =
  /\b(nicht|wird|werden|und|oder|aber|eine|einen|einem|einer|dass|sich|nach|beim|durch|kein|keine|wenn|dann|auch|noch|schon|welche|zwischen|sondern|damit|weil|muss|kann|soll|ist|sind|wie|ohne|nur|sehr|bei|zum|zur|vom|dem|den|des|fuer|ueber|waere|koennen|muessen|Datei|Verzeichnis)\b/gi

// Still to translate. Shrink this; never add to it.
// Empty since 2026-08-27: the migration is done, and this array staying empty is
// what the test is for now — a new German file has nowhere to hide.
const MIGRATING = []

// English programs that carry German as DATA: word lists, detector regexes, the
// markers this very file matches on. They read as German to any heuristic and
// always will, so they are skipped — and therefore never checked.
const DETECTORS = ['scripts/claude-md-audit.mjs', 'tests/language-census.test.mjs']

// Dated records that stay German permanently. Empty since 2026-08-27: the two
// devloop measurement logs left with their skill when the sixteen project-bound
// skills moved to the ll plugin. Every tracked file here is English now, without
// exception — if that ever needs one again, it goes in this list with a reason.
const ARCHIVE = []

const tracked = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' }).trim().split('\n')
const german = []
const germanLines = []

for (const file of tracked) {
  if (!/\.(md|mjs|js|ps1|sh|json)$|^\.gitignore$/.test(file)) continue
  if (DETECTORS.includes(file)) continue
  let text
  try {
    text = readFileSync(join(ROOT, file), 'utf8')
  } catch {
    continue
  }
  const words = text.split(/\s+/).length
  if (!words) continue
  const ratio = (text.match(GERMAN) || []).length / words
  const umlauts = (text.match(UMLAUT) || []).length
  if (ratio > THRESHOLD || umlauts >= UMLAUT_LIMIT) german.push({ file, ratio, umlauts })

  // Per LINE, because both signals above are ratios over a whole file and a single
  // German paragraph inside a long English one clears neither. Measured 2026-08-27:
  // the three that had slipped through sat at ratio 0.003-0.010 against a 0.015
  // threshold and at exactly 2 umlauts against a limit of 3 — every one of them just
  // under. No threshold would have caught them without firing elsewhere; the file was
  // the wrong unit. One umlaut plus two function words IN THE SAME LINE is the signal:
  // a line quoting "ß" as a character carries no German sentence around it.
  if (ARCHIVE.includes(file)) continue
  const lines = text.split(/\r?\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!UMLAUT.test(line)) continue
    UMLAUT.lastIndex = 0
    const markers = (line.match(GERMAN) || []).length
    if (markers >= 2) germanLines.push({ file, line: i + 1, text: line.trim().slice(0, 90) })
  }
}

const listed = new Set([...MIGRATING, ...ARCHIVE])
const unexpected = german.filter((g) => !listed.has(g.file))
const done = MIGRATING.filter((f) => !german.some((g) => g.file === f))

console.log(`language census — threshold ${THRESHOLD}`)
console.log(`  ${german.length} German files, ${MIGRATING.length} on the work list, ${ARCHIVE.length} archived`)

if (done.length) {
  console.log(`\nTranslated but still listed as MIGRATING — remove from the array:`)
  for (const f of done) console.log(`  ${f}`)
}

if (unexpected.length) {
  console.log(`\nGerman and on no list:`)
  for (const g of unexpected) console.log(`  r=${g.ratio.toFixed(3)} umlauts=${g.umlauts}  ${g.file}`)
  console.log(`\nArtefacts are English (language.md). Translate it, or add it to ARCHIVE if it is a dated record.`)
}

if (germanLines.length) {
  console.log(`\nGerman lines inside otherwise English files:`)
  for (const g of germanLines) console.log(`  ${g.file}:${g.line}\n      ${g.text}`)
  console.log(`\nA whole file reads as English while one paragraph is not. Translate the line.`)
}

const remaining = MIGRATING.length - done.length
const failures = done.length + unexpected.length + germanLines.length
console.log(
  failures
    ? `\nFAIL — ${unexpected.length} unlisted, ${done.length} stale entries, ${germanLines.length} German lines`
    : `\nok — ${remaining} files left to migrate, no German lines`,
)
process.exit(failures ? 1 : 0)
