# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the examples directory for LLMz, a next-generation TypeScript AI agent framework. LLMz generates and executes TypeScript code instead of using traditional JSON tool calling. The framework is battle-tested in production at Botpress, powering millions of AI agents.

## Architecture

LLMz operates in two primary modes:

- **Chat Mode**: Interactive conversational agents with tools and user interaction. Chat mode is enabled when `chat` is provided to `execute()`
- **Worker Mode**: Automated execution environments with sandboxing and security. Worker mode is enabled when `chat` is omitted from `execute()`.

### Key Components

- **llmz**: Core framework package located in parent directory (`../`)
- **Examples**: 20 numbered examples demonstrating different patterns and capabilities
- **Utils**: Shared utilities for CLI interactions, tools, and UI components
- **start.ts**: Example launcher script with environment validation

### Example Categories

**Chat Examples (01-10)**: Interactive conversational patterns

- Basic chat, exits, conditional tools, small models, web search, confirmations, guardrails, multi-agent, variables, components

**Worker Examples (11-20)**: Automated execution patterns

- Minimal workers, file system access, sandboxing, snapshots, stack traces, tool chaining, error recovery, security, tool wrapping, RAG

## Development Commands

### Running Examples

```bash
# Run a specific example by name or number
pnpm start 01_chat_basic
pnpm start chat_basic
pnpm start 01

# List all available examples
pnpm start
```

### Testing and Building (from parent llmz directory)

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Build the package
pnpm build

# Type checking
pnpm check:type

# Development watch mode
pnpm watch
```

## Environment Setup

Examples require these environment variables:

- `BOTPRESS_BOT_ID`: Your Botpress bot ID
- `BOTPRESS_TOKEN`: Your Botpress authentication token

Set these in a `.env` file in the examples root directory.

## Key Dependencies

- **@botpress/client**: Core Botpress client for LLM interactions
- **@botpress/zai**: Botpress AI utilities with retry logic
- **llmz**: The main framework (linked from parent directory)
- **tsx**: TypeScript execution engine for running examples

## Code Patterns

### Basic LLMz Execution

```typescript
import { execute } from 'llmz'
import { Client } from '@botpress/client'

const result = await execute({
  instructions: 'Your task description',
  client,
  // Optional: chat, tools, context
})
```

### Chat Interface

Examples use `CLIChat` utility for command-line interactions with conversation history and user input management.

### Tool Integration

Tools are defined as TypeScript functions and passed to the execution context. The framework generates code that calls these tools as needed.

## Security Considerations

Worker examples demonstrate sandboxing, execution limits, and security patterns. The framework includes:

- Isolated VM execution
- Stack trace sanitization
- Tool access controls
- Error recovery mechanisms

## File Structure Conventions

Each example follows this pattern:

- `index.ts`: Main example code
- `README.md`: Brief description (often just demo reference)
- `demo.svg`: Visual demonstration of the example
- Additional files for complex examples (agents, orchestrators, etc.)
