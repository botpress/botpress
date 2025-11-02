# Zai Library - Technical Documentation for Claude

## Overview

**Zai** (Zui AI) is an LLM utility library built on top of Zod schemas (@bpinternal/zui) and the Botpress API (@botpress/cognitive). It provides a type-safe, production-ready abstraction layer for common AI operations with built-in features like active learning, automatic chunking, retries, and usage tracking.

**Main Entry Point**: `src/index.ts`
**Build Output**: `dist/` directory
**Package Manager**: pnpm

## Core Architecture

### 1. Main Classes

#### `Zai` Class (src/zai.ts)

The primary interface users interact with. Key responsibilities:

- Configuration management (model selection, namespace, active learning)
- Client wrapper around `@botpress/cognitive`
- Provides chainable API through `with()` and `learn()` methods
- Manages tokenizer initialization (WASM-based)
- Delegates to operation-specific implementations

**Key Properties**:

- `client: Cognitive` - Wrapped Botpress cognitive client
- `Model: Models` - Model identifier (e.g., 'best', 'fast', or specific model)
- `adapter: Adapter` - Storage adapter for active learning (TableAdapter or MemoryAdapter)
- `namespace: string` - Namespace for organizing tasks (default: 'zai')
- `activeLearning: ActiveLearning` - Active learning configuration

**Key Methods**:

- `with(options)` - Creates new Zai instance with merged config (for chaining)
- `learn(taskId)` - Enables active learning for specific task
- `callModel(props)` - Internal method to invoke cognitive API
- `getTokenizer()` - Lazy-loads WASM tokenizer with retry logic

#### `ZaiContext` Class (src/context.ts)

Request execution context that tracks a single operation's lifecycle:

- Wraps Cognitive client with event listeners
- Tracks usage metrics (tokens, cost, latency, requests)
- Manages AbortController for cancellation
- Emits progress events during execution
- Handles retry logic and error recovery

**Key Features**:

- Clones cognitive client per operation for isolation
- Automatic retry with error feedback to LLM (up to maxRetries)
- Injects metadata (integrationName, promptCategory, promptSource)
- Real-time usage tracking via event emitters

#### `Response` Class (src/response.ts)

Promise-like wrapper that adds observability and control:

- Implements `PromiseLike` interface for `await` compatibility
- Event emitter for progress/complete/error events
- Dual value system: simplified value (for await) and full result
- Signal binding for external abort control
- Result caching with elapsed time tracking

**Simplification Pattern**:

```typescript
// Full result
const full = await response.result() // { output, usage, elapsed }

// Simplified (default await)
const simple = await response // Just the value (e.g., boolean for check)
```

#### `EventEmitter` Class (src/emitter.ts)

Lightweight typed event emitter used throughout the library:

- Type-safe event dispatch and subscription
- Supports `on()`, `once()`, `off()`, `emit()`, `clear()`
- No external dependencies

### 2. Adapters (Active Learning Storage)

#### `Adapter` Abstract Class (src/adapters/adapter.ts)

Defines interface for storing and retrieving learning examples:

- `getExamples<TInput, TOutput>(props)` - Retrieve similar examples
- `saveExample<TInput, TOutput>(props)` - Store new examples

#### `TableAdapter` (src/adapters/botpress-table.ts)

Botpress Table API implementation for persistent storage:

- Creates/validates table schema on first use
- Stores examples with metadata (cost, tokens, model, latency)
- Supports similarity search via table search API
- Schema includes: taskType, taskId, key, input, output, explanation, metadata, status, feedback
- Only retrieves 'approved' status examples
- Handles schema validation and migration checking

**Table Schema**:

```typescript
{
  taskType: string       // e.g., 'zai.extract'
  taskId: string        // e.g., 'zai/sentiment-analysis'
  key: string           // Hash of input + taskId + taskType + instructions
  instructions: string
  input: Record         // Searchable
  output: Record
  explanation: string | null
  metadata: {
    model: string
    cost: { input, output }
    latency: number
    tokens: { input, output }
  }
  status: 'pending' | 'rejected' | 'approved'
  feedback: { rating, comment } | null
}
```

