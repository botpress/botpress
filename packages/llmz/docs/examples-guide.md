# Examples Guide

This guide walks through all 20 LLMz examples, organized by category and complexity.

## Chat Examples (01-10)

Interactive conversational patterns demonstrating real-time user interaction.

### 01. Basic Chat

**File**: `examples/01_chat_basic/index.ts`

The simplest chat implementation showing core conversation flow.

```typescript
import { CLIChat } from '../utils/cli-chat'

const chat = new CLIChat()

while (await chat.iterate()) {
  await execute({
    instructions: 'You are a helpful assistant',
    chat,
    client,
  })
}
```

**Key Concepts**:
- Chat interface and conversation management
- Basic execute() usage with chat mode
- Continuous conversation loop

### 02. Chat Exits

**File**: `examples/02_chat_exits/index.ts`

Custom termination conditions with type-safe result handling.

```typescript
const exitChat = new Exit({
  name: 'exit',
  description: 'When the user wants to exit',
})

const escalation = new Exit({
  name: 'escalation',
  description: 'Escalate to human agent',
  schema: z.object({
    reason: z.enum(['Frustrated user', 'Technical issue']),
  }),
})

const result = await execute({
  exits: [exitChat, escalation],
  chat,
  client,
})

if (result.is(exitChat)) {
  process.exit(0)
}
```

**Key Concepts**:
- Custom exit definitions
- Type-safe exit handling with `result.is()`
- Schema validation for exit outputs

### 03. Conditional Tools

**File**: `examples/03_chat_conditional_tool/index.ts`

Dynamic tool access based on runtime conditions and user state.

```typescript
const tools = []

// Add tools based on user role
if (user.role === 'admin') {
  tools.push(adminTool)
}

await execute({
  instructions: `You are an assistant for ${user.role} users`,
  tools,
  chat,
  client,
})
```

**Key Concepts**:
- Role-based access control (RBAC)
- Dynamic tool configuration
- Conditional logic in tool selection

### 04. Small Models

**File**: `examples/04_chat_small_models/index.ts`

Optimizing LLMz for smaller, more efficient language models.

```typescript
const crudTool = new Tool({
  name: 'manageTodos',
  description: 'Create, read, update, delete todos',
  // Simplified interface for smaller models
})

await execute({
  instructions: 'Simple, clear instructions for small model',
  tools: [crudTool],
  chat,
  client,
})
```

**Key Concepts**:
- CRUD operations design
- Tool interfaces optimized for smaller models
- Clear, simple instruction patterns

### 05. Web Search

**File**: `examples/05_chat_web_search/index.ts`

Integration with web search APIs for information retrieval.

```typescript
const webSearchTool = new Tool({
  name: 'searchWeb',
  description: 'Search the internet',
  input: z.object({
    query: z.string(),
  }),
  async handler({ query }) {
    // Integration with your search API
    return await searchAPI(query)
  },
})

// Pre-configure tool inputs
webSearchTool.setStaticInputValues({
  apiKey: process.env.SEARCH_API_KEY,
})
```

**Key Concepts**:
- External API integration
- Tool input pre-configuration
- Web search and information retrieval

### 06. Confirmation Patterns

**File**: `examples/06_chat_confirm_tool/index.ts`

User confirmation workflows for destructive operations.

```typescript
const dangerousTool = new Tool({
  name: 'deleteData',
  description: 'Delete user data',
  async handler({ dataId }, { emit }) {
    // Pause for user confirmation
    emit(new ThinkSignal('Are you sure? This cannot be undone.'))
    
    // Continue after confirmation
    return await deleteData(dataId)
  },
})
```

**Key Concepts**:
- ThinkSignal for execution interruption
- User confirmation workflows
- Safety patterns for destructive operations

### 07. Guardrails

**File**: `examples/07_chat_guardrails/index.ts`

Content moderation and safety validation using AI-powered analysis.

```typescript
await execute({
  instructions: 'Help users while maintaining safety',
  chat,
  client,
  
  async onBeforeExecution(iteration) {
    // Example with Botpress AI (replace with your guardrail system)
    const analysis = await Zai.Guard.validateContent(iteration.code)
    
    if (analysis.violations.length > 0) {
      throw new Error('Content violates safety policies')
    }
  },
})
```

**Key Concepts**:
- AI-powered content moderation
- Pre-execution validation hooks
- Safety policy enforcement

### 08. Multi-Agent Orchestration

**File**: `examples/08_chat_multi_agent/index.ts`

Example framework for orchestrating multiple specialized agents.

```typescript
// Note: This is an example pattern, not built into LLMz
class SimpleOrchestrator {
  async routeToAgent(intent: string, context: any) {
    const agent = this.selectAgent(intent)
    
    return await execute({
      instructions: agent.instructions,
      tools: agent.tools,
      chat: context.chat,
      client: context.client,
    })
  }
}
```

**Key Concepts**:
- Agent routing and handoff patterns
- Context spreading between agents
- Minimalistic orchestration framework example

### 09. Variables and State

**File**: `examples/09_chat_variables/index.ts`

Persistent state management using ObjectInstance.

