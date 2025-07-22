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

## onTrace (non-blocking)

When provided, onTrace will be called at every step of iteration progress with a typed Trace.
This is useful for logging and debugging purposes.
This hook is non-blocking, meaning execution will not wait until this hook is done before continuing.

Traces

`import { Trace } from 'llmz'`

'abort_signal',
'comment',
'llm_call_success',
'property',
'think_signal',
'tool_call',
'yield',
'log'

## onExit (blocking) – Advanced

Called when an exit is returned.
onExit can be used to prevent the use of an exit. However, this hook can't mutate the output value of an exit.
Within this hook, you can throw an error to force another loop.
This is useful for implementing guardrails or for ensuring valid output values before exiting.

## onBeforeExecution (blocking) – Advanced

This book will be called _after_ the code has been generated by the LLM but _before_ it is run by the sandbox.
This hook is blocking and is allowed to mutate the code of the iteration.
Throwing an error will also trigger a new iteration.
This is useful to implement guardrails.

```tsx
async onBeforeExecution(iteration) {
	await new Promise((resolve) => setTimeout(resolve, 10))
	// Mutate the code to change the action
	iteration.code = `await demo('hello 123');\nreturn { action: 'done' }`
},
```

## onIterationEnd (blocking) – Advanced

onIterationEnd will be called and awaited after each iteration ends and _before_ the next generation is started.
This is useful to augment or mutate the state of the iteration before generating code.

# Execution Result

- todo: explain how to use the `.isSuccess()`, `.is(exit)`, `.isError()` and `.isInterrupoted`()`
- todo: how to access iterations, result, error, meytadata, last successful iteration etc
- todo: access the iteration variables and declarations. eg. when the code executed declares variables, the variables are accessible in the iteration object (iteration.variables). for example, `const hello = '1234'`. iteration.variables.hello will be '1234' after the code is run.

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

- todo: citations / citationmanager is an helper provided by LLMz to standardize the registrattion of sources/snippets of text and referrencing them in the agent responses.
- todo: see example 20 (chat_rag).
