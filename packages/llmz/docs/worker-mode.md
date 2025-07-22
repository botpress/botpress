# Worker Mode Documentation

Worker Mode enables automated execution environments with enhanced security and sandboxing. This mode is ideal for computational tasks, data processing, and automated workflows.

## Basic Worker Setup

```typescript
import { execute } from 'llmz'

const result = await execute({
  instructions: 'Calculate the fibonacci sequence for n=10',
  client,
})

console.log(result.output)
console.log(result.iteration.code) // Generated TypeScript code
```

## Core Concepts

### One-Shot Execution

Worker mode typically runs as a single execution without user interaction:

```typescript
const result = await execute({
  instructions: 'Process this data and return the analysis',
  tools: [dataProcessingTool],
  client,
})

if (result.isSuccess()) {
  console.log('Analysis complete:', result.output)
} else {
  console.error('Execution failed:', result.error)
}
```

### Security and Sandboxing

Worker mode includes built-in security features:

```typescript
const result = await execute({
  instructions: 'Perform calculations safely',
  client,
  options: {
    timeout: 5000,        // 5 second timeout
    maxIterations: 3,     // Limit execution loops
    sandbox: true,        // Enable VM isolation
  },
})
```

## Tools and Objects

### File System Operations

```typescript
import { ObjectInstance } from 'llmz'
import { z } from 'zod'

const fileSystem = new ObjectInstance({
  name: 'fs',
  description: 'File system operations',
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
    readFile: {
      input: z.object({
        path: z.string(),
      }),
      output: z.object({
        content: z.string(),
      }),
      async handler({ path }, { get }) {
        const state = get()
        return { content: state.files[path] || '' }
      },
    },
  },
})

await execute({
  instructions: 'Create and manage files',
  objects: [fileSystem],
  client,
})
```

### Complex Tool Chaining

```typescript
const dataLoader = new Tool({
  name: 'loadData',
  description: 'Load data from external source',
  input: z.object({
    source: z.string(),
  }),
  output: z.object({
    data: z.array(z.record(z.unknown())),
  }),
  async handler({ source }) {
    // Load data from database, API, file, etc.
    return { data: await loadFromSource(source) }
  },
})

const dataProcessor = new Tool({
  name: 'processData',
  description: 'Process and transform data',
  input: z.object({
    data: z.array(z.record(z.unknown())),
    operation: z.string(),
  }),
  output: z.object({
    processedData: z.array(z.record(z.unknown())),
  }),
  async handler({ data, operation }) {
    // Apply transformations
    return { processedData: applyOperation(data, operation) }
  },
})

const result = await execute({
  instructions: 'Load data from "users.json", filter active users, and calculate statistics',
  tools: [dataLoader, dataProcessor],
  client,
})
```

## Execution Control

### Timeout Protection

```typescript
const controller = new AbortController()

// Set timeout
setTimeout(() => controller.abort(), 10000)

const result = await execute({
  instructions: 'Perform long-running calculation',
  client,
  signal: controller.signal,
})
```

### Iteration Limits

```typescript
const result = await execute({
  instructions: 'Process data iteratively',
  client,
  options: {
    maxIterations: 5,  // Prevent infinite loops
  },
})
```

## Snapshots and State Persistence

### Creating Snapshots

```typescript
import { SnapshotSignal } from 'llmz'

const complexTask = new Tool({
  name: 'longRunningTask',
  description: 'A task that can be paused and resumed',
  input: z.object({
    step: z.number().default(1),
  }),
  output: z.object({
    result: z.string(),
  }),
  async handler({ step }, { emit }) {
    for (let i = step; i <= 10; i++) {
      // Perform work
      await performStep(i)
      
      // Create snapshot every 3 steps
      if (i % 3 === 0) {
        emit(new SnapshotSignal(`Completed step ${i}`))
      }
    }
    
    return { result: 'Task completed' }
  },
})
```

### Resuming from Snapshots

```typescript
const result = await execute({
  instructions: 'Resume the long-running task',
  tools: [complexTask],
  client,
  snapshot: previousSnapshot, // Resume from saved state
})
```

## Error Recovery

### Automatic Retry Logic

```typescript
const unreliableTool = new Tool({
  name: 'flaky',
  description: 'A tool that sometimes fails',
  input: z.object({
    data: z.string(),
  }),
  output: z.object({
    result: z.string(),
  }),
  async handler({ data }) {
    // This might fail randomly
    if (Math.random() < 0.3) {
      throw new Error('Random failure occurred')
    }
    return { result: `Processed: ${data}` }
  },
})

// LLMz will automatically analyze errors and retry with corrections
const result = await execute({
  instructions: 'Process the data reliably',
  tools: [unreliableTool],
  client,
})
```

