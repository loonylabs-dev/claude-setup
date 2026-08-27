/**
 * Guards the clean filter that keeps UI-written keys out of settings.json's history.
 *
 * Why this test exists: the Claude Code UI rewrites `model` and `effortLevel` in
 * ~/.claude/settings.json whenever the model or the effort level is switched. With
 * settings.json versioned, those writes land in every diff, and a model picked for
 * one session ("haiku") silently becomes the committed default for every machine
 * that restores this repository.
 *
 * The filter lives in scripts/strip-volatile-settings.mjs and is bound by
 * .gitattributes — but its registration is per machine (.git/config), so a fresh
 * clone has the binding and not the filter. That gap is the failure this test is
 * built to be loud about: without the registration git commits the file unfiltered
 * and says nothing.
 *
 * Run:  node tests/settings-hygiene.test.mjs
 */
import { execFileSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const VOLATILE_KEYS = ['model', 'effortLevel', 'modelSettings', 'fastMode']
const SETUP = [
  'git config filter.claude-settings.clean "node scripts/strip-volatile-settings.mjs"',
  'git config filter.claude-settings.required true',
].join('\n  ')

const failures = []
const check = (name, fn) => {
  try {
    fn()
    console.log(`  ok  ${name}`)
  } catch (error) {
    failures.push(`${name}: ${error.message}`)
    console.log(`FAIL  ${name}\n      ${error.message}`)
  }
}

const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim()
const gitOrEmpty = (...args) => {
  try {
    return git(...args)
  } catch {
    return ''
  }
}

const keysIn = (json, where) => {
  let parsed
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    throw new Error(`${where} is not valid JSON — ${error.message}`)
  }
  return VOLATILE_KEYS.filter((key) => key in parsed)
}

console.log('settings.json hygiene')

check('the filter is registered on this machine', () => {
  const clean = gitOrEmpty('config', '--get', 'filter.claude-settings.clean')
  if (!clean) throw new Error(`filter.claude-settings.clean is unset. Register it:\n  ${SETUP}`)
})

check('a failing filter aborts the commit instead of passing the file through', () => {
  const required = gitOrEmpty('config', '--get', 'filter.claude-settings.required')
  if (required !== 'true') {
    throw new Error(`filter.claude-settings.required is "${required || 'unset'}", expected "true". Fix:\n  ${SETUP}`)
  }
})

check('.gitattributes binds settings.json to the filter', () => {
  const attr = git('check-attr', 'filter', '--', 'settings.json')
  if (!attr.endsWith(': claude-settings')) throw new Error(`expected filter=claude-settings, got "${attr}"`)
})

check('the committed settings.json carries no volatile key', () => {
  const found = keysIn(git('show', 'HEAD:settings.json'), 'HEAD:settings.json')
  if (found.length) throw new Error(`committed: ${found.join(', ')}`)
})

check('the staged settings.json carries no volatile key', () => {
  const found = keysIn(git('show', ':settings.json'), 'the index copy of settings.json')
  if (found.length) throw new Error(`staged: ${found.join(', ')} — was the filter bypassed?`)
})

// The second job of the filter. A rewrite that only reorders keys — `claude plugin
// install` does this — is a diff with no content in it, and the tempting reaction to
// such a diff is `git checkout`, which would silently drop the volatile keys from
// the working file. Sorting removes the diff, so the temptation never arises.
check('the committed settings.json is key-sorted', () => {
  const keys = Object.keys(JSON.parse(git('show', 'HEAD:settings.json')))
  const sorted = [...keys].sort()
  const at = keys.findIndex((k, i) => k !== sorted[i])
  if (at !== -1) throw new Error(`first out of order at position ${at}: "${keys[at]}", expected "${sorted[at]}"`)
})

console.log(failures.length ? `\n${failures.length} failed` : '\nall passed')
process.exit(failures.length ? 1 : 0)
