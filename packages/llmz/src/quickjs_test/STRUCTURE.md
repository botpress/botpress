# LLMz Project Structure

## Overview

LLMz is a code-first TypeScript AI agent framework that generates and executes TypeScript code in a sandboxed VM rather than using traditional JSON tool calling. This document outlines the project structure and key components.

**Package Name**: `llmz`
**Version**: 0.0.27
**Description**: An LLM-native TypeScript VM built on top of Zui
**Repository**: https://github.com/botpress/botpress

## Core Philosophy

Stop chaining tools. Start generating real code.

LLMz leverages the massive body of TypeScript knowledge in LLMs to enable agents that can handle complex logic, loops, conditionals, and multi-tool orchestration in a single call—eliminating the multiple expensive roundtrips required by traditional JSON tool calling.

## Project Structure

```
packages/llmz/
├── src/                        # Source code
│   ├── llmz.ts                # Core execution engine
│   ├── vm.ts                  # Virtual machine with isolated-vm
│   ├── compiler/              # TypeScript compilation pipeline
│   │   ├── compiler.ts        # Main compiler logic
│   │   └── plugins/           # AST transformation plugins
│   │       ├── track-tool-calls.ts      # Instrument tool calls
│   │       ├── variable-extraction.ts   # Extract variable usage
│   │       ├── line-tracking.ts         # Source map generation
│   │       ├── jsx-preserve-newlines.ts # Maintain JSX formatting
│   │       ├── async-iterator.ts        # Async iteration support
│   │       ├── braces-tsx.ts            # TSX braces handling
│   │       ├── replace-comment.ts       # Comment processing
│   │       └── return-async.ts          # Async return handling
│   ├── prompts/               # Dual-mode prompt system
│   │   ├── prompt.ts          # Prompt generation logic
│   │   ├── common.ts          # Shared prompt utilities
│   │   ├── dual-modes.ts      # Mode selection logic
│   │   ├── chat-mode/         # Chat mode prompts
│   │   │   ├── system.md.ts   # System prompt
│   │   │   └── user.md.ts     # User prompt
│   │   └── worker-mode/       # Worker mode prompts
│   │       ├── system.md.ts   # System prompt
│   │       └── user.md.ts     # User prompt
│   ├── chat.ts                # Chat interface & message handling
│   ├── tool.ts                # Tool definition & execution
│   ├── exit.ts                # Exit system for agent termination
│   ├── component.ts           # UI component system
│   ├── component.default.ts   # Default component implementations
│   ├── jsx.ts                 # JSX runtime support
│   ├── objects.ts             # Namespaced tools & variables
│   ├── context.ts             # Execution context & iteration tracking
│   ├── transcript.ts          # Conversation history management
│   ├── result.ts              # Execution result types
│   ├── snapshots.ts           # Pausable/resumable execution
│   ├── errors.ts              # Error handling & signals
│   ├── stack-traces.ts        # Stack trace sanitization
│   ├── truncator.ts           # Content truncation for token limits
│   ├── citations.ts           # Citation management
│   ├── inspect.ts             # Variable inspection utilities
│   ├── hoist.ts               # Variable hoisting logic
│   ├── handlers.ts            # Event handlers
│   ├── abort-signal.ts        # Abort signal implementation
│   ├── formatting.ts          # Code formatting utilities
│   ├── getter.ts              # Value getter utilities
│   ├── types.ts               # Core type definitions
│   ├── typings.ts             # TypeScript type generation
│   ├── utils.ts               # Utility functions
│   ├── index.ts               # Public API exports
│   └── __tests__/             # Test utilities
├── examples/                   # Example implementations
│   ├── 01_chat_basic/         # Basic chat mode
│   ├── 02_chat_exits/         # Custom exits
│   ├── 03_chat_conditional_tool/  # Conditional tool usage
│   ├── 04_chat_small_models/  # Small model optimization
│   ├── 05_chat_web_search/    # Web search integration
│   ├── 06_chat_confirm_tool/  # Tool confirmation
│   ├── 07_chat_guardrails/    # Guardrails & safety
│   ├── 08_chat_multi_agent/   # Multi-agent systems
│   ├── 09_chat_variables/     # Variable management
│   ├── 10_chat_components/    # UI components
│   ├── 11_worker_minimal/     # Minimal worker mode
│   ├── 12_worker_fs/          # File system access
│   ├── 13_worker_sandbox/     # Sandbox execution
│   ├── 14_worker_snapshot/    # Snapshot/resume
│   ├── 15_worker_stacktraces/ # Stack trace handling
│   ├── 16_worker_tool_chaining/  # Tool chaining
│   ├── 17_worker_error_recovery/ # Error recovery
│   ├── 18_worker_security/    # Security features
│   ├── 19_worker_wrap_tool/   # Tool wrapping
│   ├── 20_chat_rag/           # RAG implementation
│   ├── start.ts               # Example runner
│   └── utils/                 # Example utilities
├── docs/                       # Documentation
├── scripts/                    # Build scripts
│   └── compile-markdown.mts   # Markdown to TypeScript compiler
├── dist/                       # Compiled output
├── package.json               # Package configuration
├── tsconfig.json              # TypeScript configuration
├── tsup.config.ts             # Build configuration (ESM + CJS)
├── vitest.config.ts           # Test configuration
├── vitest.setup.ts            # Test setup
├── vitest.snapshot.ts         # Snapshot utilities
├── vitest.stack-trace-serializer.ts  # Stack trace serialization
├── eslint.config.mjs          # ESLint configuration
├── README.md                  # User-facing documentation
├── DOCS.md                    # Detailed documentation
└── CLAUDE.md                  # Claude Code guidance
```