#### `MemoryAdapter` (src/adapters/memory.ts)

No-op implementation for when active learning is disabled:

- Returns empty examples array
- Does not persist anything

### 3. Operations

All operations follow a similar pattern:

1. Parse and validate options using Zod schemas
2. Create `ZaiContext` for the operation
3. Execute async operation function
4. Wrap in `Response` with simplification function
5. Optionally save examples to adapter

#### Extract Operation (src/operations/extract.ts)

**Purpose**: Extract structured data from unstructured text using Zod schemas

**Key Features**:

- Supports objects, arrays of objects, and primitive types
- Automatic schema wrapping for non-objects
- Multi-chunk processing for large inputs (parallel with p-limit)
- Recursive merging of chunked results
- JSON repair and parsing (json5, jsonrepair)
- Few-shot learning with examples
- Strict/non-strict mode

**Special Markers**:

- `■json_start■` / `■json_end■` - JSON boundaries
- `■NO_MORE_ELEMENT■` - Signals completion for arrays
- `■ZERO_ELEMENTS■` - Empty array indicator

**Chunking Strategy**:

1. If input exceeds chunkLength, split into chunks
2. Process chunks in parallel (max 10 concurrent)
3. Recursively merge results into final schema
4. Handles conflicting data by taking most frequent/reasonable value

**Example Flow**:

```typescript
zai.extract(text, z.object({ name: z.string(), age: z.number() }))
→ Context creation
→ Tokenize + chunk if needed
→ Generate prompt with examples
→ LLM extraction with JSON markers
→ Parse + validate with schema
→ Save example (if learning enabled)
→ Return via Response wrapper
```

#### Check Operation (src/operations/check.ts)

**Purpose**: Boolean condition verification with explanation

**Return Type**: `{ value: boolean, explanation: string }` (simplified to `boolean`)

**Markers**: `■TRUE■`, `■FALSE■`, `■END■`

**Handling Ambiguity**: If both TRUE and FALSE appear, uses the last occurrence

**Example Storage**: Stores boolean output with explanation for future reference

#### Label Operation (src/operations/label.ts)

**Purpose**: Multi-label classification with confidence levels

**Labels**:

- `ABSOLUTELY_NOT` (confidence: 1, value: false)
- `PROBABLY_NOT` (confidence: 0.5, value: false)
- `AMBIGUOUS` (confidence: 0, value: false)
- `PROBABLY_YES` (confidence: 0.5, value: true)
- `ABSOLUTELY_YES` (confidence: 1, value: true)

**Return Type**:

```typescript
Record<
  LabelKey,
  {
    explanation: string
    value: boolean
    confidence: number
  }
>
```

Simplified to `Record<LabelKey, boolean>`

**Format**: `■label:【explanation】:LABEL_VALUE■`

**Chunking**: For large inputs, processes in chunks and merges with OR logic (any true → true)

#### Rewrite Operation (src/operations/rewrite.ts)

**Purpose**: Transform text according to instructions

**Use Cases**:

- Translation
- Tone adjustment
- Format conversion
- Content modification

**Markers**: `■START■`, `■END■`

**Length Control**: Optionally enforces token length limits

**Examples**: Supports custom examples for format learning

#### Filter Operation (src/operations/filter.ts)

**Purpose**: Filter array elements based on natural language condition

**Strategy**:

- Chunks arrays (max 50 items per chunk, max tokens per chunk)
- Processes chunks in parallel (max 10 concurrent)
- Returns filtered subset

**Format**: `■0:true■1:false■2:true` (indices with boolean decisions)

**Token Budget Allocation**:

- 50% for examples
- 25% for condition
- Remainder for input array

