# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is LLMz?

LLMz is a revolutionary TypeScript AI agent framework that fundamentally changes how AI agents work. Like other agent frameworks, LLMz calls LLM models in a loop to achieve desired outcomes with access to tools and memory. However, LLMz is **code-first** – meaning it generates and runs TypeScript code in a sandbox rather than using traditional JSON tool calling.

**Core Philosophy**: Stop chaining tools. Start generating real code.

### Why Code Generation Works Better

Traditional agent frameworks rely on JSON tool calling, which has significant limitations:

- Hard-to-parse JSON schemas for LLMs
- Incapable of complex logic, loops, and conditionals
- Multiple expensive roundtrips for each tool call
- Unreliable beyond simple scenarios

LLMz leverages the fact that models have been trained extensively on millions of TypeScript codebases, making them incredibly reliable at generating working code. This enables:

- Complex logic and multi-tool orchestration in **one call**
- Native LLM thinking via comments and code structure
- Complete type safety and predictable schemas
- Seamless scaling in production environments

## Core Concepts

### Execution Loop

LLMz exposes a single method (`execute`) that runs in a loop until one of these conditions:

1. **An Exit is returned** - Agent completes with structured result
2. **Agent waits for user input** (Chat Mode) - Returns control to user
3. **Maximum iterations reached** - Safety limit to prevent infinite loops

The loop automatically handles:

- Tool calling and result processing
- Thinking about outputs and context
- Error recovery and retry logic
- Variable state persistence across iterations

### Generated Code Structure

Every LLMz code block follows a predictable structure:

**Return Statement (Required)**:

```tsx
// Chat mode - give turn back to user
return { action: 'listen' }

// Worker mode - complete with result
return { action: 'done', result: calculatedValue }
```

**Tool Calls with Logic**:

```tsx
// Complex logic impossible with JSON tool calling
const price = await getTicketPrice({ from: 'quebec', to: 'new york' })

if (price > 500) {
  throw new Error('Price too high')
} else {
  const ticketId = await buyTicket({ from: 'quebec', to: 'new york' })
  return { action: 'done', result: ticketId }
}
```

**Comments for Planning**:

```tsx
// Comments help LLM think step-by-step and plan ahead
// Check user's budget first before proceeding with purchase
const budget = await getUserBudget()
```

### Execution Modes

**Chat Mode**: Interactive conversational agents

- Enabled when `chat` is provided to `execute()`
- Agents can `yield` React components to user
- Special `ListenExit` automatically available for user interaction
- Transcript management for conversation history

**Worker Mode**: Automated execution environments

- Enabled when `chat` is omitted from `execute()`
- Focus on computational tasks and data processing
- Uses `DefaultExit` if no custom exits provided
- Sandboxed execution with security isolation

### Chat Components (Chat Mode Only)

Agents can yield React components for rich user interaction:

```tsx
// Multi-line text support
yield <Text>
Hello, world!
This is a second line.
</Text>

// Composed/nested components
yield <Message>
  <Text>What do you prefer?</Text>
  <Button>Cats</Button>
  <Button>Dogs</Button>
</Message>

return { action: 'listen' }
```

Components map to communication channels (Webchat, SMS, etc.) and can be completely custom.

### Tools and Objects

**Tools**: Type-safe functions with Zod/Zui schemas

- Input/output validation and TypeScript inference
- Synchronous and asynchronous support
- Retry logic and error handling
- Tool aliases for multiple names

**Objects**: Namespaced containers for related tools and variables

- Group related functionality together
- Support both readonly and writable variables
- Variable type validation with schemas
- Mutation tracking across iterations

### Advanced Features

**Snapshots**: Pausable/resumable execution

- Throw `SnapshotSignal` to halt and serialize execution state
- Resume later from exact same point
- Useful for long-running workflows and async operations

**Thinking**: Agent reflection and variable inspection

- Agent-initiated: `return { action: 'think' }`
- Tool-initiated: Throw `ThinkSignal` to force reflection
- Helps agents avoid rushed decisions and process complex information

**Hooks**: Custom logic at execution points

- `onTrace`: Non-blocking monitoring and logging
- `onExit`: Validate exits and implement guardrails
- `onBeforeExecution`: Code mutation and security checks
- `onIterationEnd`: State augmentation between iterations

## Project Overview

LLMz operates as an LLM-native TypeScript VM built on top of Zui (Botpress's internal schema library), battle-tested in production powering millions of AI agents worldwide.

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

## Exit System

LLMz uses a sophisticated exit system for controlling agent termination:

- **Built-in Exits**: `ThinkExit`, `ListenExit`, `DefaultExit` for common patterns
- **Custom Exits**: Domain-specific exits with typed schemas using Zod/Zui
- **Type Safety**: `result.is(exit)` for compile-time type checking
- **Agent Usage**: Agents call `return { action: 'exit_name', ...data }` to exit

## Prompt System Architecture

The dual-mode prompt system (`src/prompts/`) generates different prompts based on execution mode:

- **Chat Mode**: Uses prompts from `chat-mode/` for interactive conversations
- **Worker Mode**: Uses prompts from `worker-mode/` for automated execution
- **Markdown Templates**: Prompts are written in Markdown and compiled to TypeScript
- **Dynamic Content**: Tool definitions, schemas, and context injected at runtime

## Compiler Pipeline

The Babel-based compilation system transforms generated code:

1. **AST Parsing**: TypeScript/JSX code parsed into Abstract Syntax Tree
2. **Plugin Transformation**: Custom plugins modify the AST for execution
3. **Code Generation**: Modified AST compiled back to executable JavaScript
4. **Source Maps**: Generated for debugging and error tracking

Key transformations:

- Tool call instrumentation for monitoring
- Variable extraction and tracking
- JSX component handling
- Line number preservation for stack traces

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
