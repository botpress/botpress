# Chat Mode Documentation

Chat Mode enables interactive conversational agents with real-time user interaction. This mode is ideal for building assistants, chatbots, and interactive applications.

## Basic Chat Setup

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

## Core Concepts

### Chat Interface

The chat interface manages:
- **Conversation History**: Maintains transcript of user/agent interactions
- **User Input**: Captures and processes user messages
- **Message Display**: Renders agent responses and UI components

### Automatic Exits

When using chat mode, LLMz automatically adds a `ListenExit` that allows the agent to pause execution and wait for user input.

## Custom Exits

Define custom termination conditions with type-safe outputs:

```typescript
import { Exit } from 'llmz'
import { z } from 'zod'

const exitChat = new Exit({
  name: 'exit',
  description: 'When the user wants to exit the program',
})

const escalation = new Exit({
  name: 'escalation',
  description: 'Escalate to human agent',
  schema: z.object({
    reason: z.enum(['Frustrated user', 'Technical issue', 'Sensitive topic']),
  }),
})

const result = await execute({
  instructions: 'Help the user with their query',
  exits: [exitChat, escalation],
  chat,
  client,
})

// Type-safe exit handling
if (result.is(exitChat)) {
  console.log('User ended the conversation')
  process.exit(0)
}

if (result.is(escalation)) {
  console.log(`Escalation needed: ${result.output.reason}`)
  // Handle escalation logic
}
```

## Tools in Chat Mode

Tools enable agents to perform actions and access external services:

```typescript
import { Tool } from 'llmz'
import { z } from 'zod'

const webSearch = new Tool({
  name: 'searchWeb',
  description: 'Search the internet for information',
  input: z.object({
    query: z.string(),
  }),
  output: z.object({
    results: z.array(z.string()),
  }),
  async handler({ query }) {
    // Integration with your search service
    // Could be Google Search API, Bing, etc.
    return { results: await searchAPI(query) }
  },
})

await execute({
  instructions: 'Help users find information online',
  tools: [webSearch],
  chat,
  client,
})
```

### Conditional Tool Access

Implement role-based access control or dynamic tool availability:

```typescript
const tools = []

// Add tools based on user permissions
if (user.role === 'admin') {
  tools.push(adminTool)
}

if (user.subscriptionLevel === 'premium') {
  tools.push(premiumFeatureTool)
}

await execute({
  instructions: `You are an assistant for ${user.role} users`,
  tools,
  chat,
  client,
})
```

## User Confirmation Patterns

Implement safety checks for destructive operations:

```typescript
import { ThinkSignal } from 'llmz'

const dangerousTool = new Tool({
  name: 'deleteData',
  description: 'Delete user data (requires confirmation)',
  input: z.object({
    dataId: z.string(),
  }),
  output: z.object({
    success: z.boolean(),
  }),
  async handler({ dataId }, { emit }) {
    // Pause execution for user confirmation
    emit(new ThinkSignal('Are you sure you want to delete this data? This cannot be undone.'))
    
    // Tool continues after user confirms
    const deleted = await deleteUserData(dataId)
    return { success: deleted }
  },
})
```

## Components and UI Generation

Generate interactive UI components within conversations:

```typescript
import { Component } from 'llmz'
import { z } from 'zod'

const buttonComponent = new Component({
  name: 'Button',
  description: 'Render an interactive button',
  props: z.object({
    text: z.string(),
    action: z.string(),
  }),
  render: ({ text, action }) => `<button onclick="${action}">${text}</button>`,
})

await execute({
  instructions: 'Create interactive interfaces for users',
  components: [buttonComponent],
  chat,
  client,
})
```

## State Management with Variables

Maintain conversation state using ObjectInstance:

