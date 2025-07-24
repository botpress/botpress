# How LLMz works

Like many other agent frameworks, LLMz is an agentic framework that calls LLM models in a loop to achieve a desired outcome, with optional access to tools and memory.

Unlike other agent frameworks, LLMz is code-first – meaning it generates and runs Typescript code in a sandbox to communicate and execute tools rather than using rudimentary JSON tool calling and text responses. This is what makes agents built on LLMz more reliable and capable than other agents.

## Execution Loop

At its simplest, LLMz exposes a single method (`execute`) that will run in a loop until one of the following conditions are met:

- An `Exit` is returned
- The agent waits for the user input (in Chat Mode)
- or the maximum number of iterations has been reached

The loop will iterate by calling tools, thinking about tool outputs and recovering from errors automatically.

## Code Generation

Unlike traditional tool-calling agents, LLMz defines tools using Typescript and runs real code in a VM.
Concretely, that means LLMz does not require and rely on tool-calling, JSON output or any other feature of LLMs outside of text generation.

Because models have been trained extensively on code bases, models are usually much better at generating working code than calling tools using JSON.

### Structure of an LLMz Code Bloc

#### Return statement

At the minimum, an LLMz response _must_ contain a return statement with an Exit.

```tsx
// in chat mode, this gives back the turn to the user
return { action: 'listen' }
```

```tsx
// assuming an Exit named 'done' with output schema <number> has been declared
return { action: 'done', result: 666 }
```

#### Tool calls

Because LLMz generates standard Typescript code and because the VM has access to tools passed to `execute()`. This allows the combination of multiple tool calls, conditional logic and error handling. You'll also notice that tools are type-safe and provide an output schema, which the generated code can easily use to combine tools.

```tsx
// The user wants to fly from Quebec to New York with a max budget of $500
const price = await getTicketPrice({ from: 'quebec', to: 'new york' })

if (price > 500) {
  throw new Error('Price too high')
} else {
  const ticketId = await buyTicket({ from: 'quebec', to: 'new york' })
  return { action: 'done', result: ticketId }
}
```

#### Comments

The use of comments in the code helps the LLM to think "step-by-step" and use the tools correctly. It helps the LLM plan ahead of writing the code.

#### React Components (Chat Mode)

In Chat Mode, the code can `yield` React components to respond to the user. Unlike tool calls, components have many benefits.

They support multi-line text:

```tsx
yield <Text>
Hello, world!
This is a second line.
</Text>

return { action: 'listen' }
```

And they can be composed / nested:

```tsx
yield <Message>
	<Text>What do you prefer ?</Text>
	<Button>Cats</Button>
	<Button>Dogs</Button>
</Message>

return { action: 'listen' }
```

# Modes: Chat vs Worker

## Chat Mode

    - When using Chat Mode, you need to implement the base Chat class exported by the `llmz` package
    - In the examples folder, we implemented a basic `CLIChat` class that provides a basic CLI-base chat application
    - The chat class must provide 3 things:
    	- providing/fetching the chat transcript (an array of messages in the conversation)
    	- providing a list of components the agent can respond with (for example "text" or "button")
    	- a `handler` to send the agent messages to the user
    - Note that the `transcript` and `components` are called every iteration, therefore can be either static or dynamic. LLMz accepts a static property but also an async getter.

### Chat Components (Chat Mode)

A chat component is a type of message your agent can reply with. Typically, components should map to the messages supported by the channel the communication occurs in. For example, on Botpress Webchat, a Carousel, Card, Buttons, Text, Image, Video etc. On SMS, usually only Text and Image are supported.

Because Chat Components are just React components (TSX), you can define custom components for anything. For example, you could implement a PlaneTicket component (see example 10) and render the message however you want in the channel in the `Chat` handler method.

### ListenExit

In chat mode, the special ListenExit is automatically added. this is what allows your agent to stop looping and wait for the user to respond. Read more about Exit below.

### Transcript

A transcript is an array of Transcript.Message

```
// See transcript.d.ts
import { Transcript } from 'llmz'
```

Message types:

