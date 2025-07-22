# Getting Started with LLMz

## Introduction

LLMz is a revolutionary TypeScript AI agent framework that generates and executes TypeScript code instead of using traditional JSON tool calling. It leverages the massive body of TypeScript knowledge within LLMs to enable agents to handle complex logic, loops, conditionals, and multi-tool orchestration seamlessly.

**Core Philosophy**: Stop chaining tools. Start generating real code.

## Why LLMz?

Traditional AI frameworks rely on JSON-based tool calling, which limits agents to simple, linear operations. LLMz breaks this barrier by:

- **Code Generation**: LLMs generate actual TypeScript code with full language capabilities
- **Complex Logic**: Support for loops, conditionals, async/await, and sophisticated control flow
- **Tool Orchestration**: Natural composition of multiple tools within generated code
- **Type Safety**: Full TypeScript inference and validation throughout execution
- **Framework Agnostic**: Works with any LLM provider or tool ecosystem

## Installation

```bash
npm install llmz
# or
pnpm add llmz
# or
yarn add llmz
```

## Basic Concepts

### Execution Modes

LLMz operates in two primary modes:

- **Chat Mode**: Interactive conversational agents with real-time user interaction
- **Worker Mode**: Automated execution environments with enhanced security and sandboxing

### Core Components

- **Tools**: TypeScript functions with Zod schemas for input/output validation
- **Exits**: Custom termination conditions with type-safe result handling
- **Components**: UI component system with JSX generation capabilities
- **Context**: Execution environment and state management

## Quick Start

### Basic Worker Example

```typescript
import { execute } from 'llmz'
import { Client } from '@botpress/client' // or your LLM client

const client = new Client({
  // Your LLM provider configuration
})

const result = await execute({
  instructions: 'Calculate the fibonacci sequence for n=10',
  client,
})

console.log(result.output)
```

### Chat Mode Example

```typescript
import { execute } from 'llmz'
import { CLIChat } from './utils/cli-chat'

const chat = new CLIChat()

while (await chat.iterate()) {
  await execute({
    instructions: 'You are a helpful assistant',
    chat,
    client,
  })
}
```

### Adding Tools

```typescript
import { Tool } from 'llmz'
import { z } from 'zod'

const calculator = new Tool({
  name: 'calculate',
  description: 'Perform mathematical calculations',
  input: z.object({
    expression: z.string(),
  }),
  output: z.object({
    result: z.number(),
  }),
  async handler({ expression }) {
    // Your calculation logic
    return { result: eval(expression) }
  },
})

const result = await execute({
  instructions: 'Calculate 25 * 4 + 10',
  tools: [calculator],
  client,
})
```

## LLM Provider Integration

LLMz is designed to work with any LLM provider. While examples use Botpress, you can integrate with:

- **OpenAI**: Direct API calls or through LangChain
- **Anthropic**: Claude API integration
- **LangChain**: Any LangChain-supported model
- **Custom Providers**: Implement your own client interface

### Custom Client Example

```typescript
interface LLMClient {
  // Implement your LLM client interface
  generateResponse(prompt: string): Promise<string>
}

class OpenAIClient implements LLMClient {
  async generateResponse(prompt: string) {
    // Your OpenAI integration
  }
}

const client = new OpenAIClient()
const result = await execute({
  instructions: 'Your task',
  client,
})
```

## Architecture Overview

### Execution Pipeline

1. **Prompt Generation**: Context-aware prompts based on execution mode
2. **Code Generation**: LLM generates TypeScript code with embedded tool calls
3. **Compilation**: Babel-based AST transformation with custom plugins
4. **Execution**: Isolated VM or Node.js execution with monitoring
5. **Result Processing**: Type-safe result handling and error recovery

### Security Model

- **Isolated Execution**: VM isolation prevents access to host system
- **Stack Trace Cleaning**: Removes internal framework details from errors
- **Tool Access Control**: Granular permissions for tool execution
- **Content Truncation**: Automatic handling of token limits
- **Error Recovery**: Graceful handling of execution failures

## Next Steps

- Explore [Chat Mode Documentation](./chat-mode.md) for interactive patterns
- Learn [Worker Mode Documentation](./worker-mode.md) for automated execution
- Review [API Reference](./api-reference.md) for complete technical details
- Browse [Examples Guide](./examples-guide.md) for practical implementations

## Framework Integration Examples

LLMz can be combined with existing AI frameworks and tools:

- **RAG Systems**: Integrate with vector databases and retrieval systems
- **Multi-Agent Frameworks**: Build orchestration layers like CrewAI or OpenAI Agents
- **Tool Ecosystems**: Use LangChain tools, custom APIs, or any TypeScript function
- **UI Frameworks**: Generate React components, CLI interfaces, or web UIs

The framework's flexibility allows you to build sophisticated AI applications while maintaining type safety and code generation capabilities.