# Project Structure

## Root Directory Organization

```
├── packages/          # Core SDK, CLI, and client libraries
├── integrations/      # Public integrations for Botpress Hub
├── interfaces/        # Reusable interface definitions
├── bots/             # Example "as code" bot implementations
├── plugins/          # Botpress Studio plugins
└── scripts/          # Utility and deployment scripts
```

## Package Structure (`packages/`)

- **cli**: Botpress CLI tool for development workflow
- **sdk**: Core SDK for building integrations and bots
- **client**: Type-safe API clients for Botpress services
- **cognitive**: AI/ML utilities and abstractions
- **llmz**: LLM integration utilities
- **vai/zai**: AI-specific packages
- **chat-api/chat-client**: Chat functionality
- **common**: Shared utilities across packages

## Integration Structure (`integrations/`)

Each integration follows a standard pattern:
```
integration-name/
├── integration.definition.ts  # Integration schema and config
├── src/                      # Implementation code
├── hub.md                    # Hub marketplace description
├── icon.svg                  # Integration icon
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── .botpress/                # Build artifacts
└── bp_modules/               # Generated modules
```

## Key Files

- **integration.definition.ts**: Defines integration schema, actions, events, and configuration
- **src/index.ts**: Main integration implementation
- **hub.md**: Documentation for Botpress Hub
- **extract.vrl**: Vector Routing Language for data extraction (some integrations)
- **linkTemplate.vrl**: URL template generation (some integrations)

## Build Artifacts

- **.botpress/**: Generated build files
- **bp_modules/**: Generated interface modules
- **dist/**: Compiled output (packages only)
- **.turbo/**: Turborepo cache

## Configuration Patterns

- Each workspace has its own `package.json` and `tsconfig.json`
- Integrations extend base interfaces using `.extend()` pattern
- Shared configurations inherit from root-level files
- Environment variables prefixed with `BP_*` are globally available