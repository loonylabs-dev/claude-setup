---
paths:
  - "**/*.{ts,tsx,mts,cts}"
  - "**/tsconfig*.json"
---

# TypeScript that Node runs directly

- **A green typecheck can mean less was checked.** Child `tsconfig` inherits the
  parent's `exclude`, which then filters whatever the child's `include` found.
  Excluding the subtree *entirely* is the loud case — `TS18003: No inputs were found`,
  exit 2. The silent one is a *partial* overlap: the child checks what the parent left
  over, exits 0, and a real type error inside the excluded part is never seen. Verify
  coverage with `tsc --listFiles`, not the exit code. Measured 2026-08-27.
- **Node strips types; it cannot run TypeScript that emits code.** `enum`,
  `namespace` and constructor parameter properties abort at startup with
  `ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX` while `tsc` waves them through. Set
  `erasableSyntaxOnly` so the typecheck catches that class instead of the user.
- Module no test imports is unverified whatever the suite says: syntax error in an
  entry point stays green until someone runs the program. One smoke test that
  actually starts it closes that hole.
