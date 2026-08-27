/**
 * Guards hooks/bash-guard.mjs, which is fail-open and therefore cannot report its own
 * death: a broken guard and a guard with nothing to do look exactly alike from the
 * outside. This test is what tells them apart, and it is why the guard is allowed to
 * stay quiet.
 *
 * Two halves, and the second matters more. BLOCKS proves it still bites. ALLOWS proves
 * it does not bite anything else — a false block is worse than a missed one here,
 * because a guard that cries wolf gets switched off, and then all four rules are gone
 * rather than one.
 *
 * The deploy rule is tested through `matchesDeploy` rather than `check`, on purpose:
 * `check` would run git, so a test of it would pass or fail depending on whether the
 * checkout it happens to run in is behind its upstream. Command recognition is the part
 * that can be wrong in an interesting way; the git question is one `rev-list --count`.
 * What IS tested through `check` is that a deploy command in a directory that is not a
 * repository passes — the fail-open contract.
 *
 * Run:  node tests/bash-guard.test.mjs
 */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { check, matchesDeploy } from '../hooks/bash-guard.mjs'

const BLOCKS = [
  ['claude --bare -p "hi"', 'bare'],
  ['claude -p "hi" --bare', 'flag after the prompt'],
  ['sudo claude --bare', 'sudo prefix'],
  ['cd /tmp && claude --bare -p x', 'second segment'],
  ['git add -f secrets.json', 'add -f'],
  ['git add --force .credentials.json', 'long form'],
  ['git status; git add -f x', 'after a semicolon'],
  ['taskkill /T /PID 1234', 'taskkill without /F'],
  ['taskkill /PID 1234', 'bare taskkill'],
]

const ALLOWS = [
  ['claude -p "hello"', 'claude without the flag'],
  ['git add -A', 'ordinary add'],
  ['git add --all', 'ordinary add, long form'],
  ['git add -f', null, 'SEE BELOW'], // placeholder replaced below
  ['taskkill /T /F /PID 1234', 'taskkill done right'],
  ['taskkill /F /T /PID 1234', 'flags in the other order'],
  ['taskkill /f /t /pid 1234', 'lowercase flags'],
  ['echo "never use git add -f"', 'the pattern quoted inside another command'],
  ['grep -n "claude --bare" CLAUDE.md', 'the pattern as a search string'],
  ['node scripts/x.mjs --bare-metal', 'a flag that merely starts the same way'],
  ['npm run build', 'something unrelated'],
  ['git commit -F msg.txt', 'commit -F is not add -f'],
]
// the placeholder above would actually block; drop it rather than assert nonsense
ALLOWS.splice(3, 1)

let failed = 0
const ok = m => console.log('  ok  ' + m)
const bad = m => {
  console.log('  FAIL  ' + m)
  failed++
}

console.log('bash-guard')

for (const [cmd, why] of BLOCKS) {
  if (check('Bash', cmd)) ok(`blocks: ${cmd}   (${why})`)
  else bad(`should block but allowed: ${cmd}   (${why})`)
}

for (const [cmd, why] of ALLOWS) {
  const reason = check('Bash', cmd)
  if (!reason) ok(`allows: ${cmd}   (${why})`)
  else bad(`false block: ${cmd}   (${why})\n        reason was: ${reason}`)
}

// Fail-open contract: anything that is not a well-formed Bash call must pass through.
const PASSTHROUGH = [
  ['Read', 'claude --bare', 'another tool entirely'],
  ['Bash', undefined, 'missing command'],
  ['Bash', null, 'null command'],
  ['Bash', 42, 'command of the wrong type'],
  ['Bash', '', 'empty command'],
]
for (const [tool, cmd, why] of PASSTHROUGH) {
  if (!check(tool, cmd)) ok(`passes through: ${why}`)
  else bad(`blocked something it should not even inspect: ${why}`)
}

// --- the deploy rule: command recognition only -------------------------------------

const DEPLOY_YES = [
  ['railway up', 'the incident command'],
  ['railway up --detach', 'with a flag'],
  ['sudo railway up', 'sudo prefix'],
  ['npm run deploy', 'npm'],
  ['npm run deploy:prod', 'a scoped script name'],
  ['yarn deploy', 'yarn, no run'],
  ['pnpm deploy', 'pnpm, no run'],
  ['pnpm run deploy', 'pnpm with run'],
  ['vercel deploy', 'vercel'],
  ['fly deploy', 'fly'],
  ['netlify deploy --prod', 'netlify'],
]

const DEPLOY_NO = [
  ['git push', 'the way OUT of the divergence — must never block'],
  ['git push --force-with-lease origin main', 'still a push'],
  ['npm run deployment-notes', 'word boundary: deployment is not deploy'],
  ['npm run predeploy', 'a prefix is not the command'],
  ['npm run build', 'unrelated script'],
  ['railway logs', 'railway, but not up'],
  ['vercel dev', 'vercel, but not deploy'],
  ['echo "npm run deploy"', 'the pattern quoted inside another command'],
  ['grep -rn "railway up" docs/', 'the pattern as a search string'],
]

for (const [cmd, why] of DEPLOY_YES) {
  if (matchesDeploy(cmd)) ok(`deploy recognised: ${cmd}   (${why})`)
  else bad(`deploy NOT recognised: ${cmd}   (${why})`)
}

for (const [cmd, why] of DEPLOY_NO) {
  if (!matchesDeploy(cmd)) ok(`not a deploy: ${cmd}   (${why})`)
  else bad(`falsely recognised as deploy: ${cmd}   (${why})`)
}

// Fail-open where the git question cannot be answered: a directory with no repository
// in it or above it. mkdtemp under the OS temp dir is outside any checkout.
const noRepo = mkdtempSync(join(tmpdir(), 'bash-guard-'))
if (!check('Bash', 'railway up', noRepo)) ok('passes through: deploy outside any repository')
else bad('blocked a deploy where there is no upstream to compare against')

console.log(failed === 0 ? '\nall passed' : `\n${failed} failed`)
process.exit(failed === 0 ? 0 : 1)
