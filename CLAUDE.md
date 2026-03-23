# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What Is This Repo?

The public Botpress SDK monorepo. Contains the CLI (`@botpress/cli`), SDK (`@botpress/sdk`), API client (`@botpress/client`), 69+ integrations, 13 interfaces, 8 plugins, and supporting packages (llmz, cognitive, zai, vai, zui). This is the codebase developers use to build and deploy integrations, bots, and plugins on the Botpress platform.

## Commands

```bash
# Install dependencies (requires pnpm@10.12.4, see packageManager in package.json)
pnpm install

# Build everything (Turbo-orchestrated)
pnpm build

# Run all tests
pnpm test

# Full quality check (sherif + dep + format + lint + type)
pnpm check

# Auto-fix all issues
pnpm fix

# Individual checks
pnpm check:type          # TypeScript type checking
pnpm check:format        # Prettier
pnpm check:oxlint        # Rust-based linter
pnpm check:eslint        # TypeScript ESLint
pnpm check:bplint        # Botpress-specific integration linting
pnpm check:sherif        # Dependency conflict detection
pnpm check:dep           # Dependency version sync

# Individual fixes
pnpm fix:format          # Prettier write
pnpm fix:oxlint          # Oxlint auto-fix
pnpm fix:eslint          # ESLint auto-fix
pnpm fix:lint            # oxlint + eslint combined
```

### Per-Integration Commands

Each integration in `integrations/` has its own build:

```bash
cd integrations/slack
pnpm build               # bp add -y && bp build (generates .botpress/ + bundles)
pnpm check:type          # tsc --noEmit
pnpm check:bplint        # bp lint
pnpm test                # vitest --run
```

### Running a Single Test

```bash
# From root — run tests for a specific package
pnpm --filter @botpress/sdk test

# Run a single test file
pnpm vitest --run path/to/file.test.ts

# Watch mode for a specific file
pnpm vitest path/to/file.test.ts
```

### CLI Development

```bash
cd packages/cli
pnpm build               # build:types + bundle + template:gen
pnpm dev                 # ts-node development mode
pnpm start               # node dist/cli.js
pnpm test:e2e            # End-to-end tests
```

## Architecture

### Monorepo Layout

```
packages/
├── sdk/         # @botpress/sdk — IntegrationDefinition, BotDefinition, PluginDefinition, type system
├── cli/         # @botpress/cli — bp init/build/deploy/dev, code generation (.botpress/)
├── client/      # @botpress/client — Type-safe API client (generated from OpenAPI)
├── cognitive/   # @botpress/cognitive — LLM wrapper
├── llmz/        # LLMz — Code-first LLM agent VM (read packages/llmz/CLAUDE.md)
├── zai/         # @botpress/zai — AI utility library (read packages/zai/CLAUDE.md)
├── vai/         # @botpress/vai — Visual AI
├── zui/         # @bpinternal/zui — Zod-based schema validation with UI metadata
├── common/      # @botpress/common — Shared utilities
├── sdk-addons/  # Additional SDK utilities
├── chat-api/    # Chat API
└── chat-client/ # Chat client

integrations/    # 69+ integrations (Slack, Teams, HubSpot, GitHub, Linear, etc.)
interfaces/      # 13 interfaces (llm, hitl, listable, deletable, readable, typing-indicator, etc.)
plugins/         # 8 plugins (knowledge, analytics, personality, etc.)
bots/            # Example bot implementations
```

### Definition → Implementation → Code Generation Pipeline

Every integration, bot, and plugin follows this flow:

1. **Definition** (`integration.definition.ts`) — declares capabilities via Zod schemas: actions, events, channels, configuration, states, entities
2. **`bp build`** — the CLI reads the definition and generates the `.botpress/` directory with fully typed exports
3. **Implementation** (`src/index.ts`) — imports from `.botpress` and wires up typed handlers

The `.botpress/` directory is auto-generated. Never edit it. Import from it as `import * as bp from '.botpress'` to get fully typed props.

### SDK Type Hierarchy

