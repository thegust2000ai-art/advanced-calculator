---
name: naqel-calc
description: Maintain, build, package and extend NaqelCalc — the standalone «حاسبة هيئة النقل العام» Electron calculator at O:\هيئة النقل العام\التطبيق  وعمل اليومية\calculator-app. Use when the user asks to modify the standalone calculator, add a mode/card/theme, rebuild the portable exe, publish a release, or debug its build. Triggers on "الحاسبة المستقلة", "حاسبة هيئة النقل", "NaqelCalc", "حاسبة calculator-app", "CALCULATOR_STANDALONE_BRIEF".
---

# NaqelCalc — حاسبة هيئة النقل العام المستقلة

Electron + React 19 + Vite 7 + Tailwind 4 + TypeScript. Single-file build (vite-plugin-singlefile). Same engines as the «🧮 الآلة الحاسبة» inside the Yawmiyah daily-app, as a standalone product.

## Project location

`O:\هيئة النقل العام\التطبيق  وعمل اليومية\calculator-app`

## Quick commands

```powershell
cd "O:\هيئة النقل العام\التطبيق  وعمل اليومية\calculator-app"
npm install            # deps — note: electron postinstall is blocked by allow-scripts on this machine; that's OK, electron-builder downloads its own Electron
npm run typecheck      # npx tsc --noEmit — MUST pass before commit; vite build does NOT typecheck
npm run build          # single-file dist/index.html (~4 MB) — base for everything
npm run dist:portable  # vite build + electron-builder --win portable → release\NaqelCalc-Portable-<version>.exe (timeout ≥ 600s; stop any running instance first)
```

## Architecture (do not restructure)

| File | Role |
|---|---|
| `src/utils/safeCalc.ts` | Hand-written parser + evaluator, no eval — basic mode |
| `src/utils/advancedCalc.ts` | mathjs (BigNumber 24-digit) + nerdamer symbolic (solve/diff/integrate/factor…) with DEG/RAD wrappers |
| `src/utils/solver.ts` | Polynomial solve, linear systems, least-squares regression |
| `src/utils/constants.ts` | 30 SI/CODATA + math constants for one-press insert |
| `src/utils/arabic.ts` | `toArabicNumerals / normalizeArabicNumerals / parseArabicFloat / formatNumber` — Arabic-Indic digits everywhere |
| `src/components/ScientificCalculator.tsx` | Basic/advanced modes, 4 skins in `SCI_THEMES` (كاسيو داكن / fx-991 / HiPER / TI-84 CE), localStorage persistence (`calc.*`) |
| `src/components/PercentageCard.tsx` | «💵 النسبة والعمولة» — Authority's daily card: commission from amount / back-out from inclusive total / what-percent / change % |
| `src/components/ProgrammerCard.tsx` | DEC/HEX/OCT/BIN BigInt 64-bit + RPN (full: yˣ √x x² 1/x \|x\|) |
| `src/components/{SolverCard,GraphingCard}.tsx` | Copied from Yawmiyah repo, rewired to `UI` palette (`utils/uiTheme.ts`) — no useStore/getTheme/dexie |
| `electron/main.cjs` | Single window; portable «data» folder next to exe via PORTABLE_EXECUTABLE_DIR; single-instance lock; external links → system browser |

## Hard rules

1. **Never use `eval`/`Function`** — engines are safe by design; keep it.
2. **Arabic-Indic digits in, normalized at parse time, rendered via `toArabicNumerals`** — never strip this.
3. **No `window.prompt/confirm`** — they no-op inside packaged Electron; use inline UI.
4. tsc strict must stay green; run `npm run typecheck` after every edit.
5. `npm run dist:portable`: stop running app instances first; needs ≥ 600 s timeout.
6. Portable data lives in `data/` next to the exe — don't relocate userData handling.
7. The Yawmiyah daily-app repo is a **reference to copy from, not to edit**: `O:\هيئة النقل العام\التطبيق  وعمل اليومية\النسخة التى يتم التعديل عليها`. Brief: `CALCULATOR_STANDALONE_BRIEF.md` there.

## Release flow

1. Bump `version` in `package.json` → `npm run typecheck` → `npm run dist:portable`.
2. Verify exe in `release/`.
3. `git add -A && git commit -m "release: vX.Y.Z"` then tag and push.
4. `gh release create vX.Y.Z "release\NaqelCalc-Portable-X.Y.Z.exe" --title "…" --notes "…"`.

## Known next steps (from brief)

- Natural Textbook Input (2D) — currently KaTeX display-only, per plan.
- Full session persistence (restore stack + history), optional key sounds.
- Batch CSV evaluation — under study.
