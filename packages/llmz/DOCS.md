# LLMz Complete Documentation

_The comprehensive guide to building production-ready AI agents with TypeScript code generation._

---

## Table of Contents

1. [How LLMz Works](#how-llmz-works)
2. [Execution Loop](#execution-loop)
3. [Code Generation](#code-generation)
4. [Execution Modes](#execution-modes)
5. [Execute Configuration](#execute-configuration)
6. [Hooks & Lifecycle](#hooks--lifecycle)
7. [Execution Results](#execution-results)
8. [Tools](#tools)
9. [Objects & Variables](#objects--variables)
10. [Snapshots](#snapshots)
11. [Thinking & Iteration](#thinking--iteration)
12. [Citations](#citations)

---

## How LLMz Works

Like many other agent frameworks, LLMz is an agentic framework that calls LLM models in a loop to achieve a desired outcome, with optional access to tools and memory.

**Unlike other agent frameworks, LLMz is code-first** – meaning it generates and runs TypeScript code in a sandbox to communicate and execute tools rather than using rudimentary JSON tool calling and text responses. This is what makes agents built on LLMz more reliable and capable than other agents.

### Why Code Generation Works Better

Models have been trained extensively on millions of TypeScript codebases from GitHub, Stack Overflow, and documentation. They understand:

- Variable declarations and function calls
- Conditional logic and loops
- Async/await patterns
- Type safety and interfaces
- Error handling and control flow

This deep knowledge makes LLMs incredibly reliable at generating working TypeScript code — far more reliable than generating abstract JSON tool calls that they have limited training on.

### Architecture Overview

```typescript
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Instructions  │ ── │   LLM Provider   │ ── │  TypeScript VM  │
│   Tools & Exits │    │ (Code Generation)│    │  (Execution)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Generated Code  │    │   Tool Calls    │
                       │  with Logic &    │    │   Variables     │
                       │  Control Flow    │    │   Components    │
                       └──────────────────┘    └─────────────────┘
```

---

## Execution Loop

At its core, LLMz exposes a single method (`execute`) that runs in a loop until one of the following conditions are met:

- **An `Exit` is returned** - The agent completes with a structured result
- **The agent waits for user input** (in Chat Mode) - Returns control to user
- **Maximum iterations reached** - Safety limit to prevent infinite loops

### Loop Behavior

The loop iterates by:

1. **Calling the LLM** to generate TypeScript code
2. **Executing the code** in a secure VM
3. **Processing tool calls** and variable assignments
4. **Handling errors** and recovery automatically
5. **Thinking about outputs** when requested
6. **Repeating** until an exit condition is met

### Iteration Context

Each iteration maintains context including:

- **Previous iterations** and their outcomes
- **Variable state** from executed code
- **Tool call history** and results
- **Error history** for recovery
- **Conversation transcript** (in Chat Mode)

---

## Code Generation

Unlike traditional tool-calling agents, LLMz defines tools using TypeScript and runs real code in a secure VM. This means LLMz does not require or rely on tool-calling, JSON output, or any other LLM feature besides text generation.

### Structure of Generated Code

Every LLMz code block has a predictable structure that the LLM learns to generate reliably.

#### Return Statement (Required)

At minimum, every LLMz response **must** contain a return statement with an action:

```typescript
// Chat mode: Give control back to user
return { action: 'listen' }

// Worker mode: Exit with structured data
return { action: 'done', result: 666 }

// Thinking: Iterate and reflect on variables
return { action: 'think', weather }
```

#### Tool Calls with Logic

Because LLMz generates standard TypeScript code, the VM has direct access to tools passed to `execute()`. This enables powerful combinations impossible with JSON tool calling:

```typescript
// Complex conditional logic with multiple tools
const weather = await getCurrentWeather({ city: 'San Francisco' })
const price = await getFlightPrice({ from: 'SFO', to: 'NYC', date: '2024-01-15' })

if (weather.condition === 'stormy' && price > 500) {
  // Cancel expensive flight due to weather
  yield <Text>❌ Flight cancelled due to storms and high cost (${price})</Text>

  // Book alternative transportation
  const train = await bookTrain({ from: 'SFO', to: 'NYC', date: '2024-01-16' })

  return {
    action: 'booked',
    method: 'train',
    savings: price - train.cost
  }
} else {
  // Proceed with flight
  const ticket = await bookFlight({ from: 'SFO', to: 'NYC', price, date: '2024-01-15' })

  return {
    action: 'booked',
    method: 'flight',
    ticketId: ticket.id
  }
}
```

#### Comments for Planning

Comments help the LLM think step-by-step and plan ahead:

```typescript
// First, check current inventory levels
const inventory = await checkInventory({ productId: 'widget-pro' })

// If low stock, reorder before processing customer orders
if (inventory.quantity < 10) {
  await reorderProduct({ productId: 'widget-pro', quantity: 100 })
}

// Now process the customer's bulk order
const order = await createOrder({
  productId: 'widget-pro',
  quantity: customerRequest.quantity,
})

return { action: 'orderProcessed', orderId: order.id }
```

#### React Components (Chat Mode Only)

In Chat Mode, code can `yield` React components for rich user interactions:

**Multi-line text support:**

```typescript
yield <Text>
Hello! Welcome to our booking system.
I can help you find and book flights, hotels, and rental cars.
What would you like to do today?
</Text>
```

**Composed and nested components:**

```typescript
yield <Message>
  <Text>I found several flight options for your trip:</Text>

  <FlightCard
    airline="United"
    departure="9:00 AM"
    arrival="5:30 PM"
    price={299}
  />

  <FlightCard
    airline="Delta"
    departure="2:15 PM"
    arrival="10:45 PM"
    price={275}
  />

  <Text>Which flight would you prefer?</Text>
  <Button>United Flight</Button>
  <Button>Delta Flight</Button>
  <Button>See More Options</Button>
</Message>

return { action: 'listen' }
```

---

## Execution Modes

LLMz operates in two distinct modes, each optimized for different use cases.

## Chat Mode

**Use Chat Mode when:** You need interactive, conversational agents with back-and-forth user interaction.

### Implementation Requirements

To use Chat Mode, you must implement the base `Chat` class exported by the `llmz` package:

```typescript
import { Chat, Transcript, DefaultComponents } from 'llmz'

class SimpleChat extends Chat {
  private messages: Transcript.Message[] = []

  // Required: Provide conversation history
  get transcript(): Transcript.Message[] {
    return this.messages
  }

  // Required: Define available UI components (only Text)
  get components(): Component[] {
    return [DefaultComponents.Text]
  }

  // Required: Handle agent messages to user
  async handler(message: Transcript.AssistantMessage): Promise<void> {
    if (message.type === 'component' && message.component === 'Text') {
      // Print the text message to console
      console.log(message.props.children)

      // Add message to transcript
      this.messages.push(message)
    }
  }

  // Optional: Handle user input collection
  async prompt(): Promise<Transcript.UserMessage> {
    const input = await this.getUserInput()
    const userMessage: Transcript.UserMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now(),
    }

    // Add user message to transcript
    this.messages.push(userMessage)
    return userMessage
  }
}
```

### Custom Chat Components

Chat components map to the messages supported by your communication channel:

```typescript
import { Component } from 'llmz'
import { z } from '@bpinternal/zui'

// Custom ticket component for support agents
const SupportTicket = new Component({
  name: 'SupportTicket',
  description: 'Displays a support ticket with priority and status',
  type: 'leaf',
  leaf: {
    props: z.object({
      ticketId: z.string(),
      title: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      status: z.enum(['open', 'in-progress', 'resolved']),
      description: z.string(),
      assignee: z.string().optional(),
    }),
  },
  examples: [
    {
      name: 'SupportTicket',
      description: 'A support ticket example',
      code: '<SupportTicket ticketId="TICK-001" title="Login Issue" priority="high" status="open" description="User cannot access account" />',
    },
  ],
})

// Register renderer in your Chat implementation
chat.registerComponent(SupportTicket, async (message) => {
  const { ticketId, title, priority, status } = message.props

  console.log(`
🎫 SUPPORT TICKET
ID: ${ticketId}
Title: ${title}
Priority: ${priority.toUpperCase()}
Status: ${status}
`)
})
```

### ListenExit (Automatic)

In Chat Mode, the special `ListenExit` is automatically added, allowing agents to pause and wait for user input:

```typescript
// LLM automatically generates this to wait for user
return { action: 'listen' }
```

### Transcript Structure

The transcript is an array of `Transcript.Message` with these types:

**User Messages:** Messages from the user

```typescript
{
  role: 'user',
  content: 'Can you help me book a flight?',
  timestamp: 1640995200000
}
```

**Assistant Messages:** Agent responses (text or components)

```typescript
{
  role: 'assistant',
  type: 'component',
  component: 'Text',
  props: { children: 'I\'d be happy to help!' },
  timestamp: 1640995210000
}
```

**Event Messages:** System events or user interactions

```typescript
{
  role: 'event',
  type: 'button_click',
  data: { buttonId: 'confirm-booking', value: 'confirmed' },
  timestamp: 1640995220000
}
```

**Summary Messages:** Compressed conversation history

```typescript
{
  role: 'summary',
  content: 'User requested flight booking from NYC to LAX for Dec 25th. Agent provided options and user selected United flight UA123.',
  timestamp: 1640995230000
}
```

## Worker Mode

**Use Worker Mode when:** You need focused, deterministic execution without user interaction.

In Worker Mode, the only possible outcome is returning one of the provided `Exit` objects (or hitting max iteration limit). If no exits are provided, LLMz uses the built-in `DefaultExit`.

```typescript
// Worker mode example - data processing pipeline
const result = await execute({
  instructions: `
    1. Load sales data from Q4-2024.csv
    2. Calculate monthly growth rates  
    3. Identify top performing products
    4. Generate executive summary report
    5. Save report as Q4-summary.md
  `,
  tools: [loadCSV, calculateGrowth, identifyTopProducts, generateReport, saveFile],
  exits: [
    new Exit({
      name: 'reportGenerated',
      schema: z.object({
        reportPath: z.string(),
        totalSales: z.number(),
        growthRate: z.number(),
        topProduct: z.string(),
      }),
    }),
  ],
  client,
})

// Type-safe result handling
if (result.isSuccess() && result.is('reportGenerated')) {
  console.log(`Report saved: ${result.output.reportPath}`)
  console.log(`Growth rate: ${result.output.growthRate}%`)
}
```

---

## Execute Configuration

The `execute` function accepts comprehensive configuration options:

### Core Parameters

```typescript
import { execute } from 'llmz'

const result = await execute({
  // Required: Botpress client for LLM access
  client: new Client({ botId: '...', token: '...' }),

  // Required: Agent instructions
  instructions: 'You are a helpful customer support agent...',

  // Optional: Available tools
  tools: [weatherTool, emailTool, databaseTool],

  // Optional: Possible exit conditions
  exits: [successExit, errorExit, needsHelpExit],

  // Optional: Chat interface (enables Chat Mode)
  chat: new CLIChat(),

  // Optional: Object instances with variables and namespaced tools
  objects: [userProfile, systemSettings],
})
```

### Cancellation & Abort Signals

Use `AbortSignal` for graceful cancellation:

```typescript
const controller = new AbortController()

// Cancel after 30 seconds
setTimeout(() => controller.abort(), 30000)

const result = await execute({
  client,
  instructions: 'Process large dataset...',
  signal: controller.signal, // Cancellation support
  tools: [processData],
})

// Handle cancellation
if (result.isInterrupted()) {
  console.log('Execution was cancelled')
}
```

### Execution Options

```typescript
const result = await execute({
  client,
  instructions: '...',

  // Execution limits and timeouts
  options: {
    // Maximum iterations before timeout (default: 10)
    loop: 20,

    // LLM model selection (default: 'claude-sonnet-4')
    model: 'claude-sonnet-4',

    // Code execution timeout in milliseconds (default: 30000)
    timeout: 60000,

    // LLM temperature 0-1 (default: 0.1)
    temperature: 0.3,
  },
})
```

### Dynamic Inputs

Most parameters can be functions that evaluate at runtime:

```typescript
await execute({
  client,

  // Dynamic instructions based on time of day
  instructions: () => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return 'You are a cheerful morning assistant...'
    } else {
      return 'You are a professional afternoon assistant...'
    }
  },

  // Async tools that depend on external state
  tools: async () => {
    const userLevel = await getUserAccessLevel()

    if (userLevel === 'admin') {
      return [basicTools, adminTools, superUserTools]
    } else {
      return [basicTools]
    }
  },

  // Dynamic objects based on user session
  objects: async () => {
    const session = await getSession()
    return [createUserProfile(session.userId), createPermissions(session.role)]
  },
})
```

---

## Hooks & Lifecycle

LLMz provides powerful hooks to monitor and control execution flow.

### onTrace Hook (Non-blocking)

Monitor every step of execution for logging and debugging:

```typescript
import { Trace } from 'llmz'

const result = await execute({
  client,
  instructions: '...',
  tools: [weatherTool],

  // Non-blocking trace monitoring
  onTrace: async (trace: Trace) => {
    switch (trace.type) {
      case 'llm_call_success':
        console.log('✅ LLM generated code:', trace.code.length, 'chars')
        break

      case 'tool_call':
        console.log(`🔧 Tool called: ${trace.name}(${JSON.stringify(trace.input)})`)
        break

      case 'property':
        console.log(`📝 Variable set: ${trace.name} = ${trace.value}`)
        break

      case 'yield':
        console.log(`💬 Component yielded: ${trace.component}`)
        break

      case 'think_signal':
        console.log(`🤔 Think signal: ${trace.message}`)
        break

      case 'comment':
        console.log(`💭 Comment: ${trace.text}`)
        break

      case 'log':
        console.log(`📋 Log: ${trace.message}`)
        break

      case 'abort_signal':
        console.log('🛑 Execution aborted')
        break
    }
  },
})
```

### onExit Hook (Blocking)

Control and validate exits before completion:

```typescript
const result = await execute({
  client,
  instructions: '...',
  exits: [successExit, partialSuccessExit],

  // Blocking exit validation
  onExit: async (exit, output) => {
    console.log(`Attempting to exit with: ${exit.name}`)

    // Validation example
    if (exit.name === 'success' && !output.data) {
      throw new Error('Success exit requires data field')
    }

    // Guardrails example
    if (exit.name === 'partialSuccess' && output.errors.length > 5) {
      throw new Error('Too many errors - retry needed')
    }

    // Logging example
    await logExitAttempt(exit.name, output)

    // Exit is allowed
    console.log(`✅ Exit approved: ${exit.name}`)
  },
})
```

### onBeforeExecution Hook (Blocking)

Intercept and modify generated code before execution:

```typescript
const result = await execute({
  client,
  instructions: '...',

  // Code modification and guardrails
  onBeforeExecution: async (iteration) => {
    console.log('Generated code:', iteration.code)

    // Security guardrails
    if (iteration.code.includes('eval(') || iteration.code.includes('Function(')) {
      throw new Error('Security violation: eval detected')
    }

    // Code modification example
    if (iteration.code.includes('console.log')) {
      // Replace console.log with custom logger
      iteration.code = iteration.code.replace(/console\.log\(/g, 'await customLogger(')
    }

    // Add debugging information
    const debugPrefix = `// Iteration ${iteration.index} - ${new Date().toISOString()}\n`
    iteration.code = debugPrefix + iteration.code

    console.log('Modified code:', iteration.code)
  },
})
```

### onIterationEnd Hook (Blocking)

Modify state between iterations:

```typescript
const result = await execute({
  client,
  instructions: '...',

  // Inter-iteration state management
  onIterationEnd: async (iteration, context) => {
    // Log iteration results
    console.log(`Iteration ${iteration.index} completed`)
    console.log('Variables:', iteration.variables)
    console.log('Tool calls:', iteration.toolCalls.length)

    // Modify context for next iteration
    if (iteration.variables.errorCount > 3) {
      context.addSystemMessage('Too many errors detected. Be more careful with tool usage.')
    }

    // Add external data
    const externalUpdate = await fetchRealtimeData()
    context.addSystemMessage(`Latest data: ${JSON.stringify(externalUpdate)}`)

    // Persistence example
    await saveIterationState(iteration.index, {
      variables: iteration.variables,
      toolCalls: iteration.toolCalls,
      timestamp: Date.now(),
    })
  },
})
```

---

## Execution Results

LLMz returns comprehensive result objects with type-safe access patterns.

### Result Type Checking

```typescript
const result = await execute({ ... })

// Primary result checks
if (result.isSuccess()) {
  // Agent completed with an Exit
  console.log('✅ Success:', result.output)

  // Type-safe exit checking
  if (result.is('dataProcessed')) {
    // TypeScript knows result.output matches dataProcessed schema
    console.log('Records processed:', result.output.recordCount)
  }

} else if (result.isError()) {
  // Execution failed with an error
  console.error('❌ Error:', result.error.message)
  console.error('Stack:', result.error.stack)

} else if (result.isInterrupted()) {
  // Execution was cancelled or hit limits
  console.log('⏸️ Interrupted:', result.reason)

  // Check if snapshot is available
  if (result.snapshot) {
    console.log('📸 Snapshot available for resumption')
  }
}
```

### Result Properties

```typescript
// Access execution metadata
console.log('Total iterations:', result.iterations.length)
console.log('Execution time:', result.metadata.duration, 'ms')
console.log('Total tokens:', result.metadata.totalTokens)

// Access the final iteration
const finalIteration = result.lastIteration
console.log('Final code:', finalIteration?.code)
console.log('Final variables:', finalIteration?.variables)

// Access iteration history
result.iterations.forEach((iteration, index) => {
  console.log(`Iteration ${index + 1}:`)
  console.log('- Code:', iteration.code.substring(0, 100) + '...')
  console.log('- Variables:', Object.keys(iteration.variables))
  console.log(
    '- Tool calls:',
    iteration.toolCalls.map((t) => t.name)
  )
})

// Access the most recent successful iteration
const lastSuccessful = result.lastSuccessfulIteration
if (lastSuccessful) {
  console.log('Last successful variables:', lastSuccessful.variables)
}
```

### Variable Access

When executed code declares variables, they're accessible in the iteration object:

```typescript
// If generated code contains:
// const userName = 'John Doe'
// const userAge = 25
// const preferences = { theme: 'dark', language: 'en' }

const result = await execute({ ... })

if (result.isSuccess()) {
  const vars = result.lastIteration.variables

  console.log('User name:', vars.userName) // 'John Doe'
  console.log('User age:', vars.userAge)   // 25
  console.log('Preferences:', vars.preferences) // { theme: 'dark', language: 'en' }
}
```

### Error Information

```typescript
if (result.isError()) {
  const error = result.error

  console.log('Error type:', error.type) // 'execution_error', 'llm_error', etc.
  console.log('Message:', error.message)
  console.log('Code context:', error.codeContext) // Code that caused error
  console.log('Line number:', error.lineNumber)
  console.log('Stack trace:', error.stack)

  // Check if error occurred in a specific iteration
  console.log('Failed iteration:', error.iterationIndex)

  // Access partial results if available
  if (error.partialResult) {
    console.log('Partial variables:', error.partialResult.variables)
  }
}
```

---

## Tools

Tools are the core building blocks that define what your agents can do.

### Tool Anatomy

Every LLMz tool consists of:

```typescript
import { Tool } from 'llmz'
import { z } from '@bpinternal/zui'

const weatherTool = new Tool({
  // Required: Unique identifier
  name: 'getCurrentWeather',

  // Required: Description helps LLM understand when/how to use
  description: 'Gets current weather conditions for any city worldwide',

  // Required: Type-safe input validation
  input: z.object({
    city: z.string().describe('City name (e.g., "New York", "Tokyo")'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius').describe('Temperature units'),
    includeHourly: z.boolean().default(false).describe('Include hourly forecast'),
  }),

  // Required: Type-safe output schema
  output: z.object({
    temperature: z.number().describe('Current temperature'),
    condition: z.string().describe('Weather condition'),
    humidity: z.number().describe('Humidity percentage'),
    hourlyForecast: z
      .array(
        z.object({
          time: z.string(),
          temp: z.number(),
          condition: z.string(),
        })
      )
      .optional()
      .describe('24-hour forecast if requested'),
  }),

  // Required: Async handler function
  async handler({ city, units, includeHourly }) {
    // Call external weather API
    const response = await fetch(`https://api.weather.com/v1/current?city=${city}&units=${units}`)
    const data = await response.json()

    const result = {
      temperature: data.main.temp,
      condition: data.weather[0].description,
      humidity: data.main.humidity,
    }

    // Conditional logic based on input
    if (includeHourly) {
      const hourlyResponse = await fetch(`https://api.weather.com/v1/hourly?city=${city}`)
      const hourlyData = await hourlyResponse.json()
      result.hourlyForecast = hourlyData.hourly.slice(0, 24)
    }

    return result
  },
})
```

### Input and Output Schemas

Schemas are crucial for LLMz to generate correct code. Use descriptive field names and rich descriptions:

```typescript
// ❌ Poor schema - LLM won't understand usage
const badTool = new Tool({
  name: 'process',
  description: 'Process data',
  input: z.object({
    data: z.any(),
    mode: z.string(),
  }),
  output: z.object({ result: z.any() }),
})

// ✅ Good schema - Clear and descriptive
const goodTool = new Tool({
  name: 'processCustomerData',
  description: 'Processes customer data for compliance and analytics reporting',
  input: z.object({
    customerRecords: z
      .array(
        z.object({
          id: z.string(),
          email: z.string().email(),
          signupDate: z.string().datetime(),
        })
      )
      .describe('Array of customer records to process'),

    processingMode: z
      .enum(['compliance', 'analytics', 'both'])
      .describe('Type of processing: compliance (GDPR), analytics (insights), or both'),

    outputFormat: z
      .enum(['json', 'csv', 'pdf'])
      .default('json')
      .describe('Desired output format for the processed data'),
  }),

  output: z.object({
    processedCount: z.number().describe('Number of records successfully processed'),
    complianceReport: z.string().optional().describe('Compliance analysis if requested'),
    analyticsInsights: z.array(z.string()).optional().describe('Key insights if analytics mode'),
    downloadUrl: z.string().describe('URL to download processed results'),
    processingTime: z.number().describe('Processing time in milliseconds'),
  }),
})
```

### Tool Typings

Use `tool.getTypings()` to see the TypeScript definitions generated for the LLM:

```typescript
const weatherTool = new Tool({ ... })

console.log(weatherTool.getTypings())
// Output:
// /**
//  * Gets current weather conditions for any city worldwide
//  */
// declare function getCurrentWeather(input: {
//   city: string; // City name (e.g., "New York", "Tokyo")
//   units?: "celsius" | "fahrenheit"; // Temperature units
//   includeHourly?: boolean; // Include hourly forecast
// }): Promise<{
//   temperature: number; // Current temperature
//   condition: string; // Weather condition
//   humidity: number; // Humidity percentage
//   hourlyForecast?: Array<{
//     time: string;
//     temp: number;
//     condition: string;
//   }>; // 24-hour forecast if requested
// }>;
```

### Advanced Tool Patterns

**Retry Logic:**

```typescript
const apiTool = new Tool({
  name: 'callExternalAPI',
  description: 'Makes resilient API calls with smart retry logic',
  input: z.object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
    body: z.any().optional(),
  }),
  output: z.object({
    data: z.any(),
    statusCode: z.number(),
    retryCount: z.number(),
  }),

  async handler({ endpoint, method, body }) {
    // Your API implementation here
    const response = await fetch(endpoint, { method, body })
    return {
      data: await response.json(),
      statusCode: response.status,
      retryCount: 0,
    }
  },

  // Custom retry logic
  retry: ({ attempt, error }) => {
    // Retry up to 3 times for network errors, but not for auth errors
    if (attempt >= 3) return false
    if (error.message.includes('Unauthorized')) return false
    if (error.message.includes('Forbidden')) return false

    console.log(`Retrying API call (attempt ${attempt + 1}/3)`)
    return true
  },
})
```

**Static Inputs (Pre-configured Parameters):**

```typescript
const restrictedSearchTool = new Tool({
  name: 'searchCompanyDocs',
  description: 'Searches internal company documents',
  input: z.object({
    query: z.string(),
    maxResults: z.number().default(10),
    includeArchived: z.boolean().default(false),
    department: z.string().optional(),
  }),
  output: z.object({
    results: z.array(z.any()),
    totalFound: z.number(),
  }),

  async handler({ query, maxResults, includeArchived, department }) {
    // Implementation
    return { results: [], totalFound: 0 }
  },
}).setStaticInputValues({
  maxResults: 5, // Always limit to 5 results
  includeArchived: false, // Never search archived documents
})

// LLM can only control query and department parameters
```

**Tool Cloning and Modification:**

```typescript
// Clone and modify existing tools (see example 19)
const restrictedWeatherTool = weatherTool.clone({
  name: 'getWeatherForOfficeLocations',
  description: 'Gets weather only for approved office locations',

  // Modify handler to add validation
  handler: async ({ city, units, includeHourly }) => {
    const approvedCities = ['New York', 'London', 'Tokyo', 'San Francisco']

    if (!approvedCities.includes(city)) {
      throw new Error(`Weather access restricted to office locations: ${approvedCities.join(', ')}`)
    }

    // Call original handler
    return weatherTool.handler({ city, units, includeHourly })
  },
})
```

**Tool Aliases:**

```typescript
const searchTool = new Tool({
  name: 'searchDocuments',
  description: 'Searches through company documents and knowledge base',
  aliases: ['search', 'find', 'lookup', 'query'], // Multiple ways to call same tool
  // ... rest of tool definition
})

// LLM can use any alias:
// await searchDocuments({ query: 'vacation policy' })
// await search({ query: 'vacation policy' })
// await find({ query: 'vacation policy' })
```

---

## Objects & Variables

Objects provide namespacing for tools and stateful variables that persist across iterations.

### What are Objects?

Objects group related tools together and can contain variables that maintain state during execution. Think of them as stateful namespaces with their own scope.

```typescript
import { ObjectInstance } from 'llmz'
import { z } from '@bpinternal/zui'

const userProfileObject = new ObjectInstance({
  name: 'userProfile',
  description: 'User profile management with persistent state',

  // Variables that persist across iterations
  properties: [
    {
      name: 'firstName',
      description: "User's first name",
      type: z.string().min(1).max(50),
      value: null, // Initial value
      writable: true, // LLM can modify
    },
    {
      name: 'email',
      description: "User's email address",
      type: z.string().email(),
      value: null,
      writable: true,
    },
    {
      name: 'memberLevel',
      description: 'User membership level',
      type: z.enum(['basic', 'premium', 'enterprise']),
      value: 'basic',
      writable: false, // Read-only
    },
    {
      name: 'preferences',
      description: 'User preferences object',
      type: z.object({
        theme: z.enum(['light', 'dark']).default('light'),
        notifications: z.boolean().default(true),
        language: z.string().default('en'),
      }),
      value: { theme: 'light', notifications: true, language: 'en' },
      writable: true,
    },
  ],

  // Namespaced tools available as userProfile.methodName()
  tools: [
    new Tool({
      name: 'updateProfile',
      description: 'Updates user profile information',
      input: z.object({
        updates: z.object({
          firstName: z.string().optional(),
          email: z.string().email().optional(),
        }),
      }),
      output: z.object({ success: z.boolean() }),
      async handler({ updates }) {
        // Implementation would update external database
        console.log('Updating profile:', updates)
        return { success: true }
      },
    }),

    new Tool({
      name: 'getRecommendations',
      description: 'Gets personalized recommendations based on profile',
      input: z.object({
        category: z.enum(['products', 'content', 'features']),
      }),
      output: z.object({
        recommendations: z.array(z.string()),
      }),
      async handler({ category }) {
        // Use current profile state for recommendations
        return {
          recommendations: [`${category} recommendation based on profile`],
        }
      },
    }),
  ],
})
```

### Variables in Generated Code

The LLM can interact with object variables naturally in TypeScript:

```typescript
// Generated code example:
yield <Text>Hello! Let me help you set up your profile.</Text>

// Set user information with automatic validation
userProfile.firstName = 'John'
userProfile.email = 'john@example.com'

// Read-only variables can be accessed but not modified
yield <Text>Your membership level is: {userProfile.memberLevel}</Text>

// Complex objects can be partially updated
userProfile.preferences = {
  ...userProfile.preferences,
  theme: 'dark',
  notifications: false
}

// Use namespaced tools
const recommendations = await userProfile.getRecommendations({ category: 'products' })

yield <Text>Based on your profile, here are some recommendations:</Text>
{recommendations.recommendations.map(rec =>
  <Text key={rec}>• {rec}</Text>
)}

return { action: 'listen' }
```

### Variable Validation and Error Handling

Variables are validated automatically using their Zui schemas:

```typescript
// This will work:
userProfile.firstName = 'Alice'

// This will throw a validation error:
try {
  userProfile.firstName = '' // Violates min(1) constraint
} catch (error) {
  yield <Text>Error: First name cannot be empty</Text>
}

// This will throw a validation error:
try {
  userProfile.email = 'invalid-email' // Violates email format
} catch (error) {
  yield <Text>Error: Please provide a valid email address</Text>
}

// This will throw an error (read-only):
try {
  userProfile.memberLevel = 'premium' // Cannot modify read-only variable
} catch (error) {
  yield <Text>Error: Membership level cannot be modified directly</Text>
}
```

### Tracking Variable Mutations

Variable changes are automatically tracked and available in traces:

```typescript
await execute({
  client,
  objects: [userProfileObject],

  onTrace: async (trace) => {
    if (trace.type === 'property') {
      console.log(`Variable changed: ${trace.objectName}.${trace.name}`)
      console.log(`Old value: ${trace.oldValue}`)
      console.log(`New value: ${trace.value}`)

      // Custom logging for sensitive data
      if (trace.name === 'email') {
        await auditLog.logEmailChange(trace.oldValue, trace.value)
      }
    }
  },
})
```

### Persisting Variables Across Executions

Variables only persist within a single execution by default. For persistence across executions, implement custom state management:

```typescript
class PersistentUserProfile extends ObjectInstance {
  constructor(userId: string) {
    super({
      name: 'userProfile',
      // ... property definitions
    })

    this.userId = userId
  }

  // Load state before execution
  async loadState() {
    const savedState = await database.getUserProfile(this.userId)

    if (savedState) {
      this.setPropertyValue('firstName', savedState.firstName)
      this.setPropertyValue('email', savedState.email)
      this.setPropertyValue('preferences', savedState.preferences)
    }
  }

  // Save state after execution
  async saveState() {
    const currentState = {
      firstName: this.getPropertyValue('firstName'),
      email: this.getPropertyValue('email'),
      preferences: this.getPropertyValue('preferences'),
    }

    await database.saveUserProfile(this.userId, currentState)
  }
}

// Usage:
const userProfile = new PersistentUserProfile('user-123')
await userProfile.loadState()

const result = await execute({
  client,
  objects: [userProfile],
  // ...
})

if (result.isSuccess()) {
  await userProfile.saveState()
}
```

### Namespaced Tools

Tools within objects are automatically namespaced and available as methods:

```typescript
// Object tools are called with object.method() syntax
const profileTools = new ObjectInstance({
  name: 'profile',
  tools: [
    new Tool({
      name: 'validate',
      description: 'Validates profile completeness',
      // ...
    }),
    new Tool({
      name: 'export',
      description: 'Exports profile data',
      // ...
    }),
  ],
})

// Generated code can use:
// await profile.validate({ field: 'email' })
// await profile.export({ format: 'json' })
```

---

## Snapshots

Snapshots enable pausing and resuming long-running executions, perfect for workflows that span multiple sessions or require external approvals.

### SnapshotSignal

Throw a `SnapshotSignal` from within a tool to halt execution and create a resumable snapshot:

```typescript
import { Tool, SnapshotSignal } from 'llmz'

const longRunningProcessTool = new Tool({
  name: 'processLargeDataset',
  description: 'Processes large dataset in chunks with ability to pause/resume',
  input: z.object({
    datasetId: z.string(),
    chunkSize: z.number().default(1000),
  }),
  output: z.object({
    processedRecords: z.number(),
    totalRecords: z.number(),
    progress: z.number(),
  }),

  async handler({ datasetId, chunkSize }) {
    const dataset = await loadDataset(datasetId)
    const totalRecords = dataset.length

    // Process in chunks
    for (let i = 0; i < totalRecords; i += chunkSize) {
      const chunk = dataset.slice(i, i + chunkSize)
      await processChunk(chunk)

      const processedRecords = Math.min(i + chunkSize, totalRecords)
      const progress = processedRecords / totalRecords

      // Create snapshot every 10% progress
      if (progress % 0.1 < chunkSize / totalRecords) {
        throw new SnapshotSignal('Processing checkpoint reached', 'Taking snapshot to allow safe resumption', {
          // State to preserve
          datasetId,
          processedRecords,
          totalRecords,
          currentChunk: i + chunkSize,
          progress,
        })
      }
    }

    return {
      processedRecords: totalRecords,
      totalRecords,
      progress: 1.0,
    }
  },
})
```

### Workflow Approval Pattern

```typescript
const approvalWorkflowTool = new Tool({
  name: 'submitForApproval',
  description: 'Submits request for manager approval',
  input: z.object({
    requestType: z.string(),
    amount: z.number(),
    justification: z.string(),
  }),
  output: z.object({
    requestId: z.string(),
    status: z.enum(['pending', 'approved', 'rejected']),
  }),

  async handler({ requestType, amount, justification }) {
    const requestId = await submitApprovalRequest({
      type: requestType,
      amount,
      justification,
    })

    // Pause execution until approval
    throw new SnapshotSignal('Awaiting manager approval', 'Execution paused until approval decision is received', {
      requestId,
      requestType,
      amount,
      submittedAt: new Date().toISOString(),
    })
  },
})
```

### Using Snapshots

```typescript
const result = await execute({
  client,
  instructions: 'Process the Q4 sales dataset and generate reports',
  tools: [longRunningProcessTool, generateReportTool],
  exits: [
    new Exit({
      name: 'processingComplete',
      schema: z.object({
        reportUrl: z.string(),
        recordsProcessed: z.number(),
      }),
    }),
  ],
})

// Handle snapshot creation
if (result.isInterrupted() && result.snapshot) {
  console.log('Execution paused - snapshot created')

  // Serialize snapshot for storage
  const snapshotData = JSON.stringify(result.snapshot.serialize())
  await storage.saveSnapshot('execution-123', snapshotData)

  console.log('Snapshot saved. Execution can be resumed later.')
}
```

### Resuming from Snapshots

```typescript
// Resume execution later
const snapshotData = await storage.getSnapshot('execution-123')
const snapshot = Snapshot.deserialize(JSON.parse(snapshotData))

// Resume with success
const result = await snapshot.resolve({
  status: 'approved',
  approvedBy: 'manager@company.com',
  approvedAt: new Date().toISOString(),
})

// Or resume with failure
const result = await snapshot.reject({
  reason: 'Insufficient budget',
  rejectedBy: 'manager@company.com',
})

// Continue from where we left off
if (result.isSuccess()) {
  console.log('Workflow completed after approval')
} else if (result.isError()) {
  console.log('Workflow failed:', result.error.message)
}
```

### Snapshot Metadata

Snapshots contain comprehensive execution state:

```typescript
if (result.snapshot) {
  console.log('Snapshot created at:', result.snapshot.timestamp)
  console.log('Reason:', result.snapshot.reason)
  console.log('Message:', result.snapshot.message)
  console.log('Custom data:', result.snapshot.data)

  // Access execution state
  console.log('Current iteration:', result.snapshot.iterationIndex)
  console.log('Variables at snapshot:', result.snapshot.variables)
  console.log('Tool call history:', result.snapshot.toolCalls)
  console.log('Conversation transcript:', result.snapshot.transcript)
}
```

---

## Thinking & Iteration

LLMz provides powerful mechanisms for the LLM to reflect, analyze variables, and iterate on complex problems.

### ThinkSignal

Throw `ThinkSignal` from tools to force the LLM to reflect on results before responding:

```typescript
import { Tool, ThinkSignal } from 'llmz'

const analyzeDataTool = new Tool({
  name: 'analyzeCustomerData',
  description: 'Analyzes customer data and requires reflection on results',
  input: z.object({
    customerId: z.string(),
    analysisType: z.enum(['behavior', 'satisfaction', 'lifecycle']),
  }),
  output: z.object({
    metrics: z.array(
      z.object({
        name: z.string(),
        value: z.number(),
        trend: z.enum(['up', 'down', 'stable']),
      })
    ),
    insights: z.array(z.string()),
    recommendations: z.array(z.string()),
  }),

  async handler({ customerId, analysisType }) {
    // Perform complex analysis
    const rawData = await performAnalysis(customerId, analysisType)

    const metrics = [
      { name: 'Satisfaction Score', value: 4.2, trend: 'up' },
      { name: 'Engagement Rate', value: 0.65, trend: 'stable' },
      { name: 'Retention Risk', value: 0.23, trend: 'down' },
    ]

    // Force LLM to think about the results
    throw new ThinkSignal(
      'Analysis complete - reflection needed',
      `Raw analysis data has been processed. Key findings include satisfaction trending upward but retention risk concerns. The LLM should carefully consider these metrics and their business implications before providing recommendations to the user.
      
      Metrics summary:
      - Satisfaction: ${metrics[0].value}/5 (${metrics[0].trend})
      - Engagement: ${metrics[1].value * 100}% (${metrics[1].trend})  
      - Retention Risk: ${metrics[2].value * 100}% (${metrics[2].trend})
      
      Consider the relationship between these metrics and provide actionable insights.`
    )
  },
})
```

### return { action: 'think' }

Use the special `think` action to iterate and inspect variables:

```typescript
// Generated code example - Iteration 1:
const weatherData = await getCurrentWeather({ city: 'Chicago' })
const trafficData = await getTrafficConditions({ city: 'Chicago' })
const eventData = await getLocalEvents({ city: 'Chicago', date: 'today' })

// Gather all data first, then think about it
return {
  action: 'think',
  weatherData,
  trafficData,
  eventData
}

// Generated code example - Iteration 2:
// LLM now has access to all the gathered data and can reason about it

// Analyze the combined data for patterns
const severeWeatherAlert = weatherData.condition.includes('storm') || weatherData.windSpeed > 50
const heavyTraffic = trafficData.averageDelay > 15
const majorEvent = eventData.events.some(e => e.expectedAttendance > 10000)

// Make informed recommendations based on analysis
if (severeWeatherAlert && heavyTraffic) {
  yield <Text>⚠️ Travel Advisory: Severe weather and heavy traffic detected in Chicago.</Text>

  yield <RecommendationCard
    type="warning"
    title="Avoid Non-Essential Travel"
    recommendations={[
      'Consider working from home if possible',
      'If travel is necessary, allow extra time',
      'Check for public transit delays',
      'Have emergency supplies in vehicle'
    ]}
  />
} else if (majorEvent) {
  const event = eventData.events.find(e => e.expectedAttendance > 10000)

  yield <Text>🎉 Major event happening in Chicago today: {event.name}</Text>

  yield <EventCard
    name={event.name}
    location={event.venue}
    expectedCrowd={event.expectedAttendance}
    trafficImpact="Moderate delays expected near venue"
  />
}

return { action: 'travelAdviceComplete', city: 'Chicago', recommendationsGiven: 3 }
```

### Iteration Variables Survival

Variables automatically persist across think iterations:

```typescript
// Iteration 1: Collect and analyze data
const salesData = await getSalesData({ quarter: 'Q4', year: 2024 })
const marketData = await getMarketTrends({ industry: 'tech', period: 'Q4' })

// Perform initial calculations
const quarterlyGrowth = calculateGrowth(salesData.current, salesData.previous)
const marketPosition = analyzePosition(salesData, marketData)
const riskFactors = identifyRisks(marketData.trends)

// Think about the analysis
return {
  action: 'think',
  salesData,
  marketData,
  quarterlyGrowth,
  marketPosition,
  riskFactors,
}

// Iteration 2: Variables salesData, marketData, quarterlyGrowth, etc. are still available
// Generate insights based on the analyzed data

const strategicRecommendations = []

if (quarterlyGrowth > 0.15 && marketPosition.ranking <= 3) {
  strategicRecommendations.push('Aggressive expansion recommended - strong position')
  strategicRecommendations.push('Consider increasing marketing spend by 25%')
}

if (riskFactors.includes('supply_chain')) {
  strategicRecommendations.push('Diversify supplier base to mitigate risk')
  strategicRecommendations.push('Build 60-day inventory buffer')
}

// Create comprehensive business report
const executiveSummary = `
Q4 Performance: ${quarterlyGrowth > 0 ? 'Exceeded' : 'Below'} expectations with ${(quarterlyGrowth * 100).toFixed(1)}% growth.
Market Position: Currently ranked #${marketPosition.ranking} in the industry.
Key Risks: ${riskFactors.join(', ')}
`

return {
  action: 'reportGenerated',
  summary: executiveSummary,
  recommendations: strategicRecommendations,
  dataPoints: {
    growth: quarterlyGrowth,
    marketRank: marketPosition.ranking,
    riskCount: riskFactors.length,
  },
}
```

### Complex Multi-Iteration Workflows

```typescript
// Example: Multi-step customer onboarding with thinking

// Iteration 1: Collect initial data
const customerInfo = await validateCustomer({ email: userEmail })
const accountLimits = await getAccountLimits({ tier: customerInfo.requestedTier })
const complianceCheck = await runComplianceCheck({
  customerId: customerInfo.id,
  jurisdiction: customerInfo.country
})

return {
  action: 'think',
  customerInfo,
  accountLimits,
  complianceCheck
}

// Iteration 2: Analyze compliance and create tailored onboarding
let onboardingSteps = ['email_verification', 'profile_completion']
let requiredDocuments = []
let approvalRequired = false

// Add steps based on compliance requirements
if (complianceCheck.kycRequired) {
  onboardingSteps.push('identity_verification')
  requiredDocuments.push('government_id', 'proof_of_address')
}

if (complianceCheck.enhancedDueDiligence) {
  onboardingSteps.push('source_of_funds_verification')
  requiredDocuments.push('bank_statement', 'employment_verification')
  approvalRequired = true
}

// Create personalized welcome experience
const welcomeMessage = generateWelcomeMessage(customerInfo, accountLimits)

return {
  action: 'think',
  onboardingSteps,
  requiredDocuments,
  approvalRequired,
  welcomeMessage
}

// Iteration 3: Execute onboarding flow
yield <WelcomeCard
  customerName={customerInfo.firstName}
  accountTier={customerInfo.requestedTier}
  message={welcomeMessage}
/>

yield <OnboardingChecklist
  steps={onboardingSteps.map(step => ({
    id: step,
    title: formatStepTitle(step),
    completed: false,
    required: true
  }))}
/>

if (requiredDocuments.length > 0) {
  yield <DocumentUpload
    requiredDocuments={requiredDocuments}
    instructions="Please upload the following documents to complete your verification:"
  />
}

if (approvalRequired) {
  yield <Text>
    ⏱️ Your application requires manual review due to enhanced verification requirements.
    You'll receive an email update within 2-3 business days.
  </Text>
}

return {
  action: 'onboardingInitiated',
  customerId: customerInfo.id,
  stepsCount: onboardingSteps.length,
  requiresApproval: approvalRequired
}
```

---

## Citations

Citations provide a standardized way to track sources and reference them in agent responses, essential for RAG (Retrieval-Augmented Generation) patterns.

### CitationManager

The `CitationManager` helper standardizes source registration and referencing:

```typescript
import { CitationManager } from 'llmz'

// Create citation manager for tracking sources
const citations = new CitationManager()

const ragSearchTool = new Tool({
  name: 'searchKnowledgeBase',
  description: 'Searches internal knowledge base with citation tracking',
  input: z.object({
    query: z.string(),
    maxResults: z.number().default(5),
  }),
  output: z.object({
    results: z.array(
      z.object({
        content: z.string(),
        relevanceScore: z.number(),
        citationId: z.string(),
      })
    ),
    totalFound: z.number(),
  }),

  async handler({ query, maxResults }) {
    // Search knowledge base
    const searchResults = await knowledgeBase.search(query, maxResults)

    // Register sources and get citation IDs
    const results = searchResults.map((result) => {
      const citationId = citations.addSource({
        title: result.document.title,
        url: result.document.url,
        author: result.document.author,
        publishDate: result.document.publishDate,
        snippet: result.content.substring(0, 200),
        confidence: result.relevanceScore,
      })

      return {
        content: result.content,
        relevanceScore: result.relevanceScore,
        citationId,
      }
    })

    return {
      results,
      totalFound: searchResults.totalCount,
    }
  },
})
```

### Using Citations in Generated Code

```typescript
// Generated code example using citations:
const searchResults = await searchKnowledgeBase({
  query: 'company vacation policy remote work'
})

yield <Text>
I found information about our vacation policy in the company handbook:
</Text>

// Reference sources with citations
for (const result of searchResults.results) {
  yield <PolicyCard
    content={result.content}
    source={citations.getReference(result.citationId)}
    relevance={result.relevanceScore}
  />
}

// Generate bibliography at the end
const bibliography = citations.generateBibliography()

yield <Text>
Sources referenced in this response:
</Text>

yield <Bibliography entries={bibliography} />

return { action: 'listen' }
```

### Advanced Citation Patterns

**Multi-source synthesis:**

```typescript
const researchTool = new Tool({
  name: 'researchTopic',
  description: 'Researches topic across multiple sources with citation tracking',
  input: z.object({
    topic: z.string(),
    sources: z.array(z.enum(['internal_docs', 'public_web', 'academic_papers'])),
  }),
  output: z.object({
    findings: z.array(
      z.object({
        claim: z.string(),
        evidence: z.string(),
        citations: z.array(z.string()),
        confidence: z.number(),
      })
    ),
    bibliographyCount: z.number(),
  }),

  async handler({ topic, sources }) {
    const allFindings = []

    // Search each source type
    for (const sourceType of sources) {
      const results = await searchByType(sourceType, topic)

      for (const result of results) {
        // Register citation
        const citationId = citations.addSource({
          title: result.title,
          url: result.url,
          sourceType: sourceType,
          extractedDate: new Date().toISOString(),
          snippet: result.excerpt,
          relevanceScore: result.score,
        })

        allFindings.push({
          claim: result.mainClaim,
          evidence: result.excerpt,
          citations: [citationId],
          confidence: result.score,
        })
      }
    }

    // Group related findings and merge citations
    const synthesizedFindings = synthesizeFindings(allFindings)

    return {
      findings: synthesizedFindings,
      bibliographyCount: citations.getSourceCount(),
    }
  },
})
```

**Citation validation and quality scoring:**

```typescript
const validatedSearchTool = new Tool({
  name: 'searchWithValidation',
  description: 'Searches with source quality validation',
  // ... input/output schemas

  async handler({ query }) {
    const results = await performSearch(query)

    const validatedResults = []

    for (const result of results) {
      // Validate source quality
      const qualityScore = await validateSource({
        url: result.url,
        domain: result.domain,
        publishDate: result.publishDate,
        authorCredibility: result.authorScore,
      })

      // Only include high-quality sources
      if (qualityScore >= 0.7) {
        const citationId = citations.addSource({
          ...result,
          qualityScore,
          validatedAt: new Date().toISOString(),
          validationCriteria: ['domain_authority', 'recency', 'author_expertise'],
        })

        validatedResults.push({
          content: result.content,
          citationId,
          qualityScore,
        })
      }
    }

    return { results: validatedResults }
  },
})
```

### Citation Output Formats

```typescript
// Generate different citation formats
const bibliography = citations.generateBibliography({
  format: 'apa', // 'mla', 'chicago', 'ieee'
  includeUrls: true,
  includeAccessDates: true,
  sortBy: 'alphabetical', // 'relevance', 'date'
})

// Export citations for external use
const citationExport = citations.export({
  format: 'bibtex', // 'endnote', 'ris', 'json'
  includeMetadata: true,
})

// Citation analytics
const analytics = citations.getAnalytics()
console.log('Most cited sources:', analytics.topSources)
console.log('Source type distribution:', analytics.sourceTypes)
console.log('Average quality score:', analytics.avgQuality)
```

### RAG Implementation Example

See [example 20 (chat_rag)](examples/20_chat_rag/) for a complete implementation:

```typescript
// Simplified RAG pattern with citations
const ragAgent = async () => {
  const citations = new CitationManager()

  const result = await execute({
    instructions: `
      You are a research assistant. When answering questions:
      1. Search for relevant information
      2. Cite all sources using the citation system
      3. Provide a bibliography at the end
      4. Indicate confidence levels for claims
    `,
    tools: [createSearchTool(citations), createSynthesisTool(citations)],
    chat: new CLIChat(),
    client,
  })

  return result
}
```

---

## Production Best Practices

### Security Considerations

- **Sandboxed Execution**: Code runs in `isolated-vm` with no host system access
- **Input Validation**: All tool inputs validated against Zui schemas
- **Output Sanitization**: Stack traces cleaned of internal details
- **Timeout Protection**: Automatic termination of long-running code
- **Memory Limits**: Prevention of memory exhaustion attacks

### Performance Optimization

- **Minimize Token Usage**: Concise tool descriptions and clear instructions
- **Code Caching**: Automatic caching of compiled code between executions
- **Lazy Loading**: Only provide tools likely to be used
- **Efficient Prompts**: Specific instructions reduce generation time
- **Result Caching**: Cache expensive tool call results when appropriate

### Monitoring and Observability

Use hooks for comprehensive monitoring:

```typescript
const result = await execute({
  // ... configuration

  onTrace: async (trace) => {
    // Send to monitoring system
    await metrics.record(`llmz.${trace.type}`, {
      timestamp: Date.now(),
      executionId: context.executionId,
      metadata: trace,
    })
  },

  onExit: async (exit, output) => {
    // Log successful completions
    await auditLog.logCompletion({
      exitName: exit.name,
      outputSize: JSON.stringify(output).length,
      duration: context.duration,
    })
  },
})
```

### Error Recovery Patterns

```typescript
// Robust error handling with retries
const resilientTool = new Tool({
  // ... definition

  retry: ({ attempt, error }) => {
    // Log retry attempts
    console.log(`Retry ${attempt}: ${error.message}`)

    // Custom retry logic based on error type
    if (error.message.includes('timeout')) return attempt < 5
    if (error.message.includes('rate limit')) return attempt < 3

    return false
  },
})
```

---

This completes the comprehensive LLMz documentation. The framework provides powerful tools for building production-ready AI agents with TypeScript code generation, offering superior reliability and capability compared to traditional JSON-based tool calling approaches.