## Key Components

### 1. Core Execution Engine (`llmz.ts`)

The main execution loop that orchestrates:
- Tool calling and result processing
- Thinking about outputs and context
- Error recovery and retry logic
- Variable state persistence across iterations

Runs until one of these conditions:
1. An Exit is returned (agent completes)
2. Agent waits for user input (Chat Mode)
3. Maximum iterations reached (safety limit)

### 2. Virtual Machine (`vm.ts`)

Sandboxed code execution environment:
- **Production**: Uses `isolated-vm` for security isolation
- **CI/Development**: Falls back to Node.js VM for compatibility
- **Browser**: Standard JavaScript execution

### 3. Compiler Pipeline (`compiler/`)

Babel-based TypeScript compilation with AST transformations:
1. Parse TypeScript/JSX into Abstract Syntax Tree
2. Apply custom plugins for instrumentation and tracking
3. Generate executable JavaScript with source maps
4. Track tool calls, variables, and line numbers

### 4. Prompt System (`prompts/`)

Dual-mode prompt generation:
- **Chat Mode** (`chat-mode/`): Interactive conversational agents
- **Worker Mode** (`worker-mode/`): Automated execution environments
- Markdown templates compiled to TypeScript
- Dynamic content injection at runtime

### 5. Tool System (`tool.ts`)

Type-safe functions with Zod/Zui schemas:
- Input/output validation with TypeScript inference
- Synchronous and asynchronous support
- Retry logic and error handling
- Tool aliases for multiple names

### 6. Exit System (`exit.ts`)

Structured agent termination:
- Built-in exits: `ThinkExit`, `ListenExit`, `DefaultExit`
- Custom exits with typed schemas
- Type-safe result checking with `result.is(exit)`
- Agent usage: `return { action: 'exit_name', ...data }`

### 7. Component System (`component.ts`, `jsx.ts`)

React-like UI components for interactive chat:
- JSX compilation and rendering
- Multi-line text support
- Nested/composed components
- Maps to communication channels (Webchat, SMS, etc.)

### 8. Objects (`objects.ts`)

Namespaced containers for related functionality:
- Group tools and variables together
- Readonly and writable variable support
- Type validation with schemas
- Mutation tracking across iterations

### 9. Context & Iteration (`context.ts`)

Execution context management:
- Iteration tracking and status
- Variable state preservation
- Built-in exits (Think, Listen, Default)
- Execution mode detection

### 10. Chat Interface (`chat.ts`)

Chat mode functionality:
- Message handling and history
- User interaction management
- Component yielding
- Transcript management

### 11. Results (`result.ts`)

Type-safe execution results:
- Success/Error/Interrupted states
- Type-safe exit checking
- Error handling and recovery
- Partial result support

### 12. Snapshots (`snapshots.ts`)

Pausable/resumable execution:
- Throw `SnapshotSignal` to halt execution
- Serialize complete execution state
- Resume from exact same point
- Useful for long-running workflows

### 13. Advanced Features

**Thinking** (`context.ts`, `errors.ts`):
- Agent-initiated: `return { action: 'think' }`
- Tool-initiated: Throw `ThinkSignal`
- Forces reflection and variable inspection

**Hooks** (defined in `llmz.ts`):
- `onTrace`: Non-blocking monitoring/logging
- `onExit`: Exit validation and guardrails
- `onBeforeExecution`: Code mutation and security
- `onIterationEnd`: State augmentation between iterations
- `onBeforeTool`: Modify tool inputs before execution
- `onAfterTool`: Modify tool outputs after execution

