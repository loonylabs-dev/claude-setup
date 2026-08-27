#!/usr/bin/env node
/**
 * claude-md-audit — measure a CLAUDE.md the way it actually costs.
 *
 * Size is reported in CHARACTERS, not lines. A line budget invites denser lines
 * and then reports "no growth" while the file grows: measured on one project,
 * three consecutive commits sat pinned at 399 lines (one under a 400-line gate)
 * while the file went 27099 -> 27625 chars, and average line density drifted
 * 62 -> 69 chars over a week.
 *
 * Replaces the hand-typed size probes the hygiene pass used to dictate. It does
 * NOT find stale entries or duplicated laws — those still need greps, see the
 * hygiene command.
 *
 * Usage:
 *   node claude-md-audit.mjs [path] [--soft <KB>] [--hard <KB>] [--top <n>] [--lang de|en]
 *
 * Budget: --soft/--hard win; else a line STARTING with "Budget" that names KB
 * (e.g. "Budget ~23 KB (hard gate 25 KB)"); else the defaults below.
 *
 * Exit: 0 within budget · 3 over soft · 1 over hard gate · 2 usage error.
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

// Calibrated against real, honestly-compressed project files rather than guessed:
// One project landed at 29.3 KB after a 38% pass whose remaining paragraphs were each
// verified load-bearing; a second sits at 26.8 KB. A mature project with deep
// accumulated law costs about that; the default sits just above it, so a well-kept
// file passes quietly and a neglected one (114 KB was the worst seen) still flags loudly.
const DEFAULT_SOFT_KB = 30;
const DEFAULT_HARD_KB = 35;

// Heuristic, NOT a tokenizer. Mixed German/English technical prose with code
// spans runs roughly here; treat the figure as an order of magnitude.
const CHARS_PER_TOKEN = 3.7;

// "KB" here means kilo-CHARACTERS (chars/1024), not UTF-8 kilobytes; for these
// files the two differ by ~1-2%.
const FILLER_WORDS_EN = ["a", "an", "the", "is", "are", "was", "were", "that", "which", "now", "then", "just", "simply", "actually", "very", "really"];
const FILLER_WORDS_DE = ["der", "die", "das", "den", "dem", "des", "ein", "eine", "einen", "einem", "einer", "ist", "sind", "wird", "werden", "dann", "auch", "noch", "sehr", "eigentlich"];
const FILLER_PHRASES = ["in order to", "of the", "there is", "there are", "es gibt"];

const GERMAN_MARKERS = /[äöüß]|\b(der|die|das|und|ist|nicht|werden|wird|eine|einen|nach|beim|durch)\b/i;

function parseArgs(argv) {
  const out = { path: null, soft: null, hard: null, top: 8, lang: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const eq = a.indexOf("=");
    const key = eq > 0 ? a.slice(0, eq) : a;
    const inlineVal = eq > 0 ? a.slice(eq + 1) : null;
    const take = () => inlineVal ?? argv[++i];
    if (key === "--soft") out.soft = Number(take());
    else if (key === "--hard") out.hard = Number(take());
    else if (key === "--top") out.top = Number(take());
    else if (key === "--lang") out.lang = String(take()).toLowerCase();
    else if (key.startsWith("--")) {
      console.error(`claude-md-audit: unknown option ${key}`);
      process.exit(2);
    } else out.path = a;
  }
  return out;
}

/**
 * Blank out fenced blocks and inline spans while PRESERVING line structure, so
 * prose checks never fire on code and line numbers still line up with the file.
 */
function stripCode(text) {
  return text
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/`[^`\n]*`/g, (m) => " ".repeat(m.length));
}

/** Only a line that BEGINS with "Budget" counts — an asset/bundle budget elsewhere must not disable the gate. */
function detectBudget(text) {
  const candidates = stripCode(text)
    .split(/\r?\n/)
    .filter((l) => /^\s*[*_#>\-\s]*budget\b/i.test(l) && /\d+(?:[.,]\d+)?\s*KB/i.test(l));
  if (!candidates.length) return null;
  const nums = [...candidates[0].matchAll(/(\d+(?:[.,]\d+)?)\s*KB/gi)].map((m) => Number(m[1].replace(",", ".")));
  if (!nums.length) return null;
  return { soft: nums[0], hard: nums[1] ?? nums[0] * 1.1, ambiguous: candidates.length > 1 };
}

/**
 * Sections with BOTH own-body and subtree size. Headers are detected on the
 * code-stripped text (a `# comment` inside a bash fence is not a section), but
 * measured against the real lines.
 */
