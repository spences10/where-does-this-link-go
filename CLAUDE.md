# Claude Development Guide: Where Does This Link Go?

## Unbreakable rules

- Kebab-case for file names
- snake case for function and variable names
- do not ask to run pnpm run dev, this serves no purpose

## Project Overview

**Where Does This Link Go?** is a comprehensive URL redirect chain
analyzer built with SvelteKit. The application traces and visualizes
the complete journey of any URL through its redirect path, providing
detailed insights into performance, security, and behavior patterns.

## Technology Stack

### Core Framework

- **SvelteKit 2.22.5** with **Svelte 5.35.6** (using the new runes
  API)
- **TypeScript 5.8.3** for type safety
- **Vite 7.0.4** as the build tool and dev server

### Styling & UI

- **Tailwind CSS 4.1.11** (latest version with new CSS-first approach)
- **DaisyUI 5.0.46** for pre-built component themes
- **@tailwindcss/typography 0.5.16** for rich text styling
- **@tailwindcss/vite 4.1.11** for Vite integration

### Testing & Quality

- **Vitest 3.2.4** for unit testing with browser testing support
- **Playwright 1.54.1** for end-to-end testing
- **ESLint 9.31.0** with TypeScript ESLint 8.36.0 for linting
- **Prettier 3.6.2** with Svelte and Tailwind plugins for formatting

### Package Management

- **pnpm** is the preferred package manager (lock file present)
- Node.js ES modules (`"type": "module"`)

## Project Structure

```
/src/
├── app.css              # Global styles with Tailwind imports
├── app.d.ts             # TypeScript app definitions
├── app.html             # HTML template
├── lib/
│   └── index.ts         # Shared library code
└── routes/
    ├── +layout.svelte   # Global layout component
    └── +page.svelte     # Homepage component
/static/
└── favicon.svg          # Site favicon
/e2e/
└── demo.test.ts         # End-to-end tests
```

## Key Configuration Files

### Svelte Configuration (`svelte.config.js`)

- Uses `@sveltejs/adapter-auto` for automatic deployment adapter
  selection
- Configured with `vitePreprocess()` for TypeScript and other
  preprocessing

### Vite Configuration (`vite.config.ts`)

- Integrates Tailwind CSS via `@tailwindcss/vite` plugin
- Dual testing setup: browser tests for Svelte components, Node tests
  for server code
- Uses Playwright for browser testing environment

### Tailwind Configuration (`src/app.css`)

- Uses new Tailwind CSS v4 syntax with `@import 'tailwindcss'`
- Includes DaisyUI plugin and Typography plugin
- No separate config file needed with v4

## Development Commands

```bash
# Development
pnpm dev                 # Start dev server
pnpm dev -- --open      # Start dev server and open browser

# Building
pnpm build              # Build for production
pnpm preview            # Preview production build

# Code Quality
pnpm format             # Format code with Prettier
pnpm lint               # Run ESLint and Prettier checks
pnpm check              # Type check with svelte-check
pnpm check:watch        # Type check in watch mode

# Testing
pnpm test:unit          # Run unit tests
pnpm test:e2e           # Run end-to-end tests
pnpm test               # Run all tests
```

## Important Technical Details

### Svelte 5 Features

- This project uses **Svelte 5** with the new **runes API**
- The layout uses `let { children } = $props()` and
  `{@render children()}` syntax
- Components should use runes (`$state`, `$derived`, `$effect`)
  instead of legacy reactive declarations

### Tailwind CSS v4

- Using the latest Tailwind CSS v4 with new CSS-first approach
- No `tailwind.config.js` file needed - configuration is done in CSS
- Uses `@import` syntax in `app.css` instead of PostCSS configuration

### Testing Strategy

- **Browser tests**: For Svelte components (`.svelte.test.ts` files)
- **Node tests**: For server-side logic (`.test.ts` files)
- **E2E tests**: Using Playwright in `/e2e` directory
- Vitest configured with Playwright provider for browser testing

## Development Guidelines

### File Organization

- Place reusable components and utilities in `/src/lib/`
- Use the `$lib` alias for importing from the lib directory
- Follow SvelteKit's file-based routing in `/src/routes/`

### Code Style

- TypeScript is required for all new files
- Use Prettier for consistent formatting (configured for Svelte and
  Tailwind)
- Follow ESLint rules (includes Svelte-specific linting)

### Component Development

- Use Svelte 5 runes for reactivity (`$state`, `$derived`, `$effect`)
- Leverage DaisyUI components for consistent UI
- Write component tests using Vitest browser testing

### Performance Considerations

- SvelteKit provides automatic code splitting
- Use `@sveltejs/adapter-auto` for optimal deployment
- Leverage Vite's fast HMR during development

## Project Goals (from PRD.md)

The application aims to:

1. **Trace URL redirect chains** with detailed visualization
2. **Analyze performance** and response times
3. **Detect security issues** and malicious redirects
4. **Provide API access** for programmatic usage
5. **Support bulk processing** for enterprise users

### Target Features

- Real-time redirect chain visualization
- HTTP status code detection (301, 302, 307, 308, JS redirects)
- Performance metrics and timing analysis
- Security scanning for malicious patterns
- Historical tracking and analytics

## Deployment Notes

- Uses `@sveltejs/adapter-auto` which supports Vercel, Netlify, and
  other platforms
- Static assets served from `/static/` directory
- TypeScript compilation handled by SvelteKit/Vite
- Production builds optimized for performance

## Getting Started for New Developers

1. **Install dependencies**: `pnpm install`
2. **Start development**: `pnpm dev`
3. **Run tests**: `pnpm test` to ensure everything works
4. **Check code quality**: `pnpm lint` and `pnpm check`

The project is currently in early development phase with basic
SvelteKit scaffolding in place, ready for implementing the URL
redirect analysis features outlined in the PRD.