#### Text Operation (src/operations/text.ts)

**Purpose**: Generate text content based on prompt

**Features**:

- Direct text generation
- Length constraints with enforcement
- Token-to-word approximation table for short texts
- Higher temperature (0.7) for creativity

**Simplest Operation**: No complex parsing, just prompt → text

#### Summarize Operation (src/operations/summarize.ts)

**Purpose**: Summarize documents of any length to target length

**Strategies**:

1. **Sliding Window**: For moderate documents

   - Iteratively processes overlapping windows
   - Updates summary incrementally
   - Final pass ensures target length

2. **Merge Sort**: For very large documents
   - Recursively splits into sub-chunks
   - Summarizes each independently (parallel)
   - Merges summaries bottom-up

**Options**:

- `length`: Target token count
- `intermediateFactor`: Allows intermediate summaries to be longer (default: 4x)
- `sliding.window`: Window size for sliding strategy
- `sliding.overlap`: Overlap between windows
- `prompt`: What to focus on
- `format`: Output formatting instructions

**Markers**: `■START■`, `■END■`

### 4. Utilities

#### src/utils.ts

- `stringify(input, beautify)` - Converts any input to string (handles null/undefined)
- `fastHash(str)` - Simple 32-bit hash for cache keys
- `takeUntilTokens(arr, tokens, count)` - Takes items until token budget exhausted

#### src/tokenizer.ts

- Lazy-loads `@bpinternal/thicktoken` WASM tokenizer
- Retry logic for WASM initialization race conditions
- Singleton pattern for tokenizer instance

#### src/operations/constants.ts

- `PROMPT_INPUT_BUFFER = 1048` - Safety buffer for input token calculations
- `PROMPT_OUTPUT_BUFFER = 512` - Safety buffer for output token calculations

#### src/operations/errors.ts

- `JsonParsingError` - Specialized error for JSON parsing failures
- Formats Zod validation errors in human-readable way
- Shows JSON excerpt and specific validation issues

## Token Budget Management

All operations carefully manage token budgets to stay within model limits:

```typescript
const PROMPT_COMPONENT = model.input.maxTokens - PROMPT_INPUT_BUFFER

// Typical allocation strategy:
{
  input: 50% of PROMPT_COMPONENT,
  condition/instruction: 20% of PROMPT_COMPONENT,
  examples: 30% of PROMPT_COMPONENT,
}
```

Chunking triggers when:

- Input exceeds configured `chunkLength`
- Calculated budget exceeded

## Active Learning Flow

When enabled (`activeLearning.enable = true`):

1. **Task Execution**:

   - Generate unique key: `fastHash(taskType + taskId + input + instructions)`
   - Check adapter for exact match (cache hit)
   - If no match, generate examples from adapter.getExamples()
   - Execute LLM operation with examples as few-shot learning
   - Save result to adapter if not aborted

2. **Example Retrieval**:

   - Adapter searches by similarity (semantic search via Table API)
   - Only returns 'approved' status examples
   - Limited to top 10 results
   - Filtered by token budget (takeUntilTokens)

3. **Example Format**:

   - Each operation formats examples differently
   - Generally: User message (input + context) → Assistant message (expected output)
   - Includes metadata for tracking cost/performance

4. **Learning Curve**:
   - First calls: No examples (uses defaults or no examples)
   - Subsequent calls: Uses approved examples as guidance
   - Improves format consistency and accuracy over time

## Error Handling

### Retry Mechanism (ZaiContext)

```typescript
maxRetries = 3 (default)
for (attempt in 0..maxRetries) {
  try {
    response = await cognitive.generateContent(...)
    return transform(response)
  } catch (error) {
    if (attempt === maxRetries) throw error
    // Add error as user message for LLM to fix
    messages.push({ role: 'user', content: ERROR_PARSING_OUTPUT })
  }
}
```

### Transform Errors

