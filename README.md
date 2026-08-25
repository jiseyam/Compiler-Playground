# Compiler Playground

An interactive web app for learning core compiler design concepts (CSE 310) through live, visual tools instead of static pseudocode. Type in code, a grammar, or a string, and watch the algorithm's internal steps animate — tokens highlighted, FIRST/FOLLOW/LEADING sets built live, an LL(1) parser stack stepping through a parse, or an NFA converted into a DFA on screen.

## Modules

| Module | Route | Lab |
|---|---|---|
| Lexical Analyzer | `/lexer` | Lab I |
| Pattern Recognizer | `/pattern-matcher` | Lab II |
| Expression Validator | `/expression-validator` | Lab II |
| FIRST / FOLLOW Calculator (with left recursion / left factoring elimination) | `/first-follow-leading` | Lab III |
| LL(1) Parser (table + predictive parser simulator) | `/ll1-parser` | Lab IV–V |
| NFA → DFA Converter | `/nfa-to-dfa` | Lab VI |

Every module can export its current input/output as a PDF lab report (Problem Statement → Input Given → Output → Discussion) via the "Export report" button.

## Tech stack

- React 19 + Vite, TypeScript throughout
- Tailwind CSS v4 (CSS-based theme, no config file — see `src/index.css`)
- React Router v6 for navigation
- Framer Motion for transitions and step animations
- `@xyflow/react` for the NFA/DFA graph canvases
- CodeMirror 6 (`@uiw/react-codemirror`) for code/grammar input
- Zustand for the LL(1) parser's step/auto-play state
- `jspdf` + `html-to-image` for the "export as lab report" feature
- Vitest for unit tests on the algorithm logic in `src/lib`

All algorithm logic lives in `src/lib/*.ts` — plain TypeScript with zero React/DOM dependencies, fully unit-tested independently of the UI. `src/pages/*.tsx` and `src/components/` handle presentation only.

## Getting started

```bash
npm install
npm run dev       # start the dev server (http://localhost:5173)
npm run build     # type-check and build for production
npm run preview   # preview the production build locally
npx vitest run    # run the algorithm unit tests
```

## Project structure

```
src/
  lib/          # pure algorithm logic (lexer, grammar/FIRST-FOLLOW-LEADING, LL(1), NFA→DFA, pattern matcher, expression validator)
  lib/__tests__/  # Vitest unit tests for the above
  components/
    layout/     # Sidebar, PageShell, SplitPane
    ui/         # Button, Card, Tabs, Table, CodeInput, ExportReportButton, ErrorPanel
    viz/        # TokenChip, SetTable, ParseTable, StackAnimator, GraphCanvas, PatternStepper, ExpressionHighlighter
  pages/        # one page per module, route from App.tsx
  store/        # zustand store for LL(1) step/auto-play state
  hooks/        # useDebounce
```

## Deployment

Deploys to [Vercel](https://vercel.com) with zero config — connect the repo and it will detect the Vite build (`npm run build`, output directory `dist`).

## Credits

Built for CSE 310, Compiler Design.