- **InterfaceDefinition** — a contract declaring entities, actions, events, channels with Zod schemas. No runtime code.
- **IntegrationDefinition** — implements interfaces via `.extend()`, connects to external services. Has `register`/`unregister`/`handler`/`actions`/`channels`.
- **PluginDefinition** — extends bot capabilities, hooks into lifecycle. References interfaces and integrations.
- **BotDefinition** — composes integration instances + plugin instances. Defines states, events, actions, tables, workflows.

Integrations implement interfaces by mapping their entities/actions to interface contracts:

```typescript
export default new IntegrationDefinition({...})
  .extend(listable, ({ entities }) => ({
    entities: { item: entities.issue },
    actions: { list: { name: 'issueList' } },
  }))
```

### Integration Structure Convention

All integrations follow this layout:

```
integration-name/
├── integration.definition.ts    # Ties all definitions together
├── definitions/
│   ├── index.ts                 # Re-exports all definitions
│   ├── actions.ts               # as const satisfies sdk.IntegrationDefinitionProps['actions']
│   ├── events.ts
│   ├── channels.ts
│   ├── configuration.ts
│   ├── secrets.ts
│   └── states.ts
├── src/
│   ├── index.ts                 # new bp.Integration({ register, unregister, handler, actions, channels })
│   ├── setup.ts                 # register/unregister handlers
│   ├── handler.ts               # Webhook handler (entry point for all external requests)
│   ├── channels.ts              # Outbound message handlers
│   └── actions/
│       ├── index.ts
│       └── action-name.ts       # One file per action
```

### Build Dependencies (Turbo)

The build graph has specific ordering. Key dependencies:

- `@bpinternal/zui` builds first (schema foundation)
- `@botpress/client` builds next (API types)
- `@botpress/sdk` depends on zui + client
- `@botpress/cli` depends on sdk (for code generation)
- `@botpress/cognitive` depends on zui
- `llmz` depends on cognitive
- All integrations/bots/plugins depend on sdk

### Interface Dependencies (`bpDependencies`)

Integrations declare interface dependencies in `package.json` via `bpDependencies`:

```json
{
  "bpDependencies": {
    "typing-indicator": "../../interfaces/typing-indicator",
    "listable": "../../interfaces/listable"
  }
}
```

`bp add -y` (run as part of `pnpm build`) resolves these into `bp_modules/`.

## Formatting & Style

- **Prettier**: 120 char width, no semicolons, single quotes, trailing commas ES5, LF line endings
- **Files**: kebab-case
- **Types**: use `type` keyword, not `interface` (enforced by oxlint `typescript/consistent-type-definitions`)
- **No `console.log`**: use `console.warn`, `console.error`, `console.info`, or `console.debug` instead
- **Unused variables**: prefix with `_` (e.g., `_unused`) — enforced by `no-unused-vars`
- **Schemas**: always use `sdk.z` (Zod), add `.title()` and `.describe()` for Studio UI metadata
- **Definitions**: use `as const satisfies sdk.IntegrationDefinitionProps['actions']` pattern
- **Exports**: named exports, no default exports (except the integration/bot/plugin entry point which default-exports the implementation)
- **Test framework**: Vitest

## Testing Notes

- LLMz tests use extended timeouts (60s) and retries (2) due to LLM non-determinism — see `packages/llmz/vitest.e2e.config.ts`
- Root `vitest.config.ts` excludes `.utils.test.ts` files and `e2e/` directories from standard `pnpm test`
- Integration tests are sparse — most integrations test via deployment, not unit tests

## Sub-Package Documentation

- `packages/llmz/CLAUDE.md` — LLMz agent framework architecture and patterns
- `packages/zai/CLAUDE.md` — Zai AI utility library architecture

## Coding Guidelines

- Do not add comments for self-explanatory code. Only comment on "the why," never "the what."
- Do not write tests for trivial logic or "for the sake of coverage." Only add tests that provide meaningful regressions or document complex edge cases.
- If you see a pattern being repeated across the repo, point it out before implementing a third instance.

## User specific information

This CLAUDE.md is deployed on github. If a user has specific instructions, they will add them in AGENTS.md