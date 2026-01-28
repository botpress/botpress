# Botpress Codebase Guide for AI Coding Agents

This guide provides essential information for AI coding agents working in the Botpress monorepo.

## Repository Structure

- **Monorepo**: Uses `pnpm` workspaces with Turbo for build orchestration
- **Package Manager**: `pnpm@10.12.4` (required)
- **Main Directories**:
  - `packages/` - Core packages (sdk, cli, client, cognitive, zui, llmz, etc.)
  - `integrations/` - Third-party integrations (Slack, WhatsApp, OpenAI, etc.)
  - `plugins/` - Bot plugins (analytics, hitl, knowledge, logger, etc.)
  - `interfaces/` - Shared interfaces (llm, hitl, listable, etc.)
  - `bots/` - Example bots

## Build, Test, and Lint Commands

### Building

```bash
# Build entire monorepo
pnpm build

# Build specific package (from workspace root)
turbo run build --filter=@botpress/sdk
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in specific package
cd packages/sdk && pnpm test

# Run single test file
vitest path/to/file.test.ts

# Run specific test by name
vitest -t "test name pattern"

# Run tests in watch mode
vitest
```

### Type Checking

```bash
# Check types across all packages
pnpm check:type

# Check types in specific package
cd packages/sdk && pnpm check:type
```

### Linting

```bash
# Run all linters (oxlint + eslint + bplint)
pnpm check:lint

# Run oxlint only (fast)
pnpm check:oxlint

# Run eslint only
pnpm check:eslint

# Auto-fix lint issues
pnpm fix:lint
```

### Formatting

```bash
# Check formatting
pnpm check:format

# Auto-fix formatting
pnpm fix:format
```

### Full Check & Fix

```bash
# Run all checks (sherif, deps, format, lint, type)
pnpm check

# Auto-fix everything possible
pnpm fix
```

## Code Style Guidelines

### TypeScript Configuration

- **Target**: ES2022
- **Module**: CommonJS
- **Strict mode**: Enabled
- **Notable flags**:
  - `noUncheckedIndexedAccess: true` - Always check array/object access
  - `noImplicitReturns: true` - All code paths must return
  - `noUnusedParameters: true` - Remove unused params or prefix with `_`
  - `noFallthroughCasesInSwitch: true` - Explicit breaks required

### Import Ordering

1. **External packages** - Node built-ins and third-party (alphabetically)
2. **Internal modules** - Relative imports from same package
3. **Generated types** - `.botpress` generated files last
4. **Type-only imports** - Use `import type { ... }` for types
5. **Node built-ins** - Use `node:` prefix (e.g., `import type { Server } from 'node:http'`)

Example:

```typescript
import { z } from '@bpinternal/zui'
import { IntegrationDefinition } from '@botpress/sdk'
import type { Server } from 'node:http'
import { someUtil } from './utils'
import * as bp from './.botpress'
```

### Formatting (Prettier)

- **Print width**: 120 characters
- **Tab width**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: No semicolons
- **Trailing commas**: ES5 style
- **Line endings**: LF (Unix)
- **Bracket spacing**: Enabled

### Naming Conventions

- **Functions/Variables**: `camelCase`
- **Private functions**: `_leadingUnderscore` (e.g., `_mapHsContactToBpContact`)
- **Types/Interfaces**: `PascalCase`
- **Constants**: `SCREAMING_SNAKE_CASE`
- **Type over interface**: Prefer `type` (95% usage) over `interface`

### Error Handling

1. **SDK errors**: Use `sdk.RuntimeError` for user-facing errors
2. **Try-catch**: Only for external calls or parsing operations
3. **Error wrapping**: Wrap and redact sensitive information
4. **Type guards**: Custom predicates for error detection (e.g., `_isApiError`)
5. **Graceful fallbacks**: Log errors and return safe defaults when appropriate

Example:

```typescript
try {
  const response = await api.call()
  return response.data
} catch (error) {
  logger.forBot().error('API call failed', error)
  throw new sdk.RuntimeError('Failed to process request')
}
```

### Async/Await

- **Always use async/await** - No Promise chains
- **No explicit Promise types** - Return type inferred from async
- **Sequential by default** - Await operations sequentially unless parallelization is needed
- **No floating promises** - ESLint enforces with `@typescript-eslint/no-floating-promises`

### Type Definitions

- **Type aliases preferred** over interfaces (~95% usage)
- **Type inference**: Use `Awaited<ReturnType<...>>`, `Parameters<...>`
- **Satisfies operator**: For const assertions with type checking
- **Explicit types**: Always type function parameters and returns (except simple cases)

Example:

```typescript
type User = {
  id: string
  name: string
  email: string
}

type CreateUserResponse = Awaited<ReturnType<typeof createUser>>
```

### Exports

- **Named exports strongly preferred** - Use `export const/type/function`
- **Default exports**: Only for integration/plugin/bot entry points
- **Barrel exports**: Use `export * from './module'` for re-exporting

### Comments

- **JSDoc**: For public APIs and experimental features
- **Inline comments**: Rare - prefer self-documenting code
- **Complex logic**: Brief explanations only when necessary
- **No commented-out code**: Remove instead of commenting

### Linting Rules (Key Enforcers)

- No `console.log` (use logger instead - `console.error/warn/info/debug` allowed)
- No `var` - use `const` or `let`
- No unused variables (unless prefixed with `_`)
- Prefer `const` over `let`
- No floating promises - must await or handle
- Type definitions use `type` not `interface`
- Private class members must start with `_`
- Explicit member accessibility required (`public`, `private`)
- Unix line endings (LF)
- No trailing spaces

## Common Patterns

### Props Objects

Pass complex parameters as a single props object:

```typescript
type ProcessQueueProps = {
  logger: Logger
  botId: string
  items: Item[]
}

const processQueue = async (props: ProcessQueueProps) => {
  const { logger, botId, items } = props
  // ...
}
```

### Logger Injection

Always inject and use the logger:

```typescript
const handleEvent = async ({ logger, ctx }: EventProps) => {
  logger.forBot().debug('Processing event', { conversationId: ctx.conversationId })
}
```

### Error Redaction

Use error redaction for sensitive data:

```typescript
const redactor = _errorRedactor(props)
throw redactor.decorateError(error, 'Failed to create resource')
```

## Testing

- **Framework**: Vitest
- **Location**: `*.test.ts` files next to source
- **Config**: `vitest.config.ts` in each package
- **Lint-staged**: Tests run automatically on changed files during commit

## Important Notes

1. **No console.log**: Use the logger pattern instead
2. **Strict null checks**: Always handle `undefined` and `null` cases
3. **Type safety**: Avoid `any` - use `unknown` and type guards instead
4. **Immutability**: Prefer const and avoid mutations
5. **Node prefix**: Use `node:` prefix for Node built-ins
6. **Turbo cache**: Build outputs cached in `.turbo/`
7. **Generated code**: `.botpress/` dirs contain generated code - don't edit manually