```typescript
import { ObjectInstance } from 'llmz'
import { z } from 'zod'

const userProfile = new ObjectInstance({
  name: 'userProfile',
  description: 'Track user preferences and information',
  schema: z.object({
    name: z.string().optional(),
    preferences: z.array(z.string()).default([]),
    lastSeen: z.date().optional(),
  }),
  initialValue: {},
})

await execute({
  instructions: 'Remember user preferences throughout the conversation',
  objects: [userProfile],
  chat,
  client,
})
```

## Multi-Agent Orchestration

Build systems where multiple specialized agents collaborate:

```typescript
// Note: This is an example pattern, not a built-in LLMz feature
class AgentOrchestrator {
  private agents = new Map()

  registerAgent(name: string, agent: Agent) {
    this.agents.set(name, agent)
  }

  async routeToAgent(intent: string, context: any) {
    const targetAgent = this.determineAgent(intent)
    return await execute({
      instructions: targetAgent.instructions,
      tools: targetAgent.tools,
      chat: context.chat,
      client: context.client,
    })
  }
}

// Usage
const orchestrator = new AgentOrchestrator()
orchestrator.registerAgent('support', supportAgent)
orchestrator.registerAgent('sales', salesAgent)

// Route conversations based on intent
const result = await orchestrator.routeToAgent(userIntent, { chat, client })
```

## Guardrails and Safety

Implement content moderation and safety checks:

```typescript
import { Zai } from '@botpress/zai' // Example with Botpress AI

await execute({
  instructions: 'Help users while maintaining safety standards',
  chat,
  client,
  
  async onBeforeExecution(iteration) {
    // Validate generated code for safety
    const analysis = await Zai.Guard.validateContent(iteration.code)
    
    if (analysis.violations.length > 0) {
      throw new Error('Generated code violates safety policies')
    }
  },
})
```

## Error Handling and Recovery

Handle conversation errors gracefully:

```typescript
try {
  const result = await execute({
    instructions: 'Your chat instructions',
    chat,
    client,
  })
} catch (error) {
  // Graceful error handling
  chat.sendMessage('I encountered an error. Let me try a different approach.')
  
  // Retry with different approach
  const retryResult = await execute({
    instructions: 'Simplified instructions for error recovery',
    chat,
    client,
  })
}
```

## Integration Examples

### RAG Implementation

```typescript
// Example RAG implementation using external vector database
const ragTool = new Tool({
  name: 'searchKnowledge',
  description: 'Search knowledge base for relevant information',
  input: z.object({
    query: z.string(),
  }),
  output: z.object({
    documents: z.array(z.object({
      content: z.string(),
      source: z.string(),
    })),
  }),
  async handler({ query }) {
    // Integration with your vector database
    // Could be Pinecone, Weaviate, ChromaDB, etc.
    const results = await vectorDB.similarity_search(query)
    return { documents: results }
  },
})
```

### LangChain Integration

```typescript
// Example integration with LangChain tools
import { Tool as LangChainTool } from 'langchain/tools'

function wrapLangChainTool(langchainTool: LangChainTool) {
  return new Tool({
    name: langchainTool.name,
    description: langchainTool.description,
    input: z.object({
      input: z.string(),
    }),
    output: z.object({
      result: z.string(),
    }),
    async handler({ input }) {
      const result = await langchainTool.call(input)
      return { result }
    },
  })
}
```

## Best Practices

1. **Clear Instructions**: Provide specific, actionable instructions for the agent
2. **Tool Composition**: Design tools that work well together
3. **Error Boundaries**: Implement proper error handling and recovery
4. **State Management**: Use ObjectInstance for persistent conversation state
5. **Safety First**: Always implement appropriate guardrails and validation
6. **User Experience**: Design clear exit conditions and confirmation flows

## Common Patterns

- **Information Gathering**: Sequential tool calls to collect comprehensive data
- **Task Automation**: Multi-step workflows with user confirmation
- **Decision Trees**: Conditional logic based on user responses
- **Context Switching**: Agent handoffs based on conversation needs
- **Memory Management**: Persistent state across conversation sessions