# Technology Stack

## Build System & Package Management

- **Package Manager**: pnpm (v8.6.2)
- **Monorepo**: Turborepo for build orchestration
- **Workspace**: pnpm workspaces with packages, integrations, interfaces, bots, and plugins

## Core Technologies

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript (v5.6.3) with strict configuration
- **Target**: ES2022, CommonJS modules

## Development Tools

### Linting & Formatting
- **Primary Linter**: oxlint (fast Rust-based linter)
- **Secondary**: ESLint with TypeScript support
- **Formatter**: Prettier
- **Code Style**: Single quotes, no semicolons, 120 char line width

### Testing & Quality
- **Test Runner**: Vitest
- **Git Hooks**: Husky with pre-commit and pre-merge-commit
- **Dependency Management**: depsynky for workspace dependency sync
- **Type Checking**: TypeScript strict mode with comprehensive checks

## Common Commands

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm test

# Lint and format checks
pnpm check

# Auto-fix linting and formatting
pnpm fix

# Deploy integration (from integration directory)
bp deploy

# Create new integration
bp init
```

## Key Libraries

- **@botpress/sdk**: Core SDK for integrations and bots
- **@botpress/cli**: Command-line interface
- **@botpress/client**: Type-safe API clients
- **zod**: Schema validation and type inference