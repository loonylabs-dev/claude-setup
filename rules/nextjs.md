---
paths:
  - "**/next.config.*"
  - "**/next-env.d.ts"
  - "**/app/**/*.{ts,tsx,js,jsx}"
  - "**/pages/**/*.{ts,tsx,js,jsx}"
  - "**/package.json"
---

# Next.js

- **Never run `next build` while `next dev` is running.** Both write the same
  `.next`; afterwards every route answers `Cannot find module './873.js'` while
  typecheck and the whole suite stay green. Stop the dev server, delete `.next`,
  then build.
- **Webpack does not resolve the `.js`→`.ts` convention that Node's type stripping
  requires.** Server code importing siblings as `./x.js` builds fine under `tsc`
  (`moduleResolution: bundler`) and fails the Next build with `Module not found`.
  Fix once in `next.config.mjs`:
  `config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'] }`.
- **Set `outputFileTracingRoot`.** Stray lockfile anywhere above the project makes
  Next pick that directory as the workspace root and trace deployment files from the
  wrong place — invisible locally, wrong in the bundle.
