# API Reference

## Core Functions

### execute()

The main execution function for running LLMz agents.

```typescript
async function execute<TExits extends Exit[]>(options: ExecuteOptions<TExits>): Promise<ExecuteResult<TExits>>
```

#### ExecuteOptions

```typescript
interface ExecuteOptions<TExits extends Exit[]> {
  // Core configuration
  instructions: string
  client: LLMClient
  
  // Execution mode
  chat?: ChatInterface
  
  // Tools and capabilities
  tools?: Tool[]
  exits?: TExits
  components?: Component[]
  objects?: ObjectInstance[]
  
  // Execution control
  options?: {
    timeout?: number
    maxIterations?: number
    sandbox?: boolean
    maxMemory?: string
    loop?: number
  }
  
  // State management
  snapshot?: Snapshot
  context?: Record<string, unknown>
  
  // Event handlers
  onTrace?: (event: TraceEvent) => void
  onError?: (error: Error, iteration: Iteration) => Promise<ErrorAction>
  onBeforeExecution?: (iteration: Iteration) => Promise<void>
  
  // Abort signal
  signal?: AbortSignal
}
```

#### ExecuteResult

```typescript
interface ExecuteResult<TExits extends Exit[]> {
  status: 'success' | 'error' | 'exit' | 'timeout' | 'aborted'
  output?: any
  error?: Error
  iteration: Iteration
  exit?: Exit
  
  // Type-safe exit checking
  is<T extends Exit>(exit: T): this is ExitResult<T>
  isSuccess(): this is SuccessResult
  isError(): this is ErrorResult
}
```

## Classes

### Tool

Define tools that agents can use to perform actions.

```typescript
class Tool<TInput = any, TOutput = any> {
  constructor(config: ToolConfig<TInput, TOutput>)
  
  // Execute the tool
  async execute(input: TInput, context: ToolContext): Promise<TOutput>
  
  // Create enhanced version
  clone<TNewInput = TInput, TNewOutput = TOutput>(
    overrides: Partial<ToolConfig<TNewInput, TNewOutput>>
  ): Tool<TNewInput, TNewOutput>
}
```

#### ToolConfig

```typescript
interface ToolConfig<TInput, TOutput> {
  name: string
  description: string
  input: ZodSchema<TInput>
  output: ZodSchema<TOutput>
  handler: (input: TInput, context: ToolContext) => Promise<TOutput>
}
```

#### ToolContext

```typescript
interface ToolContext {
  // Emit signals to control execution
  emit: (signal: Signal) => void
  
  // Access execution context
  context: Record<string, unknown>
  
  // Iteration information
  iteration: number
}
```

### Exit

Define custom termination conditions for executions.

```typescript
class Exit<TOutput = void> {
  constructor(config: ExitConfig<TOutput>)
}
```

#### ExitConfig

```typescript
interface ExitConfig<TOutput> {
  name: string
  description: string
  schema?: ZodSchema<TOutput>
}
```

### Component

Define UI components that can be rendered during execution.

```typescript
class Component<TProps = any> {
  constructor(config: ComponentConfig<TProps>)
}
```

#### ComponentConfig

```typescript
interface ComponentConfig<TProps> {
  name: string
  description: string
  props: ZodSchema<TProps>
  render: (props: TProps) => string | JSX.Element
}
```

### ObjectInstance

Manage stateful objects with methods and validation.

```typescript
class ObjectInstance<TState = any> {
  constructor(config: ObjectInstanceConfig<TState>)
}
```

#### ObjectInstanceConfig

```typescript
interface ObjectInstanceConfig<TState> {
  name: string
  description: string
  schema: ZodSchema<TState>
  initialValue: TState
  methods?: Record<string, ObjectMethod>
}
```

#### ObjectMethod

```typescript
interface ObjectMethod<TInput = any, TOutput = any> {
  input?: ZodSchema<TInput>
  output?: ZodSchema<TOutput>
  handler: (input: TInput, context: ObjectMethodContext) => Promise<TOutput>
}
```

#### ObjectMethodContext

```typescript
interface ObjectMethodContext<TState> {
  // Get current state
  get(): TState
  
  // Update state
  update(updater: (state: TState) => void): void
  
  // Replace state
  set(newState: TState): void
  
  // Emit signals
  emit: (signal: Signal) => void
}
```

