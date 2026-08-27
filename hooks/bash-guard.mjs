/**
 * PreToolUse guard for the Bash tool. Refuses four commands that CLAUDE.md and one
 * incident call "never" — as a gate rather than a request, because a rule only helps
 * while it is in context and a command has no file to hang a path-scoped rule on.
 *
 * FAIL-OPEN BY CONSTRUCTION. Every error path exits 0 without output, which lets the
 * command through. A guard that breaks must become invisible, not block the session
 * or complain on every single Bash call. The cost of that choice is that it can stop
 * working silently — tests/bash-guard.test.mjs and the CI workflow are the answer to
 * that, not defensive noise here.
 *
 * Matching is per command SEGMENT, split on && || ; and |, and anchored at the start
 * of each. `echo "never use git add -f"` therefore passes: the pattern has to be the
 * command being run, not text inside it. That is deliberately lenient — a false block
 * costs trust in the guard, a missed match costs one of four rare mistakes.
 *
 * Input arrives as JSON on stdin (tool_name, tool_input.command, cwd). Blocking is
 * exit 0 plus a permissionDecision on stdout.
 */
import { execFileSync } from 'node:child_process'

const RULES = [
  {
    // Skips the subscription login, leaving only ANTHROPIC_API_KEY — bills by token.
    test: seg => /^(sudo\s+)?claude\b/.test(seg) && /\s--bare\b/.test(seg),
    reason:
      'CLAUDE.md: never pass `--bare`. It ignores the subscription credentials and ' +
      'bills by token. Drop the flag, or run `claude` without it.',
  },
  {
    // The allowlist .gitignore is the only thing keeping credentials out of history.
    test: seg => /^(sudo\s+)?git\s+add\b/.test(seg) && /\s(-f|--force)\b/.test(seg),
    reason:
      'README: never `git add -f`. The .gitignore here is an allowlist protecting ' +
      '.credentials.json and projects/. If a file is missing, add a `!` rule instead.',
  },
  {
    // Without /F console applications ignore the close message and keep running.
    test: seg => /^(sudo\s+)?taskkill\b/.test(seg) && !/\s\/f\b/i.test(seg),
    reason:
      'CLAUDE.md: taskkill needs /T /F. Without /F a console application ignores the ' +
      'window-close message and keeps working while the UI reports it stopped.',
  },
]

/**
 * Deploy commands, kept deliberately narrow. `git push` is NOT among them: it is the
 * way OUT of the divergence, and git refuses a non-fast-forward by itself anyway.
 *
 * The trailing (\s|$) is what keeps `npm run deployment-notes` from matching.
 */
const DEPLOY = [
  /^(sudo\s+)?railway\s+up(\s|$)/,
  /^(sudo\s+)?(npm|yarn|pnpm)\s+(run\s+)?deploy(:[\w.-]+)?(\s|$)/,
  /^(sudo\s+)?(vercel|fly|netlify)\s+deploy(\s|$)/,
]

/** Exported for the test: pure text matching, no git, no side effects. */
export function matchesDeploy(seg) {
  return DEPLOY.some(re => re.test(seg))
}

/**
 * How many commits the upstream is ahead of HEAD. 0 means "up to date, or unknown".
 *
 * DELIBERATELY DOES NOT FETCH. Network inside a PreToolUse hook can hang, and with
 * fail-open a hang would mean "let it through" in exactly the situation the gate
 * exists for. This reads the LOCAL remote ref only.
 *
 * THE HONEST LIMIT, and the next session should not mistake this guard for more:
 * if nobody ever fetched, this reports 0 with full confidence and the deploy goes
 * ahead. The incident of 2026-08-27 would have been caught — the ref was current and
 * `git status -sb` had been saying `behind 11` for hours; only `git status --short`
 * had been used, which does not show branch divergence. A clone that has not fetched
 * in weeks is NOT covered. The other half of that belongs in the project's own deploy
 * script, where the network is already in play regardless.
 *
 * Second limit: it asks about the session's cwd. `cd elsewhere && npm run deploy`
 * is measured against the wrong repository.
 *
 * Third, and it decides where this rule actually bites: a command that does not pass
 * the permission check never reaches the hook at all. Measured — `railway up` came
 * back as "requires approval" before the guard was consulted, in three permission
 * modes. So this gate matters where a deploy command is ALLOWED (a project allowlist,
 * an autonomous run); where it prompts anyway, a human sees the command — though not,
 * of course, that HEAD is behind, which is the whole point.
 */
function commitsBehindUpstream(cwd) {
  const opts = {
    cwd: cwd || undefined,
    encoding: 'utf8',
    timeout: 2000,
    stdio: ['ignore', 'pipe', 'ignore'],
    windowsHide: true,
  }
  try {
    const upstream = execFileSync(
      'git',
      ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'],
      opts
    ).trim()
    if (!upstream) return 0
    const out = execFileSync('git', ['rev-list', '--count', `HEAD..${upstream}`], opts).trim()
    const n = Number.parseInt(out, 10)
    return Number.isFinite(n) && n > 0 ? n : 0
  } catch {
    // No repo, no upstream, no git, or a timeout — none of them is a reason to block.
    return 0
  }
}

function segments(command) {
  return command
    .split(/&&|\|\||;|\|/)
    .map(s => s.trim())
    .filter(Boolean)
}

/** Returns the reason to block on, or null to allow. */
export function check(toolName, command, cwd) {
  if (toolName !== 'Bash' || typeof command !== 'string') return null

  for (const seg of segments(command)) {
    for (const rule of RULES) {
      if (rule.test(seg)) return rule.reason
    }
  }

  // Only now, and only for a segment that IS a deploy command, is git worth a process
  // start. Doing this for every Bash call would tax every `ls` in the session.
  for (const seg of segments(command)) {
    if (!matchesDeploy(seg)) continue
    const behind = commitsBehindUpstream(cwd)
    if (behind > 0) {
      return (
        `HEAD is ${behind} commit${behind === 1 ? '' : 's'} behind its upstream. ` +
        'Deploying from here would roll production back to an older tree — the working ' +
        'tree can be clean and every gate green while this is true, because they all ' +
        'describe the tree you HAVE. Run `git pull --rebase`, then deploy again. ' +
        'For a deliberate rollback, run the deploy command yourself outside this session.'
      )
    }
  }

  return null
}

function main() {
  let raw = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', chunk => (raw += chunk))
  process.stdin.on('end', () => {
    try {
      const input = JSON.parse(raw)
      const reason = check(
        input.tool_name,
        input.tool_input && input.tool_input.command,
        input.cwd
      )
      if (reason) {
        process.stdout.write(
          JSON.stringify({
            hookSpecificOutput: {
              hookEventName: 'PreToolUse',
              permissionDecision: 'deny',
              permissionDecisionReason: reason,
            },
          })
        )
      }
    } catch {
      // fail-open: unreadable input is not a reason to stand in the way
    }
    process.exit(0)
  })
  process.stdin.on('error', () => process.exit(0))
}

// Only run as a hook, not when the test imports check().
if (process.argv[1] && process.argv[1].endsWith('bash-guard.mjs')) main()
