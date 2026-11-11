---
name: advanced-calc
description: Maintain, build, package and extend the standalone «آلة حاسبة متقدمة» (Advanced Calculator) desktop calculator app. Use when the user asks to modify the standalone calculator, add a mode/card/theme, rebuild the portable exe, publish a release, or debug its build. Triggers on "آلة حاسبة متقدمة", "الحاسبة المستقلة", "advanced calculator", "CALCULATOR_STANDALONE_BRIEF".
---

# آلة حاسبة متقدمة — standalone calculator

Electron + React 19 + Vite 7 + Tailwind 4 + TypeScript. Single-file build (vite-plugin-singlefile). Advanced tools beyond a basic calculator: scientific engine, programmer/RPN, TI-84 graphing, equation solver, commission cards.

## Quick commands

```powershell
npm install            # deps — note: electron postinstall is blocked by allow-scripts on some machines; that's OK, electron-builder downloads its own Electron
npm run typecheck      # npx tsc --noEmit — MUST pass before commit; vite build does NOT typecheck
npm run build          # single-file dist/index.html — base for everything
npm run dist:portable  # vite build + electron-builder --win portable → release\AdvancedCalc-Portable-<version>.exe (stop any running instance first)
```

## Architecture (do not restructure)

| File | Role |
|---|---|
| `src/utils/safeCalc.ts` | Hand-written parser + evaluator, no eval — basic mode |
| `src/utils/advancedCalc.ts` | mathjs (BigNumber 24-digit) + nerdamer symbolic (solve/diff/integrate/factor…) with DEG/RAD wrappers |
| `src/utils/solver.ts` | Polynomial solve, linear systems, least-squares regression |
| `src/utils/constants.ts` | 30 SI/CODATA + math constants for one-press insert |
| `src/utils/arabic.ts` | `toArabicNumerals / normalizeArabicNumerals / parseArabicFloat / formatNumber` — Arabic-Indic digits everywhere |
| `src/components/ScientificCalculator.tsx` | Basic/advanced modes, 7 skins in `SCI_THEMES` (كاسيو داكن / fx-991 / HiPER / TI-84 CE / Nord / Solarized / Miami), localStorage persistence (`calc.*`) |
| `src/components/PercentageCard.tsx` | Commission tools — from amount / back-out from inclusive total / what-percent / change % |
| `src/components/ProgrammerCard.tsx` | DEC/HEX/OCT/BIN BigInt 64-bit + full RPN (yˣ √x x² 1/x \|x\|) |
| `src/components/{SolverCard,GraphingCard}.tsx` | TI-84 graphing + equation solver — rewired to `UI` palette (`utils/uiTheme.ts`), no store/database deps |
| `electron/main.cjs` | Single window; portable data folder next to exe via PORTABLE_EXECUTABLE_DIR; single-instance lock; external links → system browser |

## Hard rules

1. **Never use `eval`/`Function`** — engines are safe by design; keep it.
2. **Arabic-Indic digits in, normalized at parse time, rendered via `toArabicNumerals`** — never strip this.
3. **No `window.prompt/confirm`** — they no-op inside packaged Electron; use inline UI.
4. tsc strict must stay green; run `npm run typecheck` after every edit.
5. `npm run dist:portable`: stop running app instances first; needs ≥ 600 s timeout.
6. Portable data lives in a `data/` folder next to the exe — don't relocate userData handling.

## Release flow

1. Bump `version` in `package.json` → `npm run typecheck` → `npm run dist:portable`.
2. Verify exe in `release/`.
3. Commit, tag, push, then `gh release create …` with the portable exe attached.

## Known next steps

- Natural Textbook Input (2D) — currently KaTeX display-only, per plan.
- Full session persistence (restore stack + history), optional key sounds.
- Batch CSV evaluation — under study.
