/**
 * Guards the per-OS environment split.
 *
 * Why this test exists: `@` imports are unconditional, so the choice of which
 * environment file loads is made by hooks/select-env.mjs at session start. Every way
 * that can go wrong is SILENT. A missing import target loads nothing and reports
 * nothing — measured 2026-08-28: with env-local.md removed the session started
 * cleanly, the InstructionsLoaded hook logged only CLAUDE.md, and the model simply
 * had no environment rules. Nothing in Claude Code says a word about it.
 *
 * So the checks below are mostly about absence being noticed. The pure ones run in
 * CI; the last one asks about THIS machine and is the reason the whole file cannot.
 *
 * Run:  node tests/env-select.test.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { envFileFor, render, renderFailure } from '../hooks/select-env.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let failed = 0
const fail = msg => { console.log('  FAIL  ' + msg); failed++ }
const ok = msg => console.log('  ok  ' + msg)
const check = (cond, msg) => (cond ? ok(msg) : fail(msg))

console.log('per-OS environment split')

// --- the mapping ------------------------------------------------------------
for (const [platform, expected] of [
  ['win32', 'env-windows.md'],
  ['darwin', 'env-macos.md'],
  ['linux', 'env-linux.md'],
  ['freebsd', 'env-linux.md'],
]) {
  const actual = envFileFor(platform)
  check(actual === expected, `${platform} selects ${expected}${actual === expected ? '' : ` — got ${actual}`}`)
}

// --- what the hook writes ---------------------------------------------------
const present = render('linux', true)
check(present.includes('@env-linux.md'), 'an existing OS file is imported')
check(present.includes('@env-machine.md'), 'env-machine.md is always imported')

// The sharp one: a missing OS file must NOT produce a dangling import, because that
// is exactly the failure that says nothing. It has to arrive as prose the model reads.
const absent = render('darwin', false)
check(!/^@env-macos\.md$/m.test(absent), 'a missing OS file produces no dangling import')
check(/no environment file/i.test(absent), 'a missing OS file is stated in prose instead')

// A failure of the selection itself is the case with no channel to report it: measured
// 2026-08-28, Claude Code discards a SessionStart hook's exit code and its stderr. So the
// pointer has to carry the bad news, and must not leave a stale import standing.
const broken = renderFailure('EACCES: permission denied')
check(!/^@env-(windows|linux|macos)\.md$/m.test(broken), 'a failed selection imports no OS file')
check(/selection failed/i.test(broken), 'a failed selection says so in prose')
check(/EACCES/.test(broken), 'a failed selection carries the underlying error')
check(broken.includes('@env-machine.md'), 'a failed selection still imports the machine notes')

// --- the wiring -------------------------------------------------------------
const claudeMd = readFileSync(join(ROOT, 'CLAUDE.md'), 'utf8')
check(/^@env-local\.md$/m.test(claudeMd), 'CLAUDE.md imports @env-local.md')

const settings = JSON.parse(readFileSync(join(ROOT, 'settings.json'), 'utf8'))
const sessionStart = settings.hooks?.SessionStart ?? []
const registered = sessionStart.some(entry =>
  (entry.hooks ?? []).some(h => (h.command ?? '').includes('select-env.mjs'))
)
check(registered, 'settings.json registers select-env.mjs as a SessionStart hook')

// The generated pointer and this machine's own notes must stay out of the repository.
// A stray `!` rule in .gitignore would publish them, and env-machine.md is where
// installation facts live.
try {
  for (const f of ['env-local.md', 'env-machine.md']) {
    let ignored = true
    try {
      execFileSync('git', ['check-ignore', '-q', f], { cwd: ROOT, stdio: 'ignore' })
    } catch {
      ignored = false
    }
    check(ignored, `${f} is not versioned`)
  }
} catch {
  ok('git unavailable — skipped the ignore check')
}

// --- this machine (why this test does not run in CI) ------------------------
const expectedHere = envFileFor(process.platform)
const localPath = join(ROOT, 'env-local.md')
if (!existsSync(localPath)) {
  fail(
    'env-local.md is missing — this session started without environment rules and ' +
      'nothing said so. Run:  node hooks/select-env.mjs'
  )
} else {
  const local = readFileSync(localPath, 'utf8')
  check(
    local.includes(`@${expectedHere}`) || !existsSync(join(ROOT, expectedHere)),
    `env-local.md points at ${expectedHere} for platform ${process.platform}`
  )
}

console.log(failed === 0 ? '\nall passed' : `\n${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
