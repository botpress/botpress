# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LLMz is a revolutionary TypeScript AI agent framework that generates and executes TypeScript code instead of using traditional JSON tool calling. It leverages the massive body of TypeScript knowledge within LLMs to enable agents to handle complex logic, loops, conditionals, and multi-tool orchestration seamlessly.

**Core Philosophy**: Stop chaining tools. Start generating real code.

## Architecture

LLMz operates as an LLM-native TypeScript VM built on top of Zui (Botpress's internal schema library). The framework includes two primary execution modes:

LLMz operates in two primary modes:

- **Chat Mode**: Interactive conversational agents with tools and user interaction. Chat mode is enabled when `chat` is provided to `execute()`
- **Worker Mode**: Automated execution environments with sandboxing and security. Worker mode is enabled when `chat` is omitted from `execute()`.

### Core Components

**Main Framework** (`src/`):

- `llmz.ts`: Core execution engine and context management
- `vm.ts`: Virtual machine with isolated-vm and Node.js execution environments
- `compiler/`: TypeScript compilation pipeline with AST transformations
- `chat.ts`: Chat interface and message handling
- `tool.ts`: Tool definition and execution system
- `component.ts`: UI component system for interactive elements

**Execution Pipeline**:

- `prompts/`: Dual-mode prompt system (chat-mode/, worker-mode/)
- `transcript.ts`: Conversation history and context management
- `context.ts`: Execution context and iteration tracking
- `result.ts`: Execution result types and error handling

**Safety & Security**:

- `errors.ts`: Comprehensive error handling and signals
- `stack-traces.ts`: Stack trace sanitization
- `snapshots.ts`: Execution state snapshots
- `truncator.ts`: Content truncation for token limits

## Development Commands

### Building and Testing

```bash
# Build the package (TypeScript compilation + bundling)
pnpm build

# Type checking without emitting files
pnpm check:type

# Development mode with hot reloading
pnpm watch

# Run test suite
pnpm test

# Run tests in watch mode
pnpm test:watch

# Update test snapshots
pnpm test:update

# Generate prompt files (.md.ts) files after changing them
pnpm generate
```

### Testing Configuration

- Tests use Vitest with custom configuration for LLM testing
- Retry mechanism (2 retries) due to LLM non-determinism
- Extended timeout (60s) for LLM response times
- Custom snapshot serializers for stack traces
- Markdown and text file loaders for prompt testing

## Key Dependencies

**Core Runtime**:

- `isolated-vm`: Secure JavaScript execution environment
- `@babel/*`: TypeScript/JSX compilation pipeline
- `@botpress/client`: Botpress API integration
- `@bpinternal/zui`: Schema validation and TypeScript generation

**Development**:

- `tsup`: Fast TypeScript bundler (ESM + CJS output)
- `vitest`: Modern test framework with TypeScript support
- `prettier`: Code formatting
- `handlebars`: Template processing for prompts

## Code Architecture Patterns

### Execution Flow

1. **Prompt Generation**: Dual-mode prompts based on execution type
2. **Code Generation**: LLM generates TypeScript code with embedded tools
3. **Compilation**: Babel-based AST transformation with custom plugins
4. **Execution**: Isolated VM or Node.js execution with monitoring
5. **Result Processing**: Type-safe result handling and error recovery

### Key Plugins (`src/compiler/plugins/`):

- `track-tool-calls.ts`: Instrument tool calls for monitoring
- `variable-extraction.ts`: Extract and track variable usage
- `line-tracking.ts`: Source map generation and error tracking
- `jsx-preserve-newlines.ts`: Maintain formatting in JSX components

### VM Execution Strategy

- **Production**: Uses `isolated-vm` for security isolation
- **CI/Development**: Falls back to Node.js VM for compatibility
- **Browser**: Uses standard JavaScript execution

## Tool System

Tools are defined using Zui schemas and can be:

- **Synchronous/Asynchronous**: Both execution types supported
- **Type-Safe**: Full TypeScript inference and validation
- **Retryable**: Built-in retry logic with exponential backoff
- **Traceable**: Comprehensive execution monitoring

Example tool definition:

```typescript
const tool = new Tool({
  name: 'exampleTool',
  description: 'Tool description',
  input: z.object({ param: z.string() }),
  output: z.object({ result: z.string() }),
  handler: async ({ param }) => ({ result: `Processed: ${param}` }),
})
```

## Component System

LLMz includes a React-like component system for building interactive UIs:

- **JSX Support**: Full JSX compilation and rendering
- **Type Safety**: Components are fully typed with Zui schemas
- **Rendering**: Server-side rendering to various output formats

## Security Considerations

- **Isolated Execution**: VM isolation prevents access to host system
- **Stack Trace Cleaning**: Removes internal framework details from errors
- **Tool Access Control**: Granular permissions for tool execution
- **Content Truncation**: Automatic handling of token limits
- **Error Recovery**: Graceful handling of execution failures

## File Structure Conventions

- Tests co-located with source files (`.test.ts` suffix)
- Markdown prompts compiled to TypeScript modules
- Source maps preserved for debugging
- TypeScript declaration files generated for exports

## Environment Variables

- `VM_DRIVER`: Choose VM execution environment ('isolated-vm' | 'node')
- `CI`: Automatically detected, affects VM driver selection

## Performance Considerations

- Code splitting with dynamic imports for faster startup
- LRU caching for compiled code and results
- Lazy loading of heavy dependencies
- Bundle size optimization with tsup configuration
