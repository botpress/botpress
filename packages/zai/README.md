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

### Classify - Pick exactly one label

```typescript
const intent = await zai.classify('I was charged twice', ['billing', 'technical', 'other'])
// Result: 'billing'

// Arrays are classified item by item (pass labels with descriptions for better results)
const intents = await zai.classify(tickets, {
  billing: 'Charges, invoices, refunds',
  technical: 'Bugs, errors, outages',
  other: 'Anything else',
})
// Result: ['technical', 'billing', ...]

// Full result: { label, confidence, scores, source: 'classifier' | 'llm' }
const { output } = await zai.classify(ticket, intents).result()
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

### 6. Group - Organize items into categories

```typescript
// Group items automatically
const grouped = await zai.group(tasks, {
  instructions: 'Group by priority level',
})
// Result: { 'High Priority': [...], 'Medium Priority': [...], 'Low Priority': [...] }

// Group with initial categories
const categorized = await zai.group(emails, {
  instructions: 'Group by topic',
  initialGroups: [
    { id: 'work', label: 'Work' },
    { id: 'personal', label: 'Personal' },
  ],
})

// Group large datasets efficiently
const organized = await zai.group(largeArray, {
  instructions: 'Group by date',
  chunkLength: 8000, // Process in chunks for better performance
})
```

### 7. Rate - Score items on a 1-5 scale

```typescript
// Auto-generate criteria (returns total score)
const scores = await zai.rate(products, 'is it a good value product?')
// Result: [12, 8, 15] (total scores for each item)

// Get detailed ratings
const { output } = await zai.rate(products, 'is it a good value product?').result()
// Result: [
//   { affordability: 4, quality: 5, features: 3, total: 12 },
//   { affordability: 3, quality: 2, features: 3, total: 8 },
//   ...
// ]

// Use fixed criteria
const ratings = await zai.rate(passwords, {
  length: 'password length (12+ chars = very_good, 8-11 = good, 6-7 = average, 4-5 = bad, <4 = very_bad)',
  complexity: 'character variety (all types = very_good, 3 types = good, 2 types = average, 1 type = bad)',
  strength: 'overall password strength',
})
// Result: [
//   { length: 5, complexity: 5, strength: 5, total: 15 },
//   { length: 1, complexity: 1, strength: 1, total: 3 },
// ]

// Rate large datasets efficiently (parallelized)
const allRatings = await zai.rate(Array(500).fill(item), 'how complete is this?')
// Processes ~500 items in ~120ms with automatic chunking
```

### 8. Sort - Order items with natural language

```typescript
// Sort by natural criteria
const sorted = await zai.sort(emails, 'sort by urgency')
// LLM determines criteria and orders items accordingly

// Sort with detailed results
const { output } = await zai.sort(tasks, 'sort by priority').result()
// output includes scoring breakdown for each item

// Complex multi-criteria sorting
const prioritized = await zai.sort(tickets, 'sort by customer importance and issue severity')

// Sort large datasets efficiently (parallelized with chunking)
const orderedItems = await zai.sort(Array(500).fill(item), 'sort by relevance')
```

### 9. Text - Generate content

```typescript
const blogPost = await zai.text('Write about the future of AI', {
  length: 1000,
  temperature: 0.7,
})
```

### 10. Summarize - Create summaries

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

### Speed vs. accuracy (classification API)

`check`, `label`, `classify`, `filter` and `rate` can answer with the Cognitive classification API
(a calibrated classifier such as Jev, ~100-300ms per call for a fraction of an LLM call's cost):

```typescript
// Default: the classifier answers alone (fastest and cheapest)
const zai = new Zai({ client, priority: 'speed' })

// The classifier answers when it is confident (probability >= 0.95), the LLM decides the rest
const balancedZai = zai.with({ priority: 'moderate' })

// LLM only: written explanations, slower and more expensive
const carefulZai = zai.with({ priority: 'accuracy' })
```

The LLM always answers when examples are given (the classifier cannot learn from them), when the input is over the
classifier's limits, and when the classifier is unavailable. Use `classifier` to pin the classification model chain
(by default the backend chooses).

### Service tier

```typescript
// 'fast' requests the provider's low-latency tier (OpenAI: ~25-30% faster, ~2-3x the token price).
// Default: 'fast' with priority 'speed' (the default), 'standard' otherwise
const zai = new Zai({ client, serviceTier: 'standard' })
```

### Reasoning effort

```typescript
// Sent on every LLM call; omit it to use each model's default
const zai = new Zai({ client, reasoningEffort: 'low' }) // 'none' | 'low' | 'medium' | 'high' | 'dynamic'
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
- `.classify(content | items, labels, options?)` - Pick exactly one label (per item)
- `.rewrite(content, instruction, options?)` - Transform text
- `.filter(items, condition, options?)` - Filter array items
- `.group(items, options?)` - Organize items into categories
- `.rate(items, instructions, options?)` - Rate items on 1-5 scale
- `.sort(items, instructions, options?)` - Order items with natural language
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
