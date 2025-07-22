# Technology Stack

## Core Technologies
- **TypeScript** - Primary language for all source code
- **Node.js** - Runtime environment
- **Botpress SDK** - Core framework for building integrations
- **React** - For email templating with @react-email/components
- **Google APIs** - Gmail API and Pub/Sub for email operations

## Key Dependencies
- `@botpress/sdk` - Core Botpress integration framework
- `googleapis` - Official Google APIs client library
- `gmail-api-parse-message` - Gmail message parsing utilities
- `nodemailer` - Email composition and sending
- `@react-email/components` - React-based email templates
- `node-html-parser` - HTML parsing utilities

## Build System & Commands

### Development Commands
```bash
# Build the integration
npm run build

# Type checking
npm run check:type

# Linting and formatting
npm run check:bplint     # Botpress-specific linting
npm run check:lint       # ESLint checking
npm run fix:lint         # Auto-fix ESLint issues
npm run check:format     # Prettier format checking
npm run fix:format       # Auto-format with Prettier
```

### Build Process
- Uses Botpress CLI (`bp add -y && bp build`) for building
- TypeScript compilation with React JSX support
- Output directory: `dist/`
- Extends workspace-level TypeScript configuration

## Authentication & Security
- OAuth 2.0 flow with Google
- JWT token validation for webhook events
- Shared secret validation for Pub/Sub events
- Sentry integration for error monitoring