## Signals

### ThinkSignal

Pause execution and communicate with the user.

```typescript
class ThinkSignal {
  constructor(message: string)
}
```

### SnapshotSignal

Create a snapshot of the current execution state.

```typescript
class SnapshotSignal {
  constructor(message?: string)
}
```

## Interfaces

### LLMClient

Interface that LLM providers must implement.

```typescript
interface LLMClient {
  // Generate response from prompt
  generateResponse(prompt: string, options?: GenerateOptions): Promise<string>
  
  // Optional: Stream response
  streamResponse?(prompt: string, options?: GenerateOptions): AsyncIterable<string>
}
```

### ChatInterface

Interface for chat implementations.

```typescript
interface ChatInterface {
  // Get conversation history
  getTranscript(): Message[]
  
  // Add message to conversation
  addMessage(message: Message): void
  
  // Get next user input
  getNextInput(): Promise<string | null>
  
  // Send response to user
  sendResponse(response: string): void
  
  // Render component
  renderComponent?(component: RenderedComponent): void
}
```

### Message

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
  metadata?: Record<string, unknown>
}
```

## Error Types

### ExecutionError

Base error for execution failures.

```typescript
class ExecutionError extends Error {
  iteration: Iteration
  code?: string
}
```

### ToolError

Error thrown by tool execution.

```typescript
class ToolError extends Error {
  tool: string
  input: unknown
  originalError?: Error
}
```

### ValidationError

Error from schema validation failures.

```typescript
class ValidationError extends Error {
  schema: string
  input: unknown
  zodError: ZodError
}
```

## Utility Functions

### createSnapshot()

Create a snapshot from execution state.

```typescript
function createSnapshot(state: ExecutionState): Snapshot
```

### restoreSnapshot()

Restore execution state from a snapshot.

```typescript
function restoreSnapshot(snapshot: Snapshot): ExecutionState
```

### sanitizeStackTrace()

Clean stack traces of internal framework details.

```typescript
function sanitizeStackTrace(error: Error): Error
```

## Type Definitions

### Iteration

```typescript
interface Iteration {
  number: number
  code?: string
  output?: unknown
  error?: Error
  status: 'pending' | 'running' | 'success' | 'error'
  startTime: Date
  endTime?: Date
  duration?: number
}
```

### Snapshot

```typescript
interface Snapshot {
  id: string
  timestamp: Date
  state: ExecutionState
  iteration: number
  metadata: Record<string, unknown>
}
```

### TraceEvent

```typescript
interface TraceEvent {
  type: 'iteration_start' | 'iteration_end' | 'tool_call' | 'signal_emit'
  timestamp: Date
  data: unknown
}
```

## Configuration

### Environment Variables

```typescript
// VM execution driver
VM_DRIVER: 'isolated-vm' | 'node'

// Debug and development
DEBUG: boolean
CI: boolean

// Timeout defaults
LLMZ_DEFAULT_TIMEOUT: number
LLMZ_MAX_ITERATIONS: number
```

### Runtime Options

```typescript
interface RuntimeOptions {
  // VM configuration
  vmDriver?: 'isolated-vm' | 'node'
  
  // Security settings
  enableSandbox?: boolean
  maxMemory?: string
  
  // Execution limits
  defaultTimeout?: number
  maxIterations?: number
  
  // Debug options
  enableTracing?: boolean
  preserveStackTraces?: boolean
}
```

## Advanced Types

### Generic Execute

```typescript
// Type-safe execution with specific exits
const result = await execute({
  instructions: 'Task description',
  exits: [exitA, exitB] as const,
  client,
})

// TypeScript knows about specific exits
if (result.is(exitA)) {
  // result.output is typed based on exitA's schema
}
```

### Tool Chaining

```typescript
// Type-safe tool composition
const pipeline = [toolA, toolB, toolC] as const

type PipelineInput = InputType<typeof toolA>
type PipelineOutput = OutputType<typeof toolC>
```

### Context Typing

```typescript
// Typed execution context
interface MyContext {
  userId: string
  permissions: string[]
}

const result = await execute<MyContext>({
  instructions: 'Use typed context',
  context: { userId: '123', permissions: ['read'] },
  client,
})
```