- Operations throw errors in transform function when output invalid
- Error message fed back to LLM with context
- Common issues: missing markers, invalid JSON, wrong format

### Abort Handling

- All operations check `ctx.controller.signal.throwIfAborted()`
- Examples not saved if aborted
- Clean abort via Response.abort() or signal binding

## Usage Tracking

### Metrics Collected (Usage type)

```typescript
{
  requests: {
    requests: number        // Total requests initiated
    errors: number          // Failed requests
    responses: number       // Successful responses
    cached: number          // Cached responses (no tokens used)
    percentage: number      // Completion percentage
  },
  cost: {
    input: number          // USD cost for input tokens
    output: number         // USD cost for output tokens
    total: number          // Total cost
  },
  tokens: {
    input: number          // Input tokens consumed
    output: number         // Output tokens generated
    total: number          // Total tokens
  }
}
```

### Access Patterns

```typescript
// During execution (progress events)
response.on('progress', (usage) => {
  console.log(usage.tokens.total)
})

// After completion
const { output, usage, elapsed } = await response.result()
```

### Metadata Stored with Examples

```typescript
{
  model: string // Model used
  cost: {
    input, output
  }
  latency: number // ms
  tokens: {
    input, output
  }
}
```

## Configuration

### ZaiConfig

```typescript
{
  client: BotpressClientLike | Cognitive  // Required
  userId?: string                         // For tracking/attribution
  modelId?: Models                        // 'best' | 'fast' | 'provider:model'
  activeLearning?: {
    enable: boolean
    tableName: string                     // Must match /^[A-Za-z0-9_/-]{1,100}Table$/
    taskId: string                        // Must match /^[A-Za-z0-9_/-]{1,100}$/
  }
  namespace?: string                      // Default: 'zai'
}
```

### Model Selection

- `'best'` - Best available model (default)
- `'fast'` - Fastest/cheapest model
- `'provider:model'` - Specific model (e.g., 'openai:gpt-4')

Model details fetched lazily via `cognitive.getModelDetails()`

## Testing

Test files located in `e2e/` directory:

- Uses Vitest framework
- Real API calls to Botpress (requires .env with credentials)
- Snapshot testing for validation
- Includes active learning tests with table cleanup

**Key Test Utilities** (e2e/utils.ts):

- `getCachedClient()` - Reuses cognitive client across tests
- `getZai()` - Creates Zai instance
- `getClient()` - Gets raw Botpress client
- Loads `BotpressDocumentation` for large document tests

## Build System

- **TypeScript**: Compiled with tsup (types) and custom esbuild script (build.ts)
- **Type Generation**: `tsup` generates .d.ts files
- **Neutral Build**: `ts-node -T ./build.ts` for platform-neutral JS
- **Size Limit**: Max 50 kB (enforced by size-limit)
- **Peer Dependencies**: @bpinternal/thicktoken, @bpinternal/zui

## Extension Points

### Adding New Operations

1. **Create operation file**: `src/operations/my-operation.ts`

2. **Declare module augmentation**:

```typescript
declare module '@botpress/zai' {
  interface Zai {
    myOperation(input: T, options?: Options): Response<Output, Simplified>
  }
}
```

3. **Implement operation function**:

```typescript
const myOperation = async (input: T, options: Options, ctx: ZaiContext): Promise<Output> => {
  // Implementation
}
```

4. **Add prototype method**:

```typescript
Zai.prototype.myOperation = function (input, options) {
  const context = new ZaiContext({
    client: this.client,
    modelId: this.Model,
    taskId: this.taskId,
    taskType: 'zai.myOperation',
    adapter: this.adapter,
  })

  return new Response(context, myOperation(input, options, context), simplify)
}
```

5. **Import in src/index.ts**: `import './operations/my-operation'`

### Custom Adapters

Implement `Adapter` abstract class:

