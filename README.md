# Where Does This Link Go?

A comprehensive URL redirect chain analyser that traces and visualizes
the complete journey of any URL through its redirect path.

## Features

- **Complete Redirect Chain Visualization** - See every hop from
  source to destination
- **Multiple Redirect Types** - HTTP (301, 302, 307, 308), JavaScript,
  and Meta Refresh detection
- **Performance Metrics** - Response times for each hop and total
  journey time
- **Security Indicators** - HTTPS/HTTP security status for each step
- **Page Metadata** - Extract titles from final destinations
- **Shareable Results** - URLs update automatically for easy sharing
- **Mobile Responsive** - Clean interface using DaisyUI components

## Technology Stack

- **SvelteKit** with Svelte 5 (runes API)
- **TypeScript** for type safety
- **Tailwind CSS v4** for styling
- **DaisyUI v5** for UI components
- **Vitest** for testing
- **Playwright** for E2E testing

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd where-does-this-link-go

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Usage

1. Enter any URL in the input field
2. Click "Trace Redirects" or press Enter
3. View the complete redirect chain with:
   - Each redirect hop with status codes
   - Response times and redirect types
   - Security indicators (HTTPS/HTTP)
   - Final destination with page title

### Sharing Results

Results are automatically shareable via URL parameters:

```
https://yoursite.com?url=bit.ly%2Ftest
```

## Development

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build
pnpm test         # Run all tests
pnpm test:unit    # Run unit tests
pnpm test:e2e     # Run E2E tests
pnpm lint         # Run linting
pnpm format       # Format code
pnpm check        # Type checking
```

### Project Structure

```
src/
├── routes/
│   ├── +page.svelte           # Main application page
│   └── api/trace/+server.ts   # Redirect tracing API endpoint
├── lib/
│   ├── api/trace.ts           # API client functions
│   └── state/                 # State management
│       └── redirect-chain.svelte.ts
└── app.css                    # Global styles
```

### Code Conventions

- **File names**: kebab-case
- **Functions/variables**: snake_case
- **TypeScript interfaces**: PascalCase
- **Components**: PascalCase

## API

### POST /api/trace

Trace a URL's redirect chain.

**Request:**

```json
{
	"url": "https://example.com"
}
```

**Response:**

```json
{
  "hops": [
    {
      "url": "https://example.com",
      "status": 301,
      "status_text": "Moved Permanently",
      "response_time": 245,
      "timestamp": "2024-01-01T12:00:00Z",
      "redirect_type": "http",
      "is_secure": true,
      "headers": {...}
    }
  ],
  "final_destination": {
    "url": "https://www.example.com",
    "title": "Example Domain",
    "is_reachable": true
  },
  "total_time": 245
}
```

## Deployment

The app uses `@sveltejs/adapter-auto` and can be deployed to:

- **Vercel** (recommended)
- **Netlify**
- **Cloudflare Pages**
- Any Node.js hosting platform

```bash
pnpm build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## License

MIT License - see LICENSE file for details