```typescript
const userProfile = new ObjectInstance({
  name: 'userProfile',
  schema: z.object({
    name: z.string().optional(),
    preferences: z.array(z.string()).default([]),
  }),
  initialValue: {},
  methods: {
    updatePreferences: {
      input: z.object({ preferences: z.array(z.string()) }),
      async handler({ preferences }, { update }) {
        update((state) => {
          state.preferences = preferences
        })
      },
    },
  },
})
```

**Key Concepts**:
- Stateful object management
- Property validation with Zod schemas
- Method definitions for state manipulation

### 10. Components

**File**: `examples/10_chat_components/index.ts`

UI component generation with JSX support.

```typescript
const buttonComponent = new Component({
  name: 'Button',
  description: 'Interactive button',
  props: z.object({
    text: z.string(),
    action: z.string(),
  }),
  render: ({ text, action }) => `<button onclick="${action}">${text}</button>`,
})

await execute({
  instructions: 'Create interactive UI elements',
  components: [buttonComponent],
  chat,
  client,
})
```

**Key Concepts**:
- JSX component definition and rendering
- Component registration and usage
- Interactive UI element generation

## Worker Examples (11-20)

Automated execution patterns for computational tasks and data processing.

### 11. Minimal Worker

**File**: `examples/11_worker_minimal/index.ts`

Basic worker mode for computational tasks.

```typescript
const result = await execute({
  instructions: 'Calculate fibonacci sequence for n=10',
  client,
})

console.log('Result:', result.output)
console.log('Generated code:', result.iteration.code)
```

**Key Concepts**:
- One-shot execution pattern
- Mathematical computation
- Code inspection and result analysis

### 12. File System Operations

**File**: `examples/12_worker_fs/index.ts`

File system simulation using ObjectInstance.

```typescript
const fileSystem = new ObjectInstance({
  name: 'fs',
  schema: z.object({
    files: z.record(z.string()),
  }),
  initialValue: { files: {} },
  methods: {
    writeFile: {
      input: z.object({
        path: z.string(),
        content: z.string(),
      }),
      async handler({ path, content }, { update }) {
        update((state) => {
          state.files[path] = content
        })
      },
    },
  },
})
```

**Key Concepts**:
- ObjectInstance vs Tool patterns
- Stateful file system simulation
- Method-based object interaction

### 13. Sandbox Protection

**File**: `examples/13_worker_sandbox/index.ts`

Execution control and safety limits.

```typescript
const controller = new AbortController()
setTimeout(() => controller.abort(), 5000)

const result = await execute({
  instructions: 'Perform safe calculations',
  client,
  signal: controller.signal,
  options: {
    timeout: 3000,
    maxIterations: 2,
  },
})
```

**Key Concepts**:
- AbortController usage for timeout protection
- Execution limits and safety bounds
- Timeout and iteration controls

### 14. Snapshots

**File**: `examples/14_worker_snapshot/index.ts`

State persistence and execution resumption.

```typescript
const longTask = new Tool({
  name: 'processData',
  async handler({ step }, { emit }) {
    for (let i = step; i <= 10; i++) {
      await processStep(i)
      
      // Create snapshots for resumption
      if (i % 3 === 0) {
        emit(new SnapshotSignal(`Completed step ${i}`))
      }
    }
  },
})

// Resume from snapshot
const result = await execute({
  instructions: 'Resume processing',
  tools: [longTask],
  snapshot: previousSnapshot,
  client,
})
```

**Key Concepts**:
- SnapshotSignal for state persistence
- Execution resumption from snapshots
- Long-running task management

### 15. Stack Traces

**File**: `examples/15_worker_stacktraces/index.ts`

Error handling and debugging with clean stack traces.

```typescript
const result = await execute({
  instructions: 'Code that might error',
  client,
})

if (result.status === 'error') {
  // Stack traces are automatically cleaned
  console.log('Error:', result.error.message)
  console.log('Stack:', result.error.stack) // Framework details removed
}
```

**Key Concepts**:
- Automatic stack trace sanitization
- Error status checking
- Debugging and error reporting

### 16. Tool Chaining

**File**: `examples/16_worker_tool_chaining/index.ts`

Sophisticated multi-tool workflows in single execution.

```typescript
const dataLoader = new Tool({
  name: 'loadData',
  // Load from external source
})

const processor = new Tool({
  name: 'processData',
  // Transform and analyze
})

const exporter = new Tool({
  name: 'exportResults',
  // Save to destination
})

const result = await execute({
  instructions: 'Load data, process it, and export results',
  tools: [dataLoader, processor, exporter],
  client,
})
```

**Key Concepts**:
- Complex data flow orchestration
- Multi-tool coordination
- Single-turn workflow execution

### 17. Error Recovery

**File**: `examples/17_worker_error_recovery/index.ts`

Intelligent error recovery and retry logic.

```typescript
const errorProneTool = new Tool({
  name: 'flaky',
  async handler({ input }) {
    if (input !== 'expected_value') {
      throw new Error('Invalid input, expected "expected_value"')
    }
    return { result: 'success' }
  },
})

// LLMz automatically learns from errors and retries
const result = await execute({
  instructions: 'Use the flaky tool successfully',
  tools: [errorProneTool],
  client,
})
```