- User: a message in the conversation coming from the user
- Assistant: a message the agent sent in the conversation
- Event: an event represents something that happened in the context of the conversation but isn't necessarily something the user or assistant said. It could be a user interaction event, such as button click; or a notification like an extended silence or the result of an async operation.
- Summary: when a conversation gets too long, you can generate a summary of the conversation thus far and replace the messages by a summary message (transcript compression).

## Worker Mode

In worker mode, the only possible outcome is the return of one of the provided Exit (or max iteration error).
If no Exit is passed to `execute()`, then llmz's DefaultExit will be used.

# Execute Props / Input

## Cancellation / Abort Signal

You can provide an AbortSignal to `execute({ signal })` to abort the execution of llmz. This will immediately abort LLM requests as well as the VM sandbox code execution.

## Options

### Loop

This is how many iterations maximum `execute` will loop before erroring when failing to `exit` gracefully.

### Model

This is which LLM model the cognitive client will use for the LLM generations.

### Timeout

This is how how long the code execution can run for in milliseconds.

### Temperature

This is the LLM model temperature (between 0 and 1).

## Dynamic Inputs

Most parameters to `execute` can be either static or dynamic.
For example, `instructions` and `tools` can be async functions that return the parameter.

```tsx
await execute({
    client,

    // Use function-based instructions that evaluate at runtime
    instructions: () => { return '<instructions>' }

    tools: async () => {
    	// execute async operations
    	return [toolA, toolB]
    }
  })
```

# Hooks

LLMz provides a comprehensive hook system that allows you to inject custom logic at various points during execution. Hooks are categorized as either blocking (execution waits) or non-blocking, and either mutation (can modify data) or non-mutation.

## onTrace (non-blocking, non-mutation)

Called for each trace generated during iteration. Useful for logging, debugging, or monitoring execution progress.

**Characteristics:**

- **Non-blocking**: Execution continues without waiting for this hook
- **Non-mutation**: Cannot modify traces
- **Called**: For every trace event during iteration

**Usage:**

