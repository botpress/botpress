# LLMz Documentation

**LLMz: A Revolutionary TypeScript AI Agent Framework**

_Stop chaining tools. Start generating real code._

---

## Table of Contents

1. [Introduction](#introduction)
2. [Core Philosophy](#core-philosophy)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [Execution Modes](#execution-modes)
6. [Tools](#tools)
7. [Objects and Variables](#objects-and-variables)
8. [Execution Results](#execution-results)
9. [Hooks System](#hooks-system)
10. [Advanced Features](#advanced-features)
11. [API Reference](#api-reference)
12. [Examples](#examples)

---

## Introduction

LLMz is a revolutionary TypeScript AI agent framework that fundamentally changes how AI agents work. Like other agent frameworks, LLMz calls LLM models in a loop to achieve desired outcomes with access to tools and memory. However, LLMz is **code-first** – meaning it generates and runs TypeScript code in a sandbox rather than using traditional JSON tool calling.

### What Makes LLMz Different

Traditional agent frameworks rely on JSON tool calling, which has significant limitations:

- **Hard-to-parse JSON schemas** for LLMs
- **Incapable of complex logic** like loops and conditionals
- **Multiple expensive roundtrips** for each tool call
- **Unreliable beyond simple scenarios**

LLMz leverages the fact that models have been trained extensively on millions of TypeScript codebases, making them incredibly reliable at generating working code. This enables:

- **Complex logic and multi-tool orchestration** in **one call**
- **Native LLM thinking** via comments and code structure
- **Complete type safety** and predictable schemas
- **Seamless scaling** in production environments

### Battle-Tested at Scale

LLMz operates as an LLM-native TypeScript VM built on top of Zui (Botpress's internal schema library), battle-tested in production powering millions of AI agents worldwide.

---

## Core Philosophy

### Code Generation > Tool Calling

Traditional tool-calling agents are fundamentally limited by the JSON interface between the LLM and tools. This requires multiple roundtrips for complex tasks and cannot handle conditional logic, loops, or sophisticated data processing.

LLMz solves this by letting LLMs do what they do best: **generate code**. Since models are trained extensively on code, they can reliably generate TypeScript that:

- Calls multiple tools in sequence
- Handles conditional logic and error cases
- Processes and transforms data between tool calls
- Implements complex business logic
- Maintains type safety throughout execution

### Example: Traditional vs LLMz

**Traditional Tool Calling:**

```
LLM → JSON: {"tool": "getPrice", "params": {"from": "quebec", "to": "new york"}}
System → Response: {"price": 600}
LLM → JSON: {"tool": "checkBudget", "params": {"amount": 600}}
System → Response: {"canAfford": false}
LLM → JSON: {"tool": "notifyUser", "params": {"message": "Price too high"}}
```

**LLMz Code Generation:**

```typescript
// Check the ticket price and user's budget in one go
const price = await getTicketPrice({ from: 'quebec', to: 'new york' })
const budget = await getUserBudget()

if (price > budget) {
  await notifyUser({ message: `Price $${price} exceeds budget $${budget}` })
  return { action: 'budget_exceeded', price, budget }
} else {
  const ticketId = await buyTicket({ from: 'quebec', to: 'new york' })
  return { action: 'done', result: ticketId }
}
```

---

## Quick Start

### Installation

```bash
npm install llmz @botpress/client
```

### Basic Example (Worker Mode)

```typescript
import { execute } from 'llmz'
import { Client } from '@botpress/client'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const result = await execute({
  instructions: 'Calculate the sum of numbers 1 to 100',
  client,
})

if (result.isSuccess()) {
  console.log('Result:', result.output)
  console.log('Generated code:', result.iteration.code)
}
```

### Basic Example (Chat Mode)

```typescript
import { execute } from 'llmz'
import { Client } from '@botpress/client'
import { CLIChat } from './utils/cli-chat'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

const chat = new CLIChat()

while (await chat.iterate()) {
  await execute({
    instructions: 'You are a helpful assistant',
    chat,
    client,
  })
}
```

---

## Core Concepts

### Execution Loop

At its core, LLMz exposes a single method (`execute`) that runs in a loop until one of these conditions is met:

1. **An Exit is returned** - Agent completes with structured result
2. **Agent waits for user input** (Chat Mode) - Returns control to user
3. **Maximum iterations reached** - Safety limit to prevent infinite loops

The loop automatically handles:

- Tool calling and result processing
- Thinking about outputs and context
- Error recovery and retry logic
- Variable state persistence across iterations

### Generated Code Structure

Every LLMz code block follows a predictable structure that LLMs can reliably generate:

#### Return Statement (Required)

At minimum, an LLMz response must contain a return statement with an Exit:

```typescript
// Chat mode - give turn back to user
return { action: 'listen' }

// Worker mode - complete with result
return { action: 'done', result: calculatedValue }
```

#### Tool Calls with Logic

Unlike traditional tool calling, LLMz enables complex logic impossible with JSON:

```typescript
// Complex conditional logic and error handling
const price = await getTicketPrice({ from: 'quebec', to: 'new york' })

if (price > 500) {
  throw new Error('Price too high')
} else {
  const ticketId = await buyTicket({ from: 'quebec', to: 'new york' })
  return { action: 'done', result: ticketId }
}
```

#### Comments for Planning

Comments help LLMs think step-by-step and plan ahead:

```typescript
// Check user's budget first before proceeding with purchase
const budget = await getUserBudget()

// Only proceed if we have enough funds
if (budget >= price) {
  // Purchase the ticket
  const ticket = await buyTicket(ticketDetails)
}
```

#### React Components (Chat Mode Only)

In Chat Mode, agents can yield React components for rich user interaction:

```typescript
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

### Compilation Pipeline

LLMz uses a sophisticated Babel-based compilation system to transform generated code:

1. **AST Parsing**: TypeScript/JSX code parsed into Abstract Syntax Tree
2. **Plugin Transformation**: Custom plugins modify the AST for execution
3. **Code Generation**: Modified AST compiled back to executable JavaScript
4. **Source Maps**: Generated for debugging and error tracking

Key transformations include:

- Tool call instrumentation for monitoring
- Variable extraction and tracking
- JSX component handling
- Line number preservation for stack traces

### Virtual Machine Execution

LLMz supports multiple execution environments:

- **Production**: Uses `isolated-vm` for security isolation
- **CI/Development**: Falls back to Node.js VM for compatibility
- **Browser**: Uses standard JavaScript execution

The VM provides:

- Memory isolation and limits
- Execution timeouts
- Secure context separation
- Stack trace sanitization

---

## Execution Modes

LLMz operates in two distinct modes depending on whether a chat interface is provided:

### Chat Mode

**Enabled when**: `chat` parameter is provided to `execute()`

Chat Mode is designed for interactive conversational agents that need to:

- Maintain conversation history
- Respond to user messages
- Yield UI components for rich interaction
- Handle turn-taking between agent and user

Key characteristics:

- Agent can yield React components to user
- Special `ListenExit` automatically available
- Transcript management for conversation history
- Turn-based execution flow

```typescript
const result = await execute({
  instructions: 'You are a helpful assistant',
  chat: myChatInstance,
  tools: [searchTool, calculatorTool],
  client,
})

if (result.is(ListenExit)) {
  // Agent is waiting for user input
}
```

### Worker Mode

**Enabled when**: `chat` parameter is omitted from `execute()`

Worker Mode is designed for automated execution environments that need to:

- Process data and perform computations
- Execute multi-step workflows
- Return structured results
- Run without human interaction

Key characteristics:

- Focus on computational tasks and data processing
- Uses `DefaultExit` if no custom exits provided
- Sandboxed execution with security isolation
- Automated completion without user interaction

```typescript
const result = await execute({
  instructions: 'Process the customer data and generate insights',
  tools: [dataProcessorTool, analyticseTool],
  exits: [dataProcessedExit],
  client,
})

if (result.is(dataProcessedExit)) {
  console.log('Analysis complete:', result.output)
}
```

### Mode Comparison

| Feature              | Chat Mode           | Worker Mode     |
| -------------------- | ------------------- | --------------- |
| User Interaction     | ✅ Interactive      | ❌ Automated    |
| UI Components        | ✅ React components | ❌ No UI        |
| Conversation History | ✅ Full transcript  | ❌ No history   |
| Default Exits        | `ListenExit`        | `DefaultExit`   |
| Primary Use Case     | Conversational AI   | Data processing |
| Execution Pattern    | Turn-based          | Continuous      |

---

## Tools

Tools are the primary way to extend LLMz agents with external capabilities. Unlike traditional agent frameworks, LLMz tools are called through generated TypeScript code, enabling complex orchestration and error handling.

### Tool Definition

Tools are defined using Zui schemas for complete type safety:

```typescript
import { Tool } from 'llmz'
import { z } from '@bpinternal/zui'

const weatherTool = new Tool({
  name: 'getWeather',
  description: 'Get current weather for a location',
  input: z.object({
    location: z.string().describe('City name or coordinates'),
    units: z.enum(['celsius', 'fahrenheit']).optional().default('celsius'),
  }),
  output: z.object({
    temperature: z.number(),
    conditions: z.string(),
    humidity: z.number(),
  }),
  handler: async ({ location, units }) => {
    // Implementation here
    return {
      temperature: 22,
      conditions: 'sunny',
      humidity: 65,
    }
  },
})
```

### Tool Usage in Generated Code

The LLM generates TypeScript code that calls tools naturally:

```typescript
// Simple tool call
const weather = await getWeather({ location: 'New York' })

// Complex logic with multiple tools
const weather = await getWeather({ location: userLocation })
if (weather.temperature < 0) {
  const clothing = await getSuggestions({ type: 'winter', temperature: weather.temperature })
  yield <Text>It's {weather.temperature}°C! {clothing.suggestion}</Text>
} else {
  yield <Text>Nice weather! {weather.conditions} at {weather.temperature}°C</Text>
}

return { action: 'listen' }
```

### Advanced Tool Features

#### Tool Aliases

Tools can have multiple names for flexible calling:

```typescript
const tool = new Tool({
  name: 'calculatePrice',
  aliases: ['getPrice', 'checkCost'],
  // ... rest of definition
})

// All of these work in generated code:
// await calculatePrice(params)
// await getPrice(params)
// await checkCost(params)
```

#### Static Inputs

Force specific inputs to be always included:

```typescript
const tool = new Tool({
  name: 'logEvent',
  input: z.object({
    event: z.string(),
    userId: z.string(),
    timestamp: z.number(),
  }),
  staticInputs: {
    userId: 'user-123',
    timestamp: () => Date.now(), // Dynamic static input
  },
  handler: async ({ event, userId, timestamp }) => {
    // userId and timestamp are automatically provided
  },
})
```

#### Tool Wrapping and Cloning

Clone and modify existing tools:

```typescript
const originalTool = new Tool({
  /* definition */
})

const wrappedTool = originalTool.clone({
  name: 'wrappedVersion',
  description: 'Enhanced version with logging',
  handler: async (input) => {
    console.log('Tool called with:', input)
    const result = await originalTool.execute(input)
    console.log('Tool returned:', result)
    return result
  },
})
```

### Tool Type Generation

Use `tool.getTypings()` to see the TypeScript definitions generated for the LLM:

```typescript
console.log(weatherTool.getTypings())
// Output:
// /**
//  * Get current weather for a location
//  */
// declare function getWeather(input: {
//   location: string; // City name or coordinates
//   units?: "celsius" | "fahrenheit";
// }): Promise<{
//   temperature: number;
//   conditions: string;
//   humidity: number;
// }>;
```

### Best Practices

1. **Descriptive Schemas**: Detailed descriptions help LLMs generate better code
2. **Type Safety**: Use strict Zui schemas for predictable behavior
3. **Error Handling**: Tools should handle errors gracefully
4. **Performance**: Keep tool execution fast to avoid timeouts
5. **Documentation**: Clear descriptions improve code generation quality

---

## Objects and Variables

Objects in LLMz provide namespaced containers for related tools and variables, enabling sophisticated state management and data organization.

### Object Definition

Objects group related functionality and provide scoped variables:

```typescript
import { ObjectInstance } from 'llmz'
import { z } from '@bpinternal/zui'

const userObject = new ObjectInstance({
  name: 'user',
  properties: [
    {
      name: 'name',
      value: 'John Doe',
      writable: true,
      type: z.string(),
    },
    {
      name: 'age',
      value: 30,
      writable: false, // Read-only
      type: z.number(),
    },
    {
      name: 'preferences',
      value: { theme: 'dark', language: 'en' },
      writable: true,
      type: z.object({
        theme: z.enum(['light', 'dark']),
        language: z.string(),
      }),
    },
  ],
  tools: [
    new Tool({
      name: 'updateProfile',
      input: z.object({ name: z.string() }),
      handler: async ({ name }) => {
        // This tool is scoped to the user object
        return { success: true }
      },
    }),
  ],
})
```

### Variables in Generated Code

The LLM can read and write object properties in generated code:

```typescript
// Reading variables
const userName = user.name // "John Doe"
const userAge = user.age // 30

// Writing to writable variables
user.name = 'Jane Smith' // ✅ Succeeds
user.preferences = { theme: 'light', language: 'es' } // ✅ Succeeds

// Attempting to write read-only variables
user.age = 25 // ❌ Throws AssignmentError
```

### Type Safety and Validation

Variables are validated against their schemas:

```typescript
// Valid assignment
user.preferences = { theme: 'dark', language: 'fr' } // ✅

// Invalid assignment - wrong type
user.preferences = { theme: 'blue', language: 'fr' } // ❌ Throws validation error

// Invalid assignment - missing required fields
user.preferences = { theme: 'dark' } // ❌ Missing language field
```

### Mutation Tracking

LLMz automatically tracks changes to object properties:

```typescript
// In generated code
user.name = 'Updated Name'
user.preferences.theme = 'light'

// After execution, mutations are available
console.log(result.iteration.mutations)
// [
//   {
//     object: 'user',
//     property: 'name',
//     before: 'John Doe',
//     after: 'Updated Name'
//   },
//   {
//     object: 'user',
//     property: 'preferences',
//     before: { theme: 'dark', language: 'en' },
//     after: { theme: 'light', language: 'en' }
//   }
// ]
```

### Namespaced Tools

Tools within objects are called with object namespace:

```typescript
// Tool is scoped to the user object
await user.updateProfile({ name: 'New Name' })

// This automatically updates the user object's properties
// and is tracked as a mutation
```

### Object Sealing and Protection

Objects are automatically sealed to prevent unauthorized modifications:

```typescript
// In generated code - these will throw errors
user.newProperty = 'value' // ❌ Cannot add new properties
delete user.name // ❌ Cannot delete properties

// Only predefined properties can be modified (if writable)
user.name = 'New Name' // ✅ Allowed if writable: true
```

### Variable Persistence

Variables persist across iterations and thinking cycles:

```typescript
// Iteration 1: Set a variable
user.preferences = { theme: 'dark', language: 'es' }
return { action: 'think' } // Trigger thinking

// Iteration 2: Variable is still available
const currentTheme = user.preferences.theme // 'dark'
```

### Best Practices

1. **Meaningful Names**: Use descriptive object and property names
2. **Appropriate Scope**: Group related functionality together
3. **Write Protection**: Mark properties as read-only when appropriate
4. **Type Safety**: Use strict schemas for predictable behavior
5. **Mutation Tracking**: Leverage mutation tracking for audit trails

---

## Execution Results

Every call to `execute()` returns an `ExecutionResult` that provides type-safe access to the execution outcome. LLMz execution can result in three different types of results.

### Result Types

#### SuccessExecutionResult

Agent completed successfully with an Exit. Contains the structured data produced by the agent.

```typescript
const result = await execute({
  instructions: 'Calculate the sum',
  client,
})

if (result.isSuccess()) {
  console.log('Output:', result.output)
  console.log('Exit used:', result.exit.name)
  console.log('Generated code:', result.iteration.code)
}
```

#### ErrorExecutionResult

Execution failed with an unrecoverable error:

```typescript
if (result.isError()) {
  console.error('Error:', result.error)
  console.error('Failed iteration:', result.iteration?.error)

  // Analyze failure progression
  result.iterations.forEach((iter, i) => {
    console.log(`Iteration ${i + 1}: ${iter.status.type}`)
  })
}
```

#### PartialExecutionResult

Execution was interrupted by a SnapshotSignal for pauseable operations:

```typescript
if (result.isInterrupted()) {
  console.log('Interrupted:', result.signal.message)

  // Save snapshot for later resumption
  const serialized = result.snapshot.toJSON()
  await database.saveSnapshot(serialized)
}
```

### Type-Safe Exit Checking

Use `result.is(exit)` for type-safe access to specific exit data:

```typescript
const successExit = new Exit({
  name: 'success',
  schema: z.object({
    recordsProcessed: z.number(),
    processingTime: z.number(),
  }),
})

const errorExit = new Exit({
  name: 'error',
  schema: z.object({
    errorCode: z.string(),
    details: z.string(),
  }),
})

const result = await execute({
  instructions: 'Process the data',
  exits: [successExit, errorExit],
  client,
})

// Type-safe exit handling with automatic output typing
if (result.is(successExit)) {
  // TypeScript knows result.output has the success schema
  console.log(`Processed ${result.output.recordsProcessed} records`)
  console.log(`Processing took ${result.output.processingTime}ms`)
} else if (result.is(errorExit)) {
  // TypeScript knows result.output has the error schema
  console.error(`Error ${result.output.errorCode}: ${result.output.details}`)
}
```

### Built-in Exits

```typescript
import { ListenExit, DefaultExit, ThinkExit } from 'llmz'

// Check for built-in exits
if (result.is(ListenExit)) {
  console.log('Agent is waiting for user input')
}

if (result.is(DefaultExit)) {
  // DefaultExit has success/failure discriminated union
  if (result.output.success) {
    console.log('Completed successfully:', result.output.result)
  } else {
    console.error('Completed with error:', result.output.error)
  }
}

if (result.is(ThinkExit)) {
  console.log('Agent requested thinking time')
  console.log('Current variables:', result.output.variables)
}
```

### Accessing Execution Details

#### Iterations and Execution Flow

```typescript
// Access the final iteration
const lastIteration = result.iteration
if (lastIteration) {
  console.log('Generated code:', lastIteration.code)
  console.log('Status:', lastIteration.status.type)
  console.log('Duration:', lastIteration.duration)
}

// Access all iterations to see full execution flow
result.iterations.forEach((iteration, index) => {
  console.log(`Iteration ${index + 1}:`)
  console.log('  Status:', iteration.status.type)
  console.log('  Code length:', iteration.code?.length || 0)
  console.log('  Variables:', Object.keys(iteration.variables).length)
})
```

#### Variables and Declarations

```typescript
// If agent generates: const hello = '1234'
const lastIteration = result.iteration
if (lastIteration) {
  console.log(lastIteration.variables.hello) // '1234'

  // Access all variables from the final iteration
  Object.entries(lastIteration.variables).forEach(([name, value]) => {
    console.log(`Variable ${name}:`, value)
  })
}
```

#### Tool Calls and Traces

```typescript
// Access tool calls from all iterations
const allToolCalls = result.iterations.flatMap((iter) => iter.traces.filter((trace) => trace.type === 'tool_call'))

console.log('Total tool calls:', allToolCalls.length)

// Access other trace types
const lastIteration = result.iteration
if (lastIteration) {
  const yields = lastIteration.traces.filter((trace) => trace.type === 'yield')
  const comments = lastIteration.traces.filter((trace) => trace.type === 'comment')
  const propertyAccess = lastIteration.traces.filter((trace) => trace.type === 'property')
}
```

#### Context and Metadata

```typescript
if (result.isSuccess()) {
  // Access original execution parameters
  console.log('Instructions:', result.context.instructions)
  console.log('Loop limit:', result.context.loop)
  console.log('Temperature:', result.context.temperature)
  console.log('Model:', result.context.model)

  // Access tools and exits that were available
  console.log(
    'Available tools:',
    result.context.tools?.map((t) => t.name)
  )
  console.log(
    'Available exits:',
    result.context.exits?.map((e) => e.name)
  )
}
```

### Error Analysis

```typescript
if (result.isError()) {
  console.error('Execution failed:', result.error)

  // Analyze the failure progression
  const failedIteration = result.iteration
  if (failedIteration) {
    switch (failedIteration.status.type) {
      case 'execution_error':
        console.error('Code execution failed:', failedIteration.status.execution_error.message)
        console.error('Stack trace:', failedIteration.status.execution_error.stack)
        console.error('Failed code:', failedIteration.code)
        break

      case 'generation_error':
        console.error('LLM generation failed:', failedIteration.status.generation_error.message)
        break

      case 'invalid_code_error':
        console.error('Invalid code generated:', failedIteration.status.invalid_code_error.message)
        console.error('Invalid code:', failedIteration.code)
        break

      case 'aborted':
        console.error('Execution aborted:', failedIteration.status.aborted.reason)
        break
    }
  }

  // Review all iterations to understand failure progression
  console.log('Iterations before failure:', result.iterations.length)
  result.iterations.forEach((iter, i) => {
    console.log(`Iteration ${i + 1}: ${iter.status.type}`)
  })
}
```

### Snapshot Handling

Handle interrupted executions with snapshot resumption:

```typescript
const result = await execute({
  instructions: 'Process large dataset with pauseable operation',
  tools: [snapshotCapableTool],
  client,
})

if (result.isInterrupted()) {
  console.log('Execution paused:', result.signal.message)

  // Serialize snapshot for persistence
  const serialized = result.snapshot.toJSON()
  await database.saveSnapshot('execution-123', serialized)

  // Later, resume from snapshot
  const snapshot = Snapshot.fromJSON(serialized)
  snapshot.resolve({ resumeData: 'Operation completed' })

  const continuation = await execute({
    snapshot,
    instructions: result.context.instructions,
    tools: result.context.tools,
    exits: result.context.exits,
    client,
  })

  if (continuation.isSuccess()) {
    console.log('Resumed execution completed:', continuation.output)
  }
}
```

---

## Hooks System

LLMz provides a comprehensive hook system that allows you to inject custom logic at various points during execution. Hooks are categorized as either blocking (execution waits) or non-blocking, and either mutation (can modify data) or non-mutation.

### Hook Types Overview

| Hook                | Blocking | Mutation | Called When                |
| ------------------- | -------- | -------- | -------------------------- |
| `onTrace`           | ❌       | ❌       | Each trace generated       |
| `onIterationEnd`    | ✅       | ❌       | After iteration completion |
| `onExit`            | ✅       | ❌       | When exit is reached       |
| `onBeforeExecution` | ✅       | ✅       | Before code execution      |
| `onBeforeTool`      | ✅       | ✅       | Before tool execution      |
| `onAfterTool`       | ✅       | ✅       | After tool execution       |

### onTrace (Non-blocking, Non-mutation)

Called for each trace generated during iteration. Useful for logging, debugging, or monitoring execution progress.

```typescript
await execute({
  onTrace: ({ trace, iteration }) => {
    console.log(`Iteration ${iteration}: ${trace.type}`, trace)

    // Log specific trace types
    if (trace.type === 'tool_call') {
      console.log(`Tool ${trace.tool_name} called with:`, trace.input)
    }
  },
  // ... other props
})
```

**Available Trace Types:**

- `abort_signal`: Abort signal received
- `comment`: Comment found in generated code
- `llm_call_success`: LLM generation completed successfully
- `property`: Object property accessed or modified
- `think_signal`: ThinkSignal thrown
- `tool_call`: Tool executed
- `yield`: Component yielded in chat mode
- `log`: General logging event

### onIterationEnd (Blocking, Non-mutation)

Called after each iteration ends, regardless of status. Useful for logging, cleanup, or controlling iteration timing.

```typescript
await execute({
  onIterationEnd: async (iteration, controller) => {
    console.log(`Iteration ${iteration.id} ended with status: ${iteration.status.type}`)

    // Add delays, cleanup, or conditional logic
    if (iteration.status.type === 'execution_error') {
      await logError(iteration.error)

      // Add delay before retry
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Can use controller to abort execution if needed
    if (shouldAbort(iteration)) {
      controller.abort('Custom abort reason')
    }
  },
  // ... other props
})
```

### onExit (Blocking, Non-mutation)

Called when an exit is reached. Useful for logging, notifications, or implementing guardrails by throwing errors to prevent exit.

```typescript
await execute({
  onExit: async (result) => {
    console.log(`Exiting with: ${result.exit.name}`, result.result)

    // Implement guardrails
    if (result.exit.name === 'approve_loan' && result.result.amount > 10000) {
      throw new Error('Manager approval required for loans over $10,000')
    }

    // Send notifications
    await notifyStakeholders(result)

    // Log to audit trail
    await auditLog.record({
      action: result.exit.name,
      data: result.result,
      timestamp: Date.now(),
    })
  },
  // ... other props
})
```

### onBeforeExecution (Blocking, Mutation)

Called after LLM generates code but before execution. Allows code modification and guardrails implementation.

```typescript
await execute({
  onBeforeExecution: async (iteration, controller) => {
    console.log('Generated code:', iteration.code)

    // Code modification
    if (iteration.code?.includes('dangerousOperation')) {
      return {
        code: iteration.code.replace('dangerousOperation', 'safeOperation'),
      }
    }

    // Guardrails - throw to prevent execution
    if (iteration.code?.includes('forbidden')) {
      throw new Error('Forbidden operation detected')
    }

    // Add security checks
    const securityIssues = await scanCodeForSecurity(iteration.code)
    if (securityIssues.length > 0) {
      throw new Error(`Security issues found: ${securityIssues.join(', ')}`)
    }

    // Log code generation for audit
    await auditCodeGeneration(iteration.code)
  },
  // ... other props
})
```

### onBeforeTool (Blocking, Mutation)

Called before any tool execution. Allows input modification and tool execution control.

```typescript
await execute({
  onBeforeTool: async ({ iteration, tool, input, controller }) => {
    console.log(`Executing tool: ${tool.name}`, input)

    // Input modification
    if (tool.name === 'sendEmail') {
      return {
        input: {
          ...input,
          subject: `[Automated] ${input.subject}`, // Add prefix
          from: 'noreply@company.com', // Override sender
        },
      }
    }

    // Access control
    if (tool.name === 'deleteFile' && !hasPermission(input.path)) {
      throw new Error('Insufficient permissions to delete file')
    }

    // Rate limiting
    const rateLimit = await checkRateLimit(tool.name)
    if (rateLimit.exceeded) {
      throw new Error(`Rate limit exceeded for ${tool.name}`)
    }

    // Validation
    await validateToolUsage(tool, input)
  },
  // ... other props
})
```

### onAfterTool (Blocking, Mutation)

Called after tool execution. Allows output modification and post-processing.

```typescript
await execute({
  onAfterTool: async ({ iteration, tool, input, output, controller }) => {
    console.log(`Tool ${tool.name} completed`, { input, output })

    // Output modification
    if (tool.name === 'fetchUserData') {
      return {
        output: {
          ...output,
          // Remove sensitive data before LLM sees it
          ssn: undefined,
          creditCard: undefined,
          // Add metadata
          fetchedAt: Date.now(),
        },
      }
    }

    // Result enhancement
    if (tool.name === 'calculatePrice') {
      return {
        output: {
          ...output,
          currency: 'USD',
          timestamp: Date.now(),
          exchangeRate: await getCurrentExchangeRate(),
        },
      }
    }

    // Logging and caching
    await Promise.all([
      cacheResult(tool.name, input, output),
      logToolExecution(tool.name, input, output),
      updateMetrics(tool.name, Date.now() - tool.startTime),
    ])
  },
  // ... other props
})
```

### Hook Execution Order

For each iteration:

1. **onTrace**: Throughout execution (non-blocking)
2. **onBeforeExecution**: After code generation, before execution
3. **onBeforeTool**: Before each tool call
4. **onAfterTool**: After each tool call
5. **onExit**: When exit is reached
6. **onIterationEnd**: After iteration completes

### Advanced Hook Patterns

#### Conditional Hook Logic

```typescript
await execute({
  onBeforeTool: async ({ tool, input }) => {
    // Apply different logic based on tool
    switch (tool.name) {
      case 'payment':
        return await handlePaymentValidation(input)
      case 'notification':
        return await handleNotificationThrottling(input)
      default:
        return // No modification
    }
  },
})
```

#### Error Recovery in Hooks

```typescript
await execute({
  onExit: async (result) => {
    try {
      await criticalPostProcessing(result)
    } catch (error) {
      // Log error but don't fail the entire execution
      console.error('Post-processing failed:', error)

      // Optionally throw to retry the iteration
      if (error.retryable) {
        throw new Error('Retrying due to recoverable error')
      }
    }
  },
})
```

#### Hook State Management

```typescript
let executionMetrics = { toolCalls: 0, totalTime: 0 }

await execute({
  onBeforeTool: async ({ tool }) => {
    executionMetrics.toolCalls++
    tool.startTime = Date.now()
  },

  onAfterTool: async ({ tool }) => {
    executionMetrics.totalTime += Date.now() - tool.startTime
  },

  onIterationEnd: async () => {
    console.log('Execution metrics:', executionMetrics)
  },
})
```

### Best Practices

1. **Error Handling**: Always wrap hook logic in try-catch for production
2. **Performance**: Keep hooks lightweight, especially `onTrace`
3. **Security**: Use `onBeforeExecution` and `onBeforeTool` for security validation
4. **Debugging**: Leverage `onTrace` for comprehensive execution monitoring
5. **Guardrails**: Implement business logic validation in `onExit`
6. **Data Transformation**: Use `onBeforeTool`/`onAfterTool` for input/output processing
7. **Async Operations**: All hooks support async/await for external API calls
8. **State Management**: Use closures or external state for cross-hook data sharing

---

## Advanced Features

### Snapshots (Pauseable Execution)

Snapshots allow you to pause and resume LLMz execution, enabling long-running workflows that can be interrupted and continued later.

#### SnapshotSignal

Inside a tool, throw a `SnapshotSignal` to halt execution and create a serializable snapshot:

```typescript
import { SnapshotSignal, Tool } from 'llmz'

const longRunningTool = new Tool({
  name: 'processLargeDataset',
  input: z.object({ datasetId: z.string() }),
  async handler({ datasetId }) {
    // Start processing
    const dataset = await loadDataset(datasetId)

    // At any point, pause execution for later resumption
    if (dataset.size > LARGE_THRESHOLD) {
      throw new SnapshotSignal(
        'Dataset is large, pausing for background processing',
        'Processing will continue once background job completes'
      )
    }

    return { processed: true }
  },
})
```

#### Snapshot Handling

```typescript
const result = await execute({
  instructions: 'Process the uploaded dataset',
  tools: [longRunningTool],
  client,
})

if (result.isInterrupted()) {
  console.log('Execution paused:', result.signal.message)

  // Serialize snapshot for persistence
  const serialized = result.snapshot.toJSON()
  await database.saveSnapshot('job-123', serialized)

  // Start background processing
  await backgroundJobQueue.add('process-dataset', {
    snapshotId: 'job-123',
    datasetId: result.signal.toolCall?.input.datasetId,
  })
}
```

#### Resuming from Snapshot

```typescript
// Later, when background job completes
const serialized = await database.getSnapshot('job-123')
const snapshot = Snapshot.fromJSON(serialized)

// Resolve the snapshot with the result
snapshot.resolve({
  processed: true,
  recordCount: 1000000,
  processingTime: 3600000,
})

// Continue execution from where it left off
const continuation = await execute({
  snapshot,
  instructions: 'Process the uploaded dataset', // Same as original
  tools: [longRunningTool], // Same tools
  client,
})

if (continuation.isSuccess()) {
  console.log('Processing completed:', continuation.output)
}
```

#### Snapshot Rejection

```typescript
// If background processing fails
const snapshot = Snapshot.fromJSON(serialized)
snapshot.reject(new Error('Background processing failed'))

const continuation = await execute({
  snapshot,
  // ... same parameters
})

// The agent will receive the error and can handle it
```

### Thinking (Agent Reflection)

The thinking system allows agents to pause and reflect on variables and context before proceeding.

#### ThinkSignal (Tool-Initiated)

Tools can force thinking by throwing a `ThinkSignal`:

```typescript
const analysisTool = new Tool({
  name: 'analyzeData',
  input: z.object({ data: z.array(z.number()) }),
  async handler({ data }) {
    const result = performAnalysis(data)

    // Force the agent to think about the results before responding
    throw new ThinkSignal(
      'Analysis complete, consider the implications',
      `Found ${result.anomalies.length} anomalies and ${result.patterns.length} patterns`
    )
  },
})
```

#### Agent-Initiated Thinking

Agents can request thinking time in generated code:

```typescript
// In generated code
const analysisResult = await analyzeData({ data: userInputData })

// Think about the results before responding to user
return { action: 'think' }
```

#### Thinking with Variables

Pass specific variables for reflection:

```typescript
// In generated code
const price = await calculatePrice({ items: cartItems })
const budget = await getUserBudget()

// Think about pricing vs budget with specific context
return {
  action: 'think',
  price,
  budget,
  recommendation: price > budget ? 'deny' : 'approve',
}
```

#### Handling Think Results

```typescript
const result = await execute({
  instructions: 'Analyze the user data and provide recommendations',
  tools: [analysisTool],
  client,
})

if (result.is(ThinkExit)) {
  console.log('Agent is thinking about:', result.output.variables)

  // Continue execution after thinking
  const continuation = await execute({
    instructions: result.context.instructions,
    tools: result.context.tools,
    // Variables from thinking are automatically preserved
    client,
  })
}
```

### Citations (RAG Support)

CitationsManager provides standardized source tracking and referencing for RAG (Retrieval-Augmented Generation) systems.

#### Core Concepts

Citations use rare Unicode symbols (`【】`) as markers that are unlikely to appear in natural text. The system supports:

- **Source Registration**: Register any object as a citation source
- **Tag Generation**: Automatic creation of unique citation tags like `【0】`, `【1】`
- **Content Processing**: Extract and clean citation tags from text
- **Multiple Citations**: Support for multi-source citations like `【0,1,3】`

#### Basic Usage

```typescript
import { CitationsManager } from 'llmz'

const citations = new CitationsManager()

// Register sources and get citation tags
const source1 = citations.registerSource({
  file: 'document.pdf',
  page: 5,
  title: 'Company Policy',
})

const source2 = citations.registerSource({
  url: 'https://example.com/article',
  title: 'Best Practices',
})

console.log(source1.tag) // "【0】"
console.log(source2.tag) // "【1】"

// Use tags in content
const content = `The policy states employees must arrive on time${source1.tag}. However, best practices suggest flexibility${source2.tag}.`
```

#### RAG Implementation Example

```typescript
const ragTool = new Tool({
  name: 'search',
  description: 'Searches in the knowledge base for relevant information.',
  input: z.string().describe('The query to search in the knowledge base.'),
  async handler(query) {
    // Perform semantic search
    const { passages } = await client.searchFiles({
      query,
      limit: 20,
      contextDepth: 3,
    })

    if (!passages.length) {
      throw new ThinkSignal(
        'No results found',
        'No results were found in the knowledge base. Try rephrasing your question.'
      )
    }

    // Build response with citations
    let message: string[] = ['Here are the search results:']
    let { tag: example } = chat.citations.registerSource({}) // Example citation

    // Register each passage as a source
    for (const passage of passages) {
      const { tag } = chat.citations.registerSource({
        file: passage.file.key,
        title: passage.file.tags.title,
      })

      message.push(`<${tag} file="${passage.file.key}">`)
      message.push(`**${passage.file.tags.title}**`)
      message.push(passage.content)
      message.push(`</${tag}>`)
    }

    // Provide context with citation instructions
    throw new ThinkSignal(
      `Got search results. When answering, you MUST add inline citations (eg: "The price is $10${example} ...")`,
      message.join('\n').trim()
    )
  },
})
```

#### Chat Integration

```typescript
class CLIChat extends Chat {
  public citations: CitationsManager = new CitationsManager()

  private async sendMessage(input: RenderedComponent) {
    if (input.type === 'Text') {
      let sources: string[] = []

      // Extract citations and format them for display
      const { cleaned } = this.citations.extractCitations(input.text, (citation) => {
        let idx = chalk.bgGreenBright.black.bold(` ${sources.length + 1} `)
        sources.push(`${idx}: ${JSON.stringify(citation.source)}`)
        return `${idx}` // Replace 【0】 with [1]
      })

      // Display cleaned text and sources
      console.log(`🤖 Agent: ${cleaned}`)

      if (sources.length) {
        console.log(chalk.dim('Citations'))
        console.log(chalk.dim('========='))
        console.log(chalk.dim(sources.join('\n')))
      }
    }
  }
}
```

#### Advanced Citation Features

**Multiple Citation Support:**

```typescript
// Agent can reference multiple sources in one citation
const content = 'This fact is supported by multiple studies【0,1,3】'

const { cleaned, citations } = manager.extractCitations(content)
// citations array contains entries for sources 0, 1, and 3
```

**Object Citation Processing:**

```typescript
// Remove citations from complex objects
const dataWithCitations = {
  summary: 'The report shows positive trends【0】',
  details: {
    revenue: 'Increased by 15%【1】',
    costs: 'Reduced by 8%【2】',
  },
}

const [cleanData, extractedCitations] = manager.removeCitationsFromObject(dataWithCitations)
// cleanData has citations removed, extractedCitations contains path + citation info
```

**Citation Stripping:**

```typescript
// Remove all citation tags from content
const textWithCitations = 'This statement【0】 has multiple【1,2】 citations.'
const cleaned = CitationsManager.stripCitationTags(textWithCitations)
// Result: "This statement has multiple citations."
```

### Dynamic Context

LLMz supports dynamic evaluation of most parameters, allowing context-aware configuration:

```typescript
await execute({
  // Dynamic instructions based on context
  instructions: (ctx) => {
    const timeOfDay = new Date().getHours()
    const greeting = timeOfDay < 12 ? 'Good morning' : 'Good afternoon'
    return `${greeting}! You are a helpful assistant with access to ${ctx.tools?.length || 0} tools.`
  },

  // Dynamic tools based on user permissions
  tools: async (ctx) => {
    const userPermissions = await getUserPermissions(ctx.userId)
    return allTools.filter((tool) => userPermissions.includes(tool.permission))
  },

  // Dynamic objects with current state
  objects: async (ctx) => {
    const userPreferences = await loadUserPreferences(ctx.userId)
    return [
      new ObjectInstance({
        name: 'user',
        properties: [{ name: 'preferences', value: userPreferences, writable: true }],
      }),
    ]
  },

  client,
})
```

---

## API Reference

### Core Functions

#### execute(props: ExecutionProps): Promise<ExecutionResult>

Main execution function that runs LLMz agents in either Chat Mode or Worker Mode.

**Parameters:**

- `props.client` - Botpress Client or Cognitive Client instance for LLM generation
- `props.instructions` - System prompt/instructions for the LLM (static string or dynamic function)
- `props.chat` - Optional Chat instance to enable Chat Mode with user interaction
- `props.tools` - Array of Tool instances available to the agent (static or dynamic)
- `props.objects` - Array of ObjectInstance for namespaced tools and variables (static or dynamic)
- `props.exits` - Array of Exit definitions for structured completion (static or dynamic)
- `props.snapshot` - Optional Snapshot to resume paused execution
- `props.signal` - Optional AbortSignal to cancel execution
- `props.options` - Optional execution options (loop limit, temperature, model, timeout)
- `props.onTrace` - Optional non-blocking hook for monitoring traces during execution
- `props.onIterationEnd` - Optional blocking hook called after each iteration
- `props.onExit` - Optional blocking hook called when an exit is reached
- `props.onBeforeExecution` - Optional blocking hook to modify code before VM execution
- `props.onBeforeTool` - Optional blocking hook to modify tool inputs before execution
- `props.onAfterTool` - Optional blocking hook to modify tool outputs after execution

**Returns:** `Promise<ExecutionResult>` - Result containing success/error/interrupted status with type-safe exit checking

### Tool Class

#### new Tool(config: ToolConfig)

Creates a new tool definition with type-safe schemas.

**Properties:**

- `name: string` - Tool name used in generated code
- `description?: string` - Description for LLM understanding
- `input?: ZuiSchema` - Input validation schema
- `output?: ZuiSchema` - Output validation schema
- `handler: (input: any) => Promise<any> | any` - Tool implementation
- `aliases?: string[]` - Alternative names for the tool
- `staticInputs?: Record<string, any>` - Force specific input values

**Methods:**

- `execute(input: any, context?: ToolContext): Promise<any>` - Execute the tool
- `getTypings(): string` - Get TypeScript definitions for LLM
- `clone(overrides: Partial<ToolConfig>): Tool` - Create a modified copy

### Exit Class

#### new Exit(config: ExitConfig)

Defines a structured exit point for agent execution.

**Properties:**

- `name: string` - Exit name used in generated code
- `description?: string` - Description for LLM understanding
- `schema?: ZuiSchema` - Output validation schema
- `aliases?: string[]` - Alternative names for the exit

### ObjectInstance Class

#### new ObjectInstance(config: ObjectConfig)

Creates a namespaced container for tools and variables.

**Properties:**

- `name: string` - Object name used in generated code
- `properties?: PropertyConfig[]` - Object properties/variables
- `tools?: Tool[]` - Tools scoped to this object

**PropertyConfig:**

- `name: string` - Property name
- `value: any` - Initial value
- `writable: boolean` - Whether property can be modified
- `type?: ZuiSchema` - Validation schema

### ExecutionResult Types

#### SuccessExecutionResult

**Properties:**

- `isSuccess(): boolean` - Type guard for success
- `output: any` - The result data from the exit
- `exit: Exit` - The exit that was used
- `iteration: Iteration` - Final iteration details
- `iterations: Iteration[]` - All iterations
- `context: Context` - Execution context
- `is(exit: Exit): boolean` - Type-safe exit checking

#### ErrorExecutionResult

**Properties:**

- `isError(): boolean` - Type guard for error
- `error: Error | string` - The error that occurred
- `iteration?: Iteration` - Failed iteration details
- `iterations: Iteration[]` - All iterations before failure
- `context: Context` - Execution context

#### PartialExecutionResult

**Properties:**

- `isInterrupted(): boolean` - Type guard for interruption
- `signal: SnapshotSignal` - The signal that caused interruption
- `snapshot: Snapshot` - Serializable execution state
- `iterations: Iteration[]` - All iterations before interruption
- `context: Context` - Execution context

### Chat Class

Abstract base class for implementing chat interfaces.

**Abstract Methods:**

- `getTranscript(): Promise<Transcript.Message[]> | Transcript.Message[]` - Get conversation history
- `getComponents(): Promise<ComponentDefinition[]> | ComponentDefinition[]` - Get available UI components
- `handler(component: RenderedComponent): Promise<void>` - Handle agent messages

### CitationsManager Class

Manages source citations for RAG systems.

**Methods:**

- `registerSource(source: any): { tag: string, id: number }` - Register a source and get citation tag
- `extractCitations(text: string, replacer?: (citation) => string): { cleaned: string, citations: Citation[] }` - Extract and process citations
- `removeCitationsFromObject(obj: any): [cleanedObj: any, citations: Citation[]]` - Remove citations from objects
- `static stripCitationTags(text: string): string` - Remove all citation tags

### Snapshot Class

Manages pauseable execution state.

**Methods:**

- `toJSON(): string` - Serialize snapshot
- `static fromJSON(json: string): Snapshot` - Deserialize snapshot
- `resolve(data: any): void` - Resume with success
- `reject(error: Error): void` - Resume with error

### Built-in Exits

- `ListenExit` - Automatically available in Chat Mode for user interaction
- `DefaultExit` - Default exit for Worker Mode with success/failure discrimination
- `ThinkExit` - Used when agent requests thinking time

### Signals

- `SnapshotSignal` - Thrown to pause execution for later resumption
- `ThinkSignal` - Thrown to request agent reflection time
- `LoopExceededError` - Thrown when maximum iterations reached

### Environment Variables

- `VM_DRIVER: 'isolated-vm' | 'node'` - Choose VM execution environment
- `CI: boolean` - Automatically detected, affects VM driver selection

---

## Examples

The LLMz repository includes 20 comprehensive examples demonstrating different patterns and capabilities:

### Chat Examples (Interactive Patterns)

1. **01_chat_basic** - Basic conversational agent setup
2. **02_chat_exits** - Custom exits for structured conversations
3. **03_chat_conditional_tool** - Conditional tool usage based on context
4. **04_chat_small_models** - Optimizations for smaller language models
5. **05_chat_web_search** - Integration with web search capabilities
6. **06_chat_confirm_tool** - User confirmation patterns for sensitive operations
7. **07_chat_guardrails** - Safety mechanisms and content filtering
8. **08_chat_multi_agent** - Multi-agent orchestration and delegation
9. **09_chat_variables** - Object variables and state management
10. **10_chat_components** - Rich UI components and interactive elements

### Worker Examples (Automated Patterns)

11. **11_worker_minimal** - Simplest worker mode execution
12. **12_worker_fs** - File system operations and data processing
13. **13_worker_sandbox** - Security isolation and sandboxing
14. **14_worker_snapshot** - Pauseable execution and resumption
15. **15_worker_stacktraces** - Error handling and debugging
16. **16_worker_tool_chaining** - Complex multi-tool workflows
17. **17_worker_error_recovery** - Graceful error recovery patterns
18. **18_worker_security** - Security best practices and validation
19. **19_worker_wrap_tool** - Tool modification and enhancement
20. **20_chat_rag** - Retrieval-Augmented Generation with citations

### Running Examples

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Botpress credentials

# Run a specific example
pnpm start 01_chat_basic
pnpm start chat_basic
pnpm start 01

# List all available examples
pnpm start
```

### Example Environment Setup

Create a `.env` file in the examples directory:

```env
BOTPRESS_BOT_ID=your_bot_id_here
BOTPRESS_TOKEN=your_token_here
```

### Key Learning Paths

**Getting Started:**

- Start with `01_chat_basic` and `11_worker_minimal`
- Understand the difference between Chat and Worker modes
- Learn basic tool integration patterns

**Intermediate Concepts:**

- Explore `09_chat_variables` for state management
- Study `16_worker_tool_chaining` for complex workflows
- Review `14_worker_snapshot` for pauseable execution

**Advanced Patterns:**

- Examine `08_chat_multi_agent` for orchestration
- Learn from `20_chat_rag` for knowledge integration
- Study `18_worker_security` for production deployment

Each example includes detailed comments explaining the concepts and implementation patterns, making them excellent learning resources for understanding LLMz capabilities.

---

_This documentation covers the complete LLMz framework. For the latest updates and community contributions, visit the [LLMz repository](https://github.com/botpress/llmz)._