**Key Concepts**:
- Automatic error analysis and correction
- Intelligent retry mechanisms
- Self-adapting code generation

### 18. Security Testing

**File**: `examples/18_worker_security/index.ts`

⚠️ **Security testing only** - Contains malicious code patterns for testing sandbox protection.

```typescript
const maliciousScripts = [
  {
    title: 'Infinite loop',
    code: 'while (true) {}',
  },
  {
    title: 'Memory exhaustion',
    code: 'const arr = []; while (true) arr.push(new Array(1e6))',
  },
  // ... 15 different attack vectors
]

// Test each attack vector
for (const script of maliciousScripts) {
  const result = await execute({
    options: { timeout: 2000 },
    client,
    async onBeforeExecution(iteration) {
      iteration.code = script.code
    },
  })
}
```

**Key Concepts**:
- Sandbox security validation
- Malicious code pattern testing
- VM escape prevention
- Resource exhaustion protection

### 19. Tool Wrapping

**File**: `examples/19_worker_wrap_tool/index.ts`

Tool enhancement and composition patterns.

```typescript
const baseTool = new Tool({
  name: 'basic',
  // Basic functionality
})

// Create enhanced version using decorator pattern
const enhancedTool = baseTool.clone({
  // Extend output schema
  output: (schema) => schema!.extend({
    metadata: z.object({
      timestamp: z.date(),
      version: z.string(),
    }),
  }),
  
  // Enhanced handler
  async handler(input, ctx) {
    const result = await baseTool.execute(input, ctx)
    
    return {
      ...result,
      metadata: {
        timestamp: new Date(),
        version: '2.0.0',
      },
    }
  },
})
```

**Key Concepts**:
- Tool cloning and enhancement
- Schema composition and extension
- Decorator pattern implementation

### 20. RAG Implementation

**File**: `examples/20_chat_rag/index.ts`

Example Retrieval-Augmented Generation system using external search capabilities.

```typescript
// Note: This is an example implementation, not built into LLMz
const documentStore = new ObjectInstance({
  name: 'documents',
  schema: z.object({
    documents: z.array(z.object({
      id: z.string(),
      content: z.string(),
      metadata: z.record(z.unknown()),
    })),
  }),
  methods: {
    search: {
      input: z.object({ query: z.string() }),
      output: z.object({
        results: z.array(z.object({
          content: z.string(),
          source: z.string(),
          relevance: z.number(),
        })),
      }),
      async handler({ query }, { get }) {
        // Example similarity search implementation
        // In practice, integrate with your vector database
        const docs = get().documents
        return { results: performSimilaritySearch(docs, query) }
      },
    },
  },
})

await execute({
  instructions: 'Answer questions using document knowledge',
  objects: [documentStore],
  chat,
  client,
})
```

**Key Concepts**:
- Document storage and retrieval example
- Citation tracking and source attribution
- Example RAG pattern (not framework built-in)
- Integration with external vector databases

## Running Examples

### Prerequisites

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials
```

### Example Launcher

```bash
# Run specific example
pnpm start 01_chat_basic
pnpm start chat_basic
pnpm start 01

# List all examples
pnpm start

# Run with debug output
DEBUG=true pnpm start 11_worker_minimal
```

## Integration Patterns

### Custom LLM Providers

Examples use Botpress, but you can integrate any LLM provider:

```typescript
// OpenAI integration example
class OpenAIClient {
  async generateResponse(prompt: string) {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
    })
    return response.choices[0].message.content
  }
}

// LangChain integration example
class LangChainClient {
  async generateResponse(prompt: string) {
    const response = await this.llm.call(prompt)
    return response
  }
}
```

### External Tool Integration

```typescript
// LangChain tools
function wrapLangChainTool(tool: LangChainTool) {
  return new Tool({
    name: tool.name,
    description: tool.description,
    input: z.object({ input: z.string() }),
    output: z.object({ result: z.string() }),
    async handler({ input }) {
      return { result: await tool.call(input) }
    },
  })
}

// Vector database integration
const vectorSearchTool = new Tool({
  name: 'searchVectors',
  description: 'Search vector database',
  async handler({ query }) {
    // Pinecone, Weaviate, ChromaDB, etc.
    return await vectorDB.similarity_search(query)
  },
})
```

## Best Practices

1. **Start Simple**: Begin with basic examples and gradually add complexity
2. **Security First**: Always implement appropriate guardrails and sandboxing
3. **Error Handling**: Use the error recovery patterns from examples
4. **State Management**: Leverage snapshots for long-running tasks
5. **Tool Design**: Create composable tools that work well together
6. **Testing**: Use security examples to validate your sandbox configuration

## Common Issues

- **Environment Variables**: Ensure all required credentials are set
- **VM Driver**: Use `VM_DRIVER=node` for development if isolated-vm fails
- **Timeouts**: Adjust timeout values for complex operations
- **Memory Limits**: Configure appropriate limits for your use case
- **Tool Validation**: Ensure input/output schemas match expected data types