```tsx
await execute({
  onTrace: ({ trace, iteration }) => {
    console.log(`Iteration ${iteration}: ${trace.type}`, trace)
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

## onIterationEnd (blocking, non-mutation)

Called after each iteration ends, regardless of status. Useful for logging, cleanup, or controlling iteration timing.

**Characteristics:**

- **Blocking**: Execution waits until this hook resolves
- **Non-mutation**: Cannot modify iteration result or status
- **Called**: After every iteration completion

**Usage:**

```tsx
await execute({
  onIterationEnd: async (iteration, controller) => {
    console.log(`Iteration ${iteration.id} ended with status: ${iteration.status.type}`)

    // Add delays, cleanup, or conditional logic
    if (iteration.status.type === 'execution_error') {
      await logError(iteration.error)
    }

    // Can use controller to abort execution if needed
    // controller.abort('Custom abort reason')
  },
  // ... other props
})
```

## onExit (blocking, non-mutation)

Called when an exit is reached. Useful for logging, notifications, or implementing guardrails by throwing errors to prevent exit.

**Characteristics:**

- **Blocking**: Execution waits until this hook resolves
- **Non-mutation**: Cannot modify exit result value
- **Called**: When any exit is reached
- **Guardrails**: Can throw error to prevent exit and continue iteration

**Usage:**

```tsx
await execute({
  onExit: async (result) => {
    console.log(`Exiting with: ${result.exit.name}`, result.result)

    // Implement guardrails
    if (result.exit.name === 'approve_loan' && result.result.amount > 10000) {
      throw new Error('Manager approval required for loans over $10,000')
    }

    // Send notifications
    await notifyStakeholders(result)
  },
  // ... other props
})
```

## onBeforeExecution (blocking, mutation)

Called after LLM generates code but before execution. Allows code modification and guardrails implementation.

**Characteristics:**

- **Blocking**: Execution waits until this hook resolves
- **Mutation**: Can modify the code to be executed
- **Called**: After code generation, before VM execution
- **Guardrails**: Can throw error to trigger new iteration

**Usage:**

```tsx
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

    // Add security checks, logging, etc.
    await auditCodeGeneration(iteration.code)
  },
  // ... other props
})
```

## onBeforeTool (blocking, mutation)

Called before any tool execution. Allows input modification and tool execution control.

**Characteristics:**

- **Blocking**: Execution waits until this hook resolves
- **Mutation**: Can modify tool input
- **Called**: Before every tool execution
- **Control**: Can prevent tool execution by throwing error

**Usage:**

```tsx
await execute({
  onBeforeTool: async ({ iteration, tool, input, controller }) => {
    console.log(`Executing tool: ${tool.name}`, input)

    // Input modification
    if (tool.name === 'sendEmail') {
      return {
        input: {
          ...input,
          subject: `[Automated] ${input.subject}`, // Add prefix
        },
      }
    }

    // Access control
    if (tool.name === 'deleteFile' && !hasPermission(input.path)) {
      throw new Error('Insufficient permissions to delete file')
    }

    // Rate limiting, validation, etc.
    await validateToolUsage(tool, input)
  },
  // ... other props
})
```

## onAfterTool (blocking, mutation)

Called after tool execution. Allows output modification and post-processing.

**Characteristics:**

- **Blocking**: Execution waits until this hook resolves
- **Mutation**: Can modify tool output
- **Called**: After every tool execution
- **Processing**: Can transform results before they reach the LLM

**Usage:**

```tsx
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
        },
      }
    }

    // Logging, caching, notifications
    await cacheResult(tool.name, input, output)
  },
  // ... other props
})
```

## Hook Execution Order

1. **onTrace**: Throughout execution (non-blocking)
2. **onBeforeExecution**: After code generation, before execution
3. **onBeforeTool**: Before each tool call
4. **onAfterTool**: After each tool call
5. **onExit**: When exit is reached
6. **onIterationEnd**: After iteration completes

## Best Practices

- **Error Handling**: Always wrap hook logic in try-catch for production
- **Performance**: Keep hooks lightweight, especially onTrace
- **Security**: Use onBeforeExecution and onBeforeTool for security validation
- **Debugging**: Leverage onTrace for comprehensive execution monitoring
- **Guardrails**: Implement business logic validation in onExit
- **Data Transformation**: Use onBeforeTool/onAfterTool for input/output processing

# Execution Result

Every call to `execute()` returns an ExecutionResult that provides type-safe access to the execution outcome. LLMz execution can result in three different types of results: Success, Error, or Interrupted.

## Result Types

### SuccessExecutionResult

Agent completed successfully with an Exit. This is the most common positive outcome containing the structured data produced by the agent.

### ErrorExecutionResult

Execution failed with an unrecoverable error such as:

- User aborted via AbortSignal
- Maximum iterations exceeded without reaching an exit
- Critical system failures

### PartialExecutionResult

Execution was interrupted by a SnapshotSignal for pauseable operations. Contains a snapshot that can be used to resume execution later.

## Basic Status Checking

Use type guard methods to safely access result data:

```tsx
const result = await execute({
  instructions: 'Calculate the sum of numbers 1 to 100',
  client,
})

// Check execution status
if (result.isSuccess()) {
  console.log('Success:', result.output)
  console.log('Generated code:', result.iteration.code)
} else if (result.isError()) {
  console.error('Error:', result.error)
  console.error('Failed iteration:', result.iteration?.error)
} else if (result.isInterrupted()) {
  console.log('Interrupted:', result.signal.message)
  console.log('Snapshot available:', !!result.snapshot)
}
```

## Type-Safe Exit Checking

Use `result.is(exit)` for type-safe access to specific exit data:

```tsx
const dataExit = new Exit({
  name: 'dataProcessed',
  schema: z.object({
    recordCount: z.number(),
    processingTime: z.number(),
  }),
})

const errorExit = new Exit({
  name: 'processingError',
  schema: z.object({
    errorCode: z.string(),
    details: z.string(),
  }),
})

const result = await execute({
  instructions: 'Process the data',
  exits: [dataExit, errorExit],
  client,
})

