# Zai 🤖

> **Zui AI (zai)** – A powerful LLM utility library that makes AI operations simple, intuitive, and production-ready.

[![npm version](https://badge.fury.io/js/@botpress%2Fzai.svg)](https://badge.fury.io/js/@botpress%2Fzai)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

Zai provides a clean, type-safe API for common AI operations like text generation, extraction, classification, and more. Built on top of [**Zui**](https://www.npmjs.com/package/@bpinternal/zui) and the Botpress API, it's designed to be both powerful and easy to use.

## ✨ Features

- 🎯 **Simple API** - One-liner operations for common AI tasks
- 🔒 **Type Safety** - Full TypeScript support with Zod schemas
- 🧠 **Active Learning** - Learn from examples and improve over time
- ⚡ **Performance** - Optimized for production with caching and retries
- 🎨 **Flexible** - Works with any text, objects, or structured data
- 🔄 **Streaming** - Real-time progress updates for long operations
- ♾️ **Infinite Tokens** - Handle documents of any size with automatic chunking and parallelization

## 🚀 Quick Start

Install dependencies:

```bash
npm install @botpress/client @bpinternal/zui
```

Install Zai:

```bash
npm install @botpress/zai
```

Using Zai:

```typescript
import { Client } from '@botpress/client'
import { Zai } from '@botpress/zai'
import { z } from '@bpinternal/zui'

const client = new Client({ botId: '<Bot ID>', token: '<Your Botpress API Token>' })

// Initialize with your Botpress client
const zai = new Zai({ client })

// Start using AI operations immediately!
const person = await zai.extract(
  'John Doe is 30 years old and lives in New York',
  z.object({
    name: z.string(),
    age: z.number(),
    location: z.string(),
  })
)

// person: { name: "John Doe", age: 30, location: "New York" }
```

## 🎯 Core Operations

### 📝 Text Generation

Generate text content based on prompts and instructions.

```typescript
text(prompt: string, options?: Options): Response<string>
```

#### Usage

```typescript
// Generate a story
const story = await zai.text('Write a short horror story about a haunted house')

// Generate with length constraints (~500 tokens)
const summary = await zai.text('Summarize quantum physics', { length: 500 })

// Generate structured content
const blogPost = await zai.text('Write a blog post about AI trends in 2024', {
  instructions: 'Include a title, introduction, 3 main points, and conclusion',
})
```

### ✅ Check & Validation

Verify if content matches specific criteria with boolean responses.

```typescript
check(input: any, condition: string, options?: Options): Response<boolean>
```

#### Usage

```typescript
// Simple boolean checks
const isEnglish = await zai.check('Hello world!', 'is written in English')
const isPositive = await zai.check('This product is amazing!', 'expresses positive sentiment')

// Check with examples for better accuracy
const isCompetitor = await zai.check('OpenAI', 'competes with our AI platform', {
  examples: [
    { input: 'Microsoft', check: true, reason: 'Microsoft has AI products' },
    { input: "McDonald's", check: false, reason: "McDonald's is a restaurant chain" },
  ],
})
```

### 🔍 Data Extraction

Extract structured data from text or objects using Zui schemas.

```typescript
extract<T>(input: any, schema: z.ZodType<T>, options?: Options): Response<T>
```

#### Usage

```typescript
// Extract person information
const person = await zai.extract(
  'John Doe is 30 years old and lives in New York',
  z.object({
    name: z.string(),
    age: z.number(),
    location: z.string(),
  })
)
// Result: { name: "John Doe", age: 30, location: "New York" }

// Extract multiple items
const products = await zai.extract('We sell laptops, phones, and tablets', z.array(z.string().describe('Product name')))
// Result: ["laptops", "phones", "tablets"]

// Extract from complex objects
const user = await zai.extract(
  { profile: { name: 'Alice', age: 25 }, posts: ['Hello', 'World'] },
  z.object({
    fullName: z.string().describe("The user's full name"),
    postCount: z.number().describe('Number of posts'),
  })
)
// Result: { fullName: "Alice", postCount: 2 }
```

### 🏷️ Labeling & Classification

Apply multiple boolean labels to content based on criteria.

```typescript
label(input: any, labels: Record<string, string>, options?: Options): Response<Record<string, boolean>>
```

#### Usage

```typescript
// Label content with multiple criteria
const labels = await zai.label('This laptop has great battery life and runs fast, but the screen could be brighter', {
  is_positive: 'does the review express positive sentiment?',
  mentions_performance: 'does the review discuss performance/speed?',
  mentions_battery: 'does the review mention battery life?',
  has_criticism: 'does the review include any criticism or complaints?',
})
// Result: { is_positive: true, mentions_performance: true, mentions_battery: true, has_criticism: true }
```

### 🔄 Text Transformation

Transform text content according to specific instructions.

```typescript
rewrite(input: string, instruction: string, options?: Options): Response<string>
```

#### Usage

```typescript
// Simple transformations
const caps = await zai.rewrite('hello world', 'convert to uppercase')
// Result: "HELLO WORLD"

const french = await zai.rewrite('Hello, how are you?', 'translate to French')
// Result: "Bonjour, comment allez-vous ?"

// Style transformations
const formal = await zai.rewrite("Hey there! How's it going?", 'rewrite in formal business tone')

// Length-constrained transformations
const summary = await zai.rewrite('A very long text that needs to be shortened...', 'summarize in one sentence', {
  length: 50,
})
```

### 📊 Filtering

Filter an array of items based on a natural language condition.

```typescript
filter<T>(input: Array<T>, condition: string, options?: Options): Response<Array<T>>
```

#### Usage

```typescript
// Filter people by criteria
const goodPeople = await zai.filter(
  [
    { name: 'John', description: 'donates to charity' },
    { name: 'Alice', description: 'helps neighbors' },
    { name: 'Bob', description: 'commits crimes' },
  ],
  'are generally good people'
)
// Result: [{ name: 'John', description: 'donates to charity' }, { name: 'Alice', description: 'helps neighbors' }]

// Filter with examples
const competitors = await zai.filter(['OpenAI', "McDonald's", 'Google', 'Starbucks'], 'compete with our AI platform', {
  examples: [
    { input: 'Microsoft', filter: true, reason: 'Has AI products' },
    { input: 'Walmart', filter: false, reason: 'Retail company' },
  ],
})
// Result: ['OpenAI', 'Google']
```

### 📋 Summarization

Create concise summaries of long documents with progress tracking.

```typescript
summarize(input: string, options?: Options): Response<string>
```

#### Usage

```typescript
// Basic summarization
const summary = await zai.summarize(longDocument, {
  length: 1000,
  prompt: 'Create a concise summary focusing on key points',
})

// With progress tracking
let progress = 0
const detailedSummary = await zai
  .summarize(veryLongDocument, {
    length: 2000,
    prompt: 'Extract main topics and create a structured summary',
  })
  .on('progress', () => {
    progress++
    console.log(`Processing chunk ${progress}...`)
  })
```

## 🧠 Active Learning

Zai can learn from examples to improve accuracy over time:

```typescript
// Enable active learning
const zai = new Zai({
  client: yourBotpressClient,
  activeLearning: {
    enable: true,
    tableName: 'MyLearningTable',
    taskId: 'sentiment-analysis',
  },
})

// The system will automatically save examples and learn from them
const sentiment = await zai.learn('sentiment-analysis').check('This product is amazing!', 'has positive sentiment')

// Later, the same check will be more accurate based on learned examples
```

## ⚙️ Configuration

### Basic Setup

```typescript
import { Zai } from '@botpress/zai'

const zai = new Zai({
  client: yourBotpressClient, // Required: Your Botpress client
  userId: 'user123', // Optional: User ID for tracking
  modelId: 'best', // Optional: 'best', 'fast', or specific model
  namespace: 'my-app', // Optional: Namespace for active learning
  activeLearning: {
    // Optional: Enable active learning
    enable: true,
    tableName: 'LearningTable',
    taskId: 'default',
  },
})
```

### Model Selection

```typescript
// Use the best available model (default)
const zai = new Zai({ client, modelId: 'best' })

// Use the fastest model
const zai = new Zai({ client, modelId: 'fast' })

// Use a specific model
const zai = new Zai({ client, modelId: 'anthropic:claude-3-sonnet' })
```

### Advanced Configuration

```typescript
// Create a specialized instance
const specializedZai = zai.with({
  modelId: 'fast',
  activeLearning: {
    enable: true,
    tableName: 'SpecializedTable',
    taskId: 'customer-support',
  },
})

// Chain operations with different configurations
const result = await zai
  .with({ modelId: 'best' })
  .extract(data, schema)
  .then((extracted) => zai.with({ modelId: 'fast' }).check(extracted, 'is valid'))
```

## 🔧 Error Handling & Retries

Zai automatically handles common issues:

```typescript
// Automatic retries on generation failures
const result = await zai.check('Some text', 'meets criteria')
// Will retry up to 3 times if the model fails

// Manual abort for long operations
const request = zai.summarize(veryLongDocument, { length: 5000 })
setTimeout(() => request.abort('User cancelled'), 5000)

// Using AbortController
const controller = new AbortController()
const request = zai.extract(data, schema).bindSignal(controller.signal)
controller.abort('Cancelled')
```

## 📊 Usage Tracking

Get detailed usage information:

```typescript
// Get usage stats with results
const { output, usage } = await zai.check('Some text', 'is valid').result()

console.log('Requests made:', usage.requests.requests)
console.log('Responses received:', usage.requests.responses)
console.log('Result:', output.value)
console.log('Explanation:', output.explanation)
```

## 🎯 Best Practices

### 1. Use Clear Instructions

```typescript
// Good
await zai.check(text, 'is a positive customer review')

// Better
await zai.check(text, 'expresses satisfaction with the product or service')
```

### 2. Provide Examples for Complex Tasks

```typescript
await zai.check(company, 'competes with our platform', {
  examples: [
    { input: 'OpenAI', check: true, reason: 'AI platform provider' },
    { input: "McDonald's", check: false, reason: 'Restaurant chain' },
  ],
})
```

### 3. Use Appropriate Schemas for Extraction

```typescript
// Use descriptive field names
const schema = z.object({
  customerName: z.string().describe('The full name of the customer'),
  issueType: z.string().describe('The type of support issue'),
  priority: z.enum(['low', 'medium', 'high']).describe('Issue priority level'),
})
```

### 4. Enable Active Learning for Production

```typescript
const zai = new Zai({
  client: yourBotpressClient,
  activeLearning: {
    enable: true,
    tableName: 'ProductionLearningTable',
    taskId: 'customer-support-classification',
  },
})
```

## 🔗 Links

- [Botpress Platform](https://botpress.com)
- [Zui Library](https://www.npmjs.com/package/@bpinternal/zui)

---

Made with ❤️ by the Botpress team