function sections(rawLines, proseLines) {
  const heads = [];
  proseLines.forEach((l, i) => {
    const m = l.match(/^(#{1,4}) +(\S.*)$/);
    if (m) heads.push({ level: m[1].length, title: (rawLines[i] || l).trim(), start: i });
  });

  const charsAt = (from, to) => {
    let n = 0;
    for (let i = from; i < to && i < rawLines.length; i++) n += rawLines[i].length + 1;
    return n;
  };

  return heads
    .map((h, idx) => {
      const nextAny = idx + 1 < heads.length ? heads[idx + 1].start : rawLines.length;
      let nextSameOrHigher = rawLines.length;
      for (let j = idx + 1; j < heads.length; j++) {
        if (heads[j].level <= h.level) { nextSameOrHigher = heads[j].start; break; }
      }
      return { ...h, own: charsAt(h.start + 1, nextAny), subtree: charsAt(h.start, nextSameOrHigher) };
    })
    .sort((a, b) => b.subtree - a.subtree);
}

function fillerScan(rawLines, proseLines) {
  const rows = [];
  for (let i = 0; i < proseLines.length; i++) {
    const prose = proseLines[i];
    if (prose.trim().length < 30) continue;
    const words = prose.toLowerCase().match(/[a-zäöüß]+/g) || [];
    if (words.length < 6) continue;
    let hits = 0;
    for (const w of words) if (FILLER_WORDS_EN.includes(w) || FILLER_WORDS_DE.includes(w)) hits++;
    const lower = prose.toLowerCase();
    for (const p of FILLER_PHRASES) {
      let at = lower.indexOf(p);
      while (at !== -1) { hits++; at = lower.indexOf(p, at + p.length); }
    }
    if (!hits) continue;
    // Display the REAL line so it can be pasted into an editor; score on prose.
    rows.push({ n: i + 1, hits, density: hits / words.length, text: (rawLines[i] || "").trim() });
  }
  return rows.sort((a, b) => b.hits - a.hits || b.density - a.density);
}

/**
 * Every .md file this CLAUDE.md points at, and whether it exists.
 *
 * This is the safety net for externalised content: compression moves derivation
 * detail out of the core and leaves a one-line back-reference. A reference that
 * points nowhere means the content is GONE while the file still looks tidy —
 * silent rot, and exactly the failure the "distil, don't delete" rule exists to
 * prevent. Fenced blocks are skipped (example commands), inline `code` spans are
 * NOT: that is where doc paths normally live.
 */
function referencedDocs(raw, baseDir) {
  const noFences = raw.replace(/```[\s\S]*?```/g, "");
  const refs = new Set();
  for (const m of noFences.matchAll(/\[[^\]]*\]\(([^)\s]+?\.md)(?:#[^)]*)?\)/gi)) refs.add(m[1]);
  for (const m of noFences.matchAll(/`([^`\n]+?\.md)`/gi)) refs.add(m[1]);
  for (const m of noFences.matchAll(/(?:^|[\s(])((?:[\w.-]+\/)+[\w.-]+\.md)\b/gim)) refs.add(m[1]);

  const out = [];
  for (const ref of refs) {
    if (/^(https?:|#)/i.test(ref) || ref.includes("*") || ref.includes("<")) continue;
    const clean = ref.replace(/^\.\//, "");
    if (existsSync(resolve(baseDir, clean))) {
      out.push({ ref: clean, state: "ok" });
      continue;
    }
    // Distinguish a WRONG PATH from lost content — very different repairs.
    const elsewhere = findByName(baseDir, basename(clean));
    out.push(elsewhere ? { ref: clean, state: "misplaced", at: elsewhere } : { ref: clean, state: "missing" });
  }
  const rank = { missing: 0, misplaced: 1, ok: 2 };
  return out.sort((a, b) => rank[a.state] - rank[b.state] || a.ref.localeCompare(b.ref));
}

/** Shallow hunt for a file by name, so a mistyped path is not reported as lost content. */
function findByName(baseDir, name, maxDepth = 3) {
  const roots = [baseDir, resolve(baseDir, "docs"), resolve(baseDir, "Docs")];
  const seen = new Set();
  for (const root of roots) {
    if (!existsSync(root)) continue;
    const stack = [[root, 0]];
    while (stack.length) {
      const [dir, depth] = stack.pop();
      if (seen.has(dir) || depth > maxDepth) continue;
      seen.add(dir);
      let entries;
      try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const e of entries) {
        if (e.isDirectory()) {
          if (/^(node_modules|\.git|dist|build|Library|\.next)$/i.test(e.name)) continue;
          stack.push([resolve(dir, e.name), depth + 1]);
        } else if (e.name.toLowerCase() === name.toLowerCase()) {
          return resolve(dir, e.name);
        }
      }
    }
  }
  return null;
}

function kb(chars) {
  return (chars / 1024).toFixed(1);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = resolve(args.path || "CLAUDE.md");
  if (!existsSync(file)) {
    console.error(`claude-md-audit: not found: ${file}`);
    process.exit(2);
  }

  const raw = readFileSync(file, "utf8");
  const chars = raw.length;
  const rawLines = raw.split(/\r?\n/);
  if (rawLines.length && rawLines[rawLines.length - 1] === "") rawLines.pop(); // trailing newline is not a line
  const proseLines = stripCode(raw).split(/\r?\n/);
  const lineCount = rawLines.length;

  const declared = detectBudget(raw);
  const fromFlags = args.soft != null || args.hard != null;
  const softKB = args.soft ?? declared?.soft ?? DEFAULT_SOFT_KB;
  const hardKB = args.hard ?? declared?.hard ?? DEFAULT_HARD_KB;
  const softChars = Math.round(softKB * 1024);
  const hardChars = Math.round(hardKB * 1024);
  const source = fromFlags ? "flags" : declared ? "declared in file" : "defaults";

  console.log(`\nCLAUDE.md — ${file}\n`);
  console.log(`  ${kb(chars)} KB (${chars} chars)   ~${Math.round(chars / CHARS_PER_TOKEN)} tokens (estimate, no tokenizer)`);
  console.log(`  ${lineCount} lines, avg ${Math.round(chars / Math.max(lineCount, 1))} chars/line   [lines are informational, not the gate]`);
  console.log(`  Budget: ${softKB} KB soft / ${hardKB} KB hard  (${source})`);
  if (declared?.ambiguous && !fromFlags) {
    console.log(`  ! more than one "Budget … KB" line — used the first; pass --soft/--hard to be sure`);
  }

  let exitCode = 0;
  if (chars > hardChars) {
    console.log(`  VERDICT: OVER HARD GATE by ${kb(chars - hardChars)} KB (${chars - hardChars} chars) — compression is mandatory`);
    exitCode = 1;
  } else if (chars > softChars) {
    console.log(`  VERDICT: over soft budget by ${kb(chars - softChars)} KB — compress before adding`);
    exitCode = 3;
  } else {
    console.log(`  VERDICT: within budget, ${kb(softChars - chars)} KB of room to soft`);
  }

  const secs = sections(rawLines, proseLines);
  console.log(`\nBiggest sections by SUBTREE (own body in brackets) — cut here first:`);
  for (const s of secs.slice(0, args.top)) {
    console.log(`  ${String(s.subtree).padStart(6)}  [${String(s.own).padStart(5)}]  ${s.title.slice(0, 66)}`);
  }

  const fillers = fillerScan(rawLines, proseLines);
  if (fillers.length) {
    console.log(`\nMost filler words per line (density in brackets) — telegraphic-style candidates:`);
    console.log(`  (a hit is only a candidate; drop the word ONLY where meaning stays unambiguous)`);
    for (const f of fillers.slice(0, args.top)) {
      console.log(`  line ${String(f.n).padStart(4)}  ${String(f.hits).padStart(2)} [${f.density.toFixed(2)}]  ${f.text.slice(0, 60)}`);
    }
  }

  const dates = (stripCode(raw).match(/\((?:observed|measured|gemessen)[^)]*\)/gi) || []).length;
  const substantial = proseLines.filter((l) => l.trim().length > 30);
  const germanCount = substantial.filter((l) => GERMAN_MARKERS.test(l)).length;
  const germanShare = substantial.length ? germanCount / substantial.length : 0;
  const lang = args.lang ?? (germanShare > 0.4 ? "de" : "en");

  console.log(`\nOther signals:`);
  console.log(`  observation-date parentheses: ${dates}   (one per rule is enough)`);
  if (lang === "de") {
    console.log(`  language: German throughout (${Math.round(germanShare * 100)}% of prose lines) — treated as this project's convention`);
  } else if (germanCount) {
    const where = proseLines.map((l, i) => (l.trim().length > 30 && GERMAN_MARKERS.test(l) ? i + 1 : 0)).filter(Boolean);
    console.log(`  German in an English file: ${germanCount} lines — ${where.slice(0, 12).join(", ")}${where.length > 12 ? " …" : ""}`);
  } else {
    console.log(`  language: English throughout`);
  }
  const refs = referencedDocs(raw, dirname(file));
  const missing = refs.filter((r) => r.state === "missing");
  const misplaced = refs.filter((r) => r.state === "misplaced");
  console.log(`  referenced docs: ${refs.length} (${missing.length} missing, ${misplaced.length} misplaced)`);
  if (misplaced.length) {
    console.log(`\n  ! WRONG PATH — the file exists, the reference does not point at it:`);
    for (const m of misplaced) console.log(`     ${m.ref}  ->  found at ${m.at}`);
  }
  if (missing.length) {
    console.log(`\n  !! MISSING — externalised content may be lost:`);
    for (const b of missing) console.log(`     ${b.ref}`);
    console.log(`     A reference pointing nowhere means the detail is gone while the core still`);
    console.log(`     claims it is filed. Restore from git, or fix the path, before compressing further.`);
    console.log(`     (A generic path in a template or a global file will also land here.)`);
  }

  console.log(`\n  NOT covered here: stale entries and duplicated laws — grep for them (see /claude-md-hygiene).\n`);

  process.exit(exitCode);
}

main();