**Stack Traces** (`stack-traces.ts`):
- Sanitization of internal framework details
- User-friendly error messages
- Source map support

**Truncation** (`truncator.ts`):
- Automatic token limit handling
- Content wrapping and unwrapping
- Preserves structure while reducing size

## Execution Modes

### Chat Mode
Enabled when `chat` is provided to `execute()`:
- Interactive conversational agents
- Agents can yield React components
- Special `ListenExit` for user interaction
- Transcript management for conversation history

### Worker Mode
Enabled when `chat` is omitted from `execute()`:
- Automated execution environments
- Focus on computation and data processing
- Uses `DefaultExit` if no custom exits provided
- Sandboxed execution with security isolation

## Dependencies

### Core Runtime
- `isolated-vm`: Secure JavaScript execution environment
- `@babel/*`: TypeScript/JSX compilation pipeline
- `@botpress/client`: Botpress API integration
- `@bpinternal/zui`: Schema validation and TypeScript generation
- `@botpress/cognitive`: LLM generation
- `@bpinternal/thicktoken`: Token counting

### Utilities
- `handlebars`: Template processing for prompts
- `lru-cache`: Caching for compiled code
- `lodash-es`: Utility functions
- `prettier`: Code formatting
- `exponential-backoff`: Retry logic
- `ulid`: ID generation
- `bytes`, `ms`: Formatting utilities

### Development
- `tsup`: Fast TypeScript bundler (ESM + CJS)
- `vitest`: Modern test framework
- `@microsoft/api-extractor`: API documentation
- `ts-node`, `tsx`: TypeScript execution
- `esbuild`: Fast bundler

## Build & Test Commands

```bash
# Build the package
pnpm build

# Type checking
pnpm check:type

# Development mode
pnpm watch

# Run tests
pnpm test
pnpm test:watch
pnpm test:update

# Generate prompts
pnpm generate
```

## Testing Configuration

- Vitest with custom LLM testing configuration
- Retry mechanism (2 retries) for LLM non-determinism
- Extended timeout (60s) for LLM responses
- Custom snapshot serializers for stack traces
- Markdown and text file loaders

## Environment Variables

- `VM_DRIVER`: Choose VM execution environment ('isolated-vm' | 'node')
- `CI`: Automatically detected, affects VM driver selection

## Generated Code Structure

Every LLMz code block follows this pattern:

```typescript
// Comments help LLM think and plan
const result = await toolCall({ param: 'value' })

// Complex logic impossible with JSON tool calling
if (result > threshold) {
  // Do something
} else {
  // Do something else
}

// Required: Return statement to exit
return { action: 'done', result: finalValue }
// OR for chat mode:
return { action: 'listen' }
```

## Security Considerations

- VM isolation prevents host system access
- Stack trace cleaning removes internal details
- Tool access control with granular permissions
- Content truncation for token limits
- Error recovery with graceful handling

## Battle-Tested at Scale

- 1+ year in production
- Millions of active users
- Hundreds of thousands of deployed agents
- Powers Botpress platform globally

## Export Structure

Main exports from `index.ts`:
- `execute()`: Main execution function
- `init()`: Optional preload for performance
- `Tool`, `Exit`, `ObjectInstance`: Core building blocks
- `Component` system: UI components
- `Chat`: Chat interface
- `Snapshot`: Pausable execution
- Signal types: `SnapshotSignal`, `ThinkSignal`, `LoopExceededError`
- Result types: `ExecutionResult`, `SuccessExecutionResult`, `ErrorExecutionResult`
- Context types: `Context`, `Iteration`, `ListenExit`, `ThinkExit`, `DefaultExit`
- Utilities: `utils.toValidObjectName`, `utils.toValidFunctionName`, `utils.wrapContent`, `utils.truncateWrappedContent`

## Architecture Patterns

### Execution Flow
1. **Prompt Generation**: Select and generate appropriate prompt based on mode
2. **Code Generation**: LLM generates TypeScript code with embedded tools
3. **Compilation**: Babel transforms code with custom plugins
4. **Execution**: Run in isolated VM or Node.js with monitoring
5. **Result Processing**: Type-safe result handling and error recovery

### Key Design Principles
- **Type Safety**: Full TypeScript inference throughout
- **Sandboxing**: Secure execution in isolated environment
- **Observability**: Comprehensive tracing and monitoring
- **Extensibility**: Hooks for customization at every stage
- **Performance**: Code splitting, caching, lazy loading
- **Reliability**: Error recovery, retry logic, graceful degradation
