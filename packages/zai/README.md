# Zai - AI Operations Made Simple

Zai is a powerful LLM utility library that provides a clean, type-safe API for common AI operations. Built on Zod schemas and the Botpress API, it makes AI operations simple, intuitive, and production-ready.

## ✨ Key Features

- **🎯 Simple API** - One-liner operations for common AI tasks
- **🔒 Type Safety** - Full TypeScript support with Zod schema validation
- **🧠 Active Learning** - Learn from examples and improve over time
- **⚡ Performance** - Built-in retries, caching, and error handling
- **♾️ Infinite Documents** - Handle any document size with automatic chunking
- **📊 Usage Tracking** - Monitor tokens, costs, and performance

## 📦 Installation

```bash
npm install @botpress/zai @botpress/client @bpinternal/zui
```

## 🚀 Quick Start

```typescript
import { Client } from '@botpress/client'
import { Zai } from '@botpress/zai'
import { z } from '@bpinternal/zui'

// Initialize
const client = new Client({ botId: 'YOUR_BOT_ID', token: 'YOUR_TOKEN' })
const zai = new Zai({ client })

// Extract structured data
const person = await zai.extract(
  'John Doe is 30 years old and lives in New York',
  z.object({
    name: z.string(),
    age: z.number(),
    location: z.string(),
  })
)
// Result: { name: 'John Doe', age: 30, location: 'New York' }

// Check content
const isPositive = await zai.check('This product is amazing!', 'expresses positive sentiment')
// Result: true

// Generate text
const story = await zai.text('Write a short story about AI', { length: 200 })

// Summarize documents
const summary = await zai.summarize(longDocument, { length: 500 })
```

## 📚 Core Operations

### 1. Extract - Get structured data from text

```typescript
// Extract single object
const product = await zai.extract(
  text,
  z.object({
    name: z.string(),
    price: z.number(),
    inStock: z.boolean(),
  })
)

// Extract array of items
const products = await zai.extract(text, z.array(productSchema))
```

### 2. Check - Verify boolean conditions

```typescript
const result = await zai.check(email, 'is spam')
const { value, explanation } = await result.full()
```

### 3. Label - Apply multiple labels

```typescript
const labels = await zai.label(review, {
  positive: 'expresses positive sentiment',
  technical: 'mentions technical details',
  verified: 'from verified purchaser',
})
// Result: { positive: true, technical: false, verified: true }
```

### 4. Rewrite - Transform text

```typescript
// Translate
const french = await zai.rewrite(text, 'translate to French')

// Change tone
const formal = await zai.rewrite('Hey! What's up?', 'make it professional')
```

### 5. Filter - Filter arrays with natural language

```typescript
const techCompanies = await zai.filter(companies, 'are technology companies')
const recentPosts = await zai.filter(posts, 'were published this week')
```

### 6. Text - Generate content

```typescript
const blogPost = await zai.text('Write about the future of AI', {
  length: 1000,
  temperature: 0.7,
})
```

### 7. Summarize - Create summaries

```typescript
// Simple summary
const summary = await zai.summarize(article)

// With custom prompt
const technicalSummary = await zai.summarize(paper, {
  length: 500,
  prompt: 'Focus on technical implementation details',
})
```

## 🧠 Active Learning

Enable active learning to improve accuracy over time:

```typescript
const zai = new Zai({
  client,
  activeLearning: {
    enable: true,
    tableName: 'ai_learning_data',
    taskId: 'sentiment-analysis',
  },
})

// Use with task ID for learning
const result = await zai.learn('sentiment-analysis').check(text, 'is positive')
```

## ⚙️ Configuration

### Model Selection

```typescript
// Use the best model (default)
const zai = new Zai({ client, model: 'best' })

// Use fast model for speed
const fastZai = new Zai({ client, model: 'fast' })

// Use specific model
const customZai = new Zai({ client, model: 'gpt-4-turbo' })
```

### Progress Tracking

```typescript
const response = zai.summarize(veryLongDocument)

// Track progress
response.on('progress', (progress) => {
  console.log(`${progress.percent}% complete`)
})

const summary = await response
```

### Usage Monitoring

```typescript
const result = await zai.extract(text, schema)
const usage = await result.usage()

console.log({
  tokens: usage.totalTokens,
  cost: usage.totalCost,
  latency: usage.totalLatency,
})
```

## 🎯 Benefits

1. **Production Ready** - Built-in error handling, retries, and rate limiting
2. **Type Safe** - Full TypeScript support with runtime validation
3. **Scalable** - Handle documents of any size with automatic chunking
4. **Cost Effective** - Track usage and optimize with active learning
5. **Developer Friendly** - Clean API with method chaining and events

## 📖 Advanced Usage

### Chaining Operations

```typescript
const processedData = await zai.with({ temperature: 0.3 }).learn('data-extraction').extract(document, complexSchema)
```

### Handling Large Documents

```typescript
// Automatically chunks and processes in parallel
const extractedData = await zai.extract(
  hugeDocument, // 100k+ tokens
  z.array(recordSchema),
  { chunkSize: 4000 }
)
```

### Custom Abort Signals

```typescript
const controller = new AbortController()
const response = zai.summarize(document, { signal: controller.signal })

// Cancel if needed
setTimeout(() => controller.abort(), 5000)
```

## 🛠️ API Reference

### Zai Class

- `new Zai(options)` - Create instance with client and configuration
- `.with(config)` - Create new instance with merged configuration
- `.learn(taskId)` - Enable active learning for specific task

### Operations

- `.extract(content, schema, options?)` - Extract structured data
- `.check(content, condition, options?)` - Verify boolean condition
- `.label(content, criteria, options?)` - Apply multiple labels
- `.rewrite(content, instruction, options?)` - Transform text
- `.filter(items, condition, options?)` - Filter array items
- `.text(prompt, options?)` - Generate text
- `.summarize(content, options?)` - Create summary

### Response Methods

- `await response` - Get simple result
- `await response.full()` - Get detailed result with metadata
- `await response.usage()` - Get usage statistics
- `response.on('progress', handler)` - Track progress
- `response.abort()` - Cancel operation

## 📝 License

MIT - See LICENSE file for details