// Type-safe exit handling with automatic output typing
if (result.is(dataExit)) {
  // TypeScript knows result.output has { recordCount: number, processingTime: number }
  console.log(`Processed ${result.output.recordCount} records`)
  console.log(`Processing took ${result.output.processingTime}ms`)
} else if (result.is(errorExit)) {
  // TypeScript knows result.output has { errorCode: string, details: string }
  console.error(`Error ${result.output.errorCode}: ${result.output.details}`)
}
```

## Accessing Execution Details

### Iterations and Execution Flow

```tsx
const result = await execute({ ... })

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

// Find specific iteration types
const errorIterations = result.iterations.filter(
  iter => iter.status.type === 'execution_error'
)

const thinkingIterations = result.iterations.filter(
  iter => iter.status.type === 'thinking_requested'
)
```

### Variables and Declarations

Agent-generated variables are accessible in the iteration object:

```tsx
// If agent generates: const hello = '1234'
const lastIteration = result.iteration
if (lastIteration) {
  console.log(lastIteration.variables.hello) // '1234'

  // Access all variables from the final iteration
  Object.entries(lastIteration.variables).forEach(([name, value]) => {
    console.log(`Variable ${name}:`, value)
  })
}

// Variables persist across thinking iterations
result.iterations.forEach((iteration) => {
  if (iteration.status.type === 'thinking_requested') {
    console.log('Variables during thinking:', iteration.variables)
  }
})
```

### Tool Calls and Traces

```tsx
const result = await execute({ ... })

// Access tool calls from all iterations
const allToolCalls = result.iterations.flatMap(iter =>
  iter.traces.filter(trace => trace.type === 'tool_call')
)

console.log('Total tool calls:', allToolCalls.length)

// Access other trace types
const lastIteration = result.iteration
if (lastIteration) {
  const yields = lastIteration.traces.filter(trace => trace.type === 'yield')
  const comments = lastIteration.traces.filter(trace => trace.type === 'comment')
  const propertyAccess = lastIteration.traces.filter(trace => trace.type === 'property')
}
```

### Context and Metadata

```tsx
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

## Snapshot Handling (Advanced)

Handle interrupted executions with snapshot resumption:

```tsx
const result = await execute({
  instructions: 'Process large dataset with pauseable operation',
  tools: [snapshotCapableTool],
  client,
})

if (result.isInterrupted()) {
  console.log('Execution paused:', result.signal.message)
  console.log('Reason:', result.signal.longMessage)

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

  // Continuation will resume from exactly where it left off
  if (continuation.isSuccess()) {
    console.log('Resumed execution completed:', continuation.output)
  }
}
```

## Built-in Exits

```tsx
import { ListenExit, DefaultExit, ThinkExit } from 'llmz'

const result = await execute({ ... })

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

## Error Analysis

````tsx
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

# Tools

- todo: Tool class props
- todo: input and outpout schema
- todo: tips: schemas and descriptions are really important for LLMz to generate good code, thus, good tool usage.
- todo: use `tool.getTypings()` to see the code generated for the LLM
- todo: cloning a tool and mutate the input, output, name, description or handler (see example 19, tool wrap)
- todo: static inputs to "freeze" and force inputs on a tool
- todo: aliases, so the same tool can be called with multiple names

# Objects

- todo: explain what an object is. it's like a namespace. it groups related tools together. but objects can also do more: they can contain variables.

## Variables

- todo: readonly vs writable variables
- todo: variable types (schema)
- todo: variable usage within the VM code
- todo: type and schema validation – show an example of how the VM will throw an error when trying to assign a value to a variable that doesn't pass the schema validation. see example 09.
- todo: tracking mutations
- todo: persisting variables across executions

## Tools

- todo: identical to global tools, except they are available under the object namespace. for example `myObject.myTool()`.

# Snapshots (advanced)

## SnapshotSignal

- todo: inside a tool, throw a SnapshotSignal to halt the execution of llmz and take a serializable snapshot of the execution.
- todo: snapshots are built to persist the state of an executuon with the goal of resuming it in the future
- todo: thisi s useful for long-running tools for examples, like workflows etc

## Snapshot object

- todo: getting the snapshot from result (result.isInterrupted() and result.snapshot)
- todo: serialize snapshot to JSON
- todo: restoring a snapshot from JSON
- todo: resolve a snapshot (success)
- todo: reject a snapshot (reject)

# Thinking

## ThinkSignal

- todo: throw new ThinkSignal to force the iteraiton and looking at variables. this is useful for tools to force LLMs to have a look at the results before responding for example.

## return { action: 'think' }

- todo: special return type to think and inspect variables and iterate

## Citations

CitationsManager is a helper provided by LLMz to standardize the registration of sources/snippets of text and referencing them in agent responses. It's particularly useful for RAG (Retrieval-Augmented Generation) systems where you need to track the source of information and provide proper attribution.

### Core Concepts

Citations use rare Unicode symbols (`【】`) as markers that are unlikely to appear in natural text, making them safe to use in LLM prompts and responses. The system supports:

- **Source Registration**: Register any object as a citation source
- **Tag Generation**: Automatic creation of unique citation tags like `【0】`, `【1】`
- **Content Processing**: Extract and clean citation tags from text
- **Multiple Citations**: Support for multi-source citations like `【0,1,3】`

### Basic Usage

```tsx
import { CitationsManager } from 'llmz'