```typescript
export class MyAdapter extends Adapter {
  async getExamples<TInput, TOutput>(props: GetExamplesProps<TInput>) {
    // Return array of { key, input, output, explanation?, similarity }
  }

  async saveExample<TInput, TOutput>(props: SaveExampleProps<TInput, TOutput>) {
    // Persist example
  }
}
```

## Dependencies

### Runtime

- `@botpress/cognitive` (0.1.50) - Core LLM client
- `json5` (^2.2.3) - Relaxed JSON parsing
- `jsonrepair` (^3.10.0) - Fix malformed JSON
- `lodash-es` (^4.17.21) - Utilities (chunk, isArray, clamp)
- `p-limit` (^7.2.0) - Concurrency control

### Peer Dependencies

- `@bpinternal/thicktoken` (^1.0.0) - WASM tokenizer
- `@bpinternal/zui` (^1.2.2) - Zod wrapper with transforms

### Dev Dependencies

- `@botpress/client` (workspace) - Botpress API client
- `@botpress/common` (workspace) - Shared utilities
- `@botpress/vai` (workspace) - Validation utilities
- `tsup`, `esbuild` - Build tools
- `vitest` - Testing framework

## Common Patterns

### Chaining Configuration

```typescript
const result = await zai.with({ modelId: 'fast' }).learn('my-task').extract(text, schema)
```

### Abort Control

```typescript
const controller = new AbortController()
const response = zai.check(text, condition)
response.bindSignal(controller.signal)

setTimeout(() => controller.abort(), 5000)
```

### Progress Tracking

```typescript
const response = zai.summarize(longDoc)
response.on('progress', (usage) => {
  console.log(`Progress: ${usage.requests.percentage * 100}%`)
})
const summary = await response
```

### Detailed Results

```typescript
const { output, usage, elapsed } = await zai.extract(text, schema).result()
console.log(`Took ${elapsed}ms, used ${usage.tokens.total} tokens, cost $${usage.cost.total}`)
```

## Debugging Tips

1. **Enable request logging**:

```typescript
cognitive.on('request', (req) => console.log(req.input))
cognitive.on('response', (req, res) => console.log(res.output))
```

2. **Check token counts**:

```typescript
const tokenizer = await getTokenizer()
console.log(tokenizer.count(text))
```

3. **Inspect examples**:

```typescript
const examples = await adapter.getExamples({ taskType, taskId, input })
console.log(examples)
```

4. **Monitor retries**: Watch for multiple requests in usage stats

```typescript
const { usage } = await response.result()
if (usage.requests.requests > usage.requests.responses) {
  console.warn('Retries occurred')
}
```

## Performance Considerations

- **Chunking**: Use smaller chunks for better parallelization, larger for better context
- **Concurrency**: Limited to 10 parallel operations (p-limit)
- **Caching**: Active learning provides cache via exact key matches
- **Token Estimation**: Tokenizer used for accurate counting, not char-based estimation
- **Model Selection**: 'fast' model significantly cheaper but lower quality

## Security Notes

- Input validation via Zod schemas
- No arbitrary code execution
- Table names/taskIds validated with regex
- Frozen table schema prevents accidental modifications
- No sensitive data in default table tags

## Known Issues & Limitations

1. **WASM Loading**: Tokenizer requires retry logic due to race condition
2. **Table Search**: Limited to 1024 characters for search query
3. **Chunk Merging**: May lose information if chunks have conflicting data
4. **Max Retries**: Fixed at 3, not configurable per operation
5. **Concurrency**: Fixed at 10 parallel operations
6. **Schema Changes**: Table adapter doesn't auto-migrate schemas

## Future Enhancement Ideas

- Configurable retry strategies
- Custom similarity functions for example retrieval
- Streaming support for long-running operations
- Cache layer beyond exact match
- Multi-model fallback strategies
- Cost optimization recommendations
- Token usage prediction before execution

---

**Last Updated**: Based on codebase analysis at commit `7d073b6de` on branch `sp/zai-fix-empty-arr`
