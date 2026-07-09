---
name: nestjs-swagger-troubleshoot
description: Systematic checklist for diagnosing why NestJS Swagger UI (/docs) shows a blank/empty page
source: auto-skill
extracted_at: '2026-07-09T14:13:00.790Z'
---

# NestJS Swagger UI — blank page troubleshooting

When a user reports `http://localhost:<port>/docs` shows nothing (white/blank page, no Swagger UI), follow this layered diagnosis. Determine **server-side** vs **browser-side** before suggesting fixes.

## Layer 1 — Is the server alive?

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/api/health
```

If not 200 → server is down or port mismatch. Fix the server first.

## Layer 2 — Does `/docs` serve HTML?

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/docs
```

If not 200 → SwaggerModule not set up or route path differs. Check `main.ts`:
```ts
SwaggerModule.setup('docs', app, document);  // first arg = path
```

## Layer 3 — Do static assets serve?

Swagger UI HTML loads via relative paths (`./docs/swagger-ui.css`, `./docs/swagger-ui-bundle.js`, `./docs/swagger-ui-standalone-preset.js`, `./docs/swagger-ui-init.js`). Check each:

```bash
for asset in swagger-ui.css swagger-ui-bundle.js swagger-ui-init.js; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:<port>/docs/$asset")
  echo "$asset → $code"
done
```

Any non-200 → NestJS isn't serving the `@nestjs/swagger` static bundle. This shouldn't happen in a standard setup — verify `@nestjs/swagger` is in `dependencies`.

## Layer 4 — Is `swagger-ui-init.js` well-formed?

This file embeds the complete OpenAPI spec as `swaggerDoc` and calls `SwaggerUIBundle()`. Check:

```bash
# Size — should be meaningful (spec + wrapper)
curl -s http://localhost:<port>/docs/swagger-ui-init.js | wc -c

# Has init call
curl -s http://localhost:<port>/docs/swagger-ui-init.js | grep -c 'SwaggerUIBundle'

# Tail — ensure it closes properly
curl -s http://localhost:<port>/docs/swagger-ui-init.js | tail -5
```

If `swaggerDoc` is missing or the JS is truncated, the page renders nothing.

## Layer 5 — Does `/docs-json` serve the raw spec?

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/docs-json
```

This is an alternative entry point. If the browser loads `url?=...` query param, Swagger UI fetches from here. Also useful for verifying the spec content.

## Layer 6 — Browser-side (when all above pass)

If Layers 1–5 all return 200 and content looks valid, the issue is in the user's browser. Advise:

1. **Exact URL** — confirm `http://localhost:<port>/docs` (not HTTPS, not wrong port)
2. **Hard refresh** — `Ctrl+Shift+R` / `Cmd+Shift+R` to bypass cache
3. **DevTools Console** — F12 → Console tab → refresh. Report any red JS errors (CORS, ad-blocker blocking scripts, CSP violations)
4. **Ad/script blockers** — disable for localhost
5. **Try another browser** — Chrome/Firefox/Edge to isolate

## Common root causes

| Symptom | Likely cause |
|---|---|
| HTML 200, JS 200, still blank | Browser cache — hard refresh |
| `/docs` 200, CSS/JS 404 | Static assets not being served (unusual in Nest) |
| Init JS missing SwaggerUIBundle call | Corrupted `@nestjs/swagger` install — reinstall |
| Spec loads but UI empty | All `responses` have empty description — still should render |
| Everything 200 from curl, user sees blank | Ad blocker, script blocker, browser extension, old cached page |

## Restoration

If the problem is a stale `dist/` or corrupted build:
```bash
# Clean and rebuild
rm -rf dist
npm run build
npm run start:dev
```