const citations = new CitationsManager()

// Register sources and get citation tags
const source1 = citations.registerSource({
  file: 'document.pdf',
  page: 5,
  title: 'Company Policy'
})
const source2 = citations.registerSource({
  url: 'https://example.com/article',
  title: 'Best Practices'
})

console.log(source1.tag) // "【0】"
console.log(source2.tag) // "【1】"

// Use tags in content
const content = `The policy states that employees must arrive on time${source1.tag}. However, best practices suggest flexibility${source2.tag}.`

// Extract and process citations
const { cleaned, citations: found } = citations.extractCitations(content, (citation) => {
  return `[${citation.id + 1}]` // Convert to numbered format
})

console.log(cleaned) // "The policy states that employees must arrive on time[1]. However, best practices suggest flexibility[2]."
console.log(found) // Array of citation objects with source data
````

### RAG Implementation Example

Here's how citations are used in a real RAG system (from example 20):

```tsx
// Tool for searching knowledge base with citations
const ragTool = new Tool({
  name: 'search',
  description: 'Searches in the knowledge base for relevant information.',
  input: z.string().describe('The query to search in the knowledge base.'),
  async handler(query) {
    // Perform semantic search
    const { passages } = await client.searchFiles({
      query,
      tags: { purpose: RAG_TAG },
      limit: 20,
      contextDepth: 3,
      consolidate: true,
    })

    // Handle no results
    if (!passages.length) {
      throw new ThinkSignal(
        'No results were found',
        'No results were found in the knowledge bases. You can try rephrasing your question or asking something else. Do NOT answer the question as no results were found.'
      )
    }

    // Build response with citations
    let message: string[] = ['Here are the search results from the knowledge base:']
    let { tag: example } = chat.citations.registerSource({}) // Example citation

    // Register each retrieved passage as a source
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
      `We got the search results. When answering the question, you MUST add inline citations (eg: "Yes, the price is $10${example} ...")`,
      message.join('\n').trim()
    )
  },
})
```

### Chat Integration

The CLIChat utility demonstrates how to integrate citations into chat interfaces:

```tsx
class CLIChat extends Chat {
  public citations: CitationsManager = new CitationsManager()

  private async sendMessage(input: RenderedComponent) {
    // ... component handling ...

    if (text.length > 0) {
      let sources: string[] = []

      // Extract citations and format them for display
      const { cleaned } = this.citations.extractCitations(text, (citation) => {
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

### Advanced Features

#### Multiple Citation Support

```tsx
// Agent can reference multiple sources in one citation
const content = 'This fact is supported by multiple studies【0,1,3】'

const { cleaned, citations } = manager.extractCitations(content)
// citations array will contain entries for sources 0, 1, and 3
```

#### Object Citation Processing

```tsx
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

#### Citation Stripping

```tsx
// Remove all citation tags from content
const textWithCitations = 'This statement【0】 has multiple【1,2】 citations.'
const cleaned = CitationsManager.stripCitationTags(textWithCitations)
// Result: "This statement has multiple citations."
```
