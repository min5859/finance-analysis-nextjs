# CLAUDE.md - Frontend (Next.js Financial Analysis Dashboard)

## Commit Rules

- Always create a commit after making changes.
- Keep each commit as a single logical unit for easy review.
- Write commit messages in English.

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript 5 (strict mode)
- Tailwind CSS 4, Chart.js + react-chartjs-2, Zustand 5
- Anthropic SDK + OpenAI SDK (multi-provider AI calls), JSZip (DART API)

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard route group (13 pages)
│   │   └── layout.tsx      # Sidebar navigation layout
│   ├── api/                # API routes (companies, config, dart, extract, pdf, upload, valuation)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Landing page
├── components/
│   ├── charts/             # Chart components (BarChart, LineChart, ChartCard, chartConfig)
│   ├── layout/             # Layout components (Sidebar, etc.)
│   ├── slides/             # Slide-style presentation components
│   └── ui/                 # Shared UI (MetricCard, SlideHeader, EmptyState, ParamGroup, etc.)
├── features/
│   ├── dart/               # DART API feature (constants, components)
│   ├── financial-analysis/ # Financial analysis (evaluators, constants)
│   └── valuation/          # Manual valuation (types, calculators, components)
├── hooks/                  # Custom hooks (useFinancialData, useDartData)
├── lib/                    # Utilities (format, data-loader, ai-client, parse-ai-response)
├── store/                  # Zustand stores (company-store)
└── types/                  # TypeScript type definitions (company, dart, valuation)
```

## Key Conventions

- Path alias: `@/*` maps to `./src/*`
- Colors: Use `COLOR_PALETTE` from `@/components/charts/chartConfig` — no hardcoded hex values
- Pages: Dashboard pages use `useFinancialData()` hook and `<EmptyState />` for null state
- Types: No `any` types, no `eslint-disable` comments
- API routes: Use `chatCompletion()` from `@/lib/ai-client` for AI calls (supports Anthropic & DeepSeek)
- Feature modules: Domain logic goes in `src/features/{domain}/`, not in page files

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (use to verify changes)
- `npm run lint` — Run ESLint