### Custom Error Handling

```typescript
const result = await execute({
  instructions: 'Handle errors gracefully',
  tools: [unreliableTool],
  client,
  
  onError: async (error, iteration) => {
    console.log('Handling error:', error.message)
    
    // Custom recovery logic
    if (error.message.includes('timeout')) {
      return { action: 'retry', delay: 2000 }
    }
    
    return { action: 'abort' }
  },
})
```

## Security Testing

### Malicious Code Protection

```typescript
// LLMz automatically protects against malicious code
const result = await execute({
  instructions: 'Calculate fibonacci numbers safely',
  client,
  options: {
    timeout: 5000,     // Prevent infinite loops
    sandbox: true,     // VM isolation
    maxMemory: '50MB', // Memory limits
  },
})

// The framework will catch and prevent:
// - Infinite loops
// - Memory exhaustion
// - File system access
// - Process manipulation
// - Network access (unless tools allow it)
```

### Stack Trace Sanitization

```typescript
const result = await execute({
  instructions: 'Code that might error',
  client,
})

if (result.status === 'error') {
  // Stack traces are automatically sanitized
  // Internal framework details are removed
  console.log('Clean error:', result.error)
}
```

## Tool Enhancement Patterns

### Tool Wrapping

```typescript
const baseTool = new Tool({
  name: 'basic',
  description: 'Basic functionality',
  input: z.object({
    input: z.string(),
  }),
  output: z.object({
    result: z.string(),
  }),
  async handler({ input }) {
    return { result: `Basic: ${input}` }
  },
})

// Create enhanced version
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
    // Call original tool
    const result = await baseTool.execute(input, ctx)
    
    // Add enhancements
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

## Integration Examples

### Data Pipeline

```typescript
// Example data processing pipeline
const pipeline = [
  new Tool({
    name: 'extract',
    description: 'Extract data from source',
    // ... implementation
  }),
  new Tool({
    name: 'transform',
    description: 'Transform and clean data',
    // ... implementation
  }),
  new Tool({
    name: 'load',
    description: 'Load data to destination',
    // ... implementation
  }),
]

const result = await execute({
  instructions: 'Run ETL pipeline: extract from API, clean data, load to database',
  tools: pipeline,
  client,
})
```

### Machine Learning Workflow

```typescript
const mlTools = [
  new Tool({
    name: 'loadDataset',
    description: 'Load training dataset',
    // Integration with your ML library
  }),
  new Tool({
    name: 'trainModel',
    description: 'Train machine learning model',
    // TensorFlow, PyTorch, scikit-learn integration
  }),
  new Tool({
    name: 'evaluateModel',
    description: 'Evaluate model performance',
    // Model evaluation logic
  }),
]

const result = await execute({
  instructions: 'Train and evaluate a classification model on the dataset',
  tools: mlTools,
  client,
})
```

### API Integration

```typescript
const apiTool = new Tool({
  name: 'callAPI',
  description: 'Make REST API calls',
  input: z.object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    data: z.record(z.unknown()).optional(),
  }),
  output: z.object({
    response: z.unknown(),
    status: z.number(),
  }),
  async handler({ endpoint, method, data }) {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    })
    
    return {
      response: await response.json(),
      status: response.status,
    }
  },
})
```

## Best Practices

1. **Resource Limits**: Always set appropriate timeouts and memory limits
2. **Error Handling**: Implement graceful error recovery and logging
3. **Tool Composition**: Design tools that work well together in pipelines
4. **State Management**: Use snapshots for long-running tasks
5. **Security**: Enable sandboxing for untrusted code execution
6. **Monitoring**: Track execution metrics and performance

## Common Patterns

- **Batch Processing**: Process large datasets in chunks with snapshots
- **Workflow Orchestration**: Chain multiple tools for complex workflows
- **Data Transformation**: ETL pipelines with error recovery
- **Computational Tasks**: Mathematical calculations with timeout protection
- **System Integration**: Connect multiple external services and APIs

## VM Execution Environments

LLMz supports multiple execution environments:

- **isolated-vm**: Secure V8 isolate for production (default)
- **Node.js VM**: Standard Node.js vm module for development
- **Browser**: Standard JavaScript execution for web environments

Configure with environment variables:
```bash
VM_DRIVER=isolated-vm  # or 'node' for development
```