# 🚀 LLMz: Next-Gen TypeScript AI Agent Framework

**Build AI agents that think, code, and execute like humans—powered by TypeScript and battle-tested at massive scale.**

---

LLMz is the revolutionary framework behind [Botpress](https://botpress.com), empowering millions of AI agents across thousands of use cases worldwide. Unlike traditional tool-calling frameworks, LLMz leverages the massive body of TypeScript knowledge within LLMs, enabling agents to handle complex logic, loops, conditionals, and multi-tool orchestration seamlessly.

**Stop chaining tools. Start generating real code.**

---

## 📦 Quick Start

Install and start building agents in seconds:

```bash
npm install @botpress/client llmz
```

### ✨ Example

```typescript
import { Client } from '@botpress/client'
import { execute } from 'llmz'

const client = new Client({ botId: '...', token: '...' })

const result = await execute({
  instructions: 'What is the sum of integers between 14 and 1078 divisible by 3, 9, or 5?',
  client,
})

console.log(result.output) // 271575
```

**Instruction:**

```typescript
'What is the sum of integers between 14 and 1078 divisible by 3, 9, or 5?'
```

**LLMz generates and safely executes real TypeScript:**

```typescript
// Calculating the sum of all integers between 14 and 1078 divisible by 3, 9 or 5
let sum = 0

// Loop through numbers between 14 and 1078 (inclusive)
for (let i = 14; i <= 1078; i++) {
  if (i % 3 === 0 || i % 9 === 0 || i % 5 === 0) {
    sum += i // Add to sum if divisible by 3, 9, or 5
  }
}

// Return the final result
return { action: 'done', value: { success: true, result: sum } }
```

**Result:**

```json
{ "success": true, "result": 271575 }
```

---

## ⚡ Why LLMz Beats JSON Tool Calling

### Traditional JSON Tool Calling ❌

- Hard-to-parse JSON schemas for LLMs
- Incapable of complex logic, loops, and conditionals
- Multiple expensive roundtrips for each tool call
- Unreliable beyond simple scenarios

### LLMz TypeScript Generation ✅

- **Billions** of lines of TypeScript training data
- Native LLM thinking via comments and code structure
- Complex logic and multi-tool orchestration in **one call**
- Complete type safety and predictable schemas
- Scales effortlessly in production

---

## 🌟 Battle-Tested at Massive Scale

LLMz isn't experimental. It's been driving production workloads globally:

- **1+ year** in production
- **Millions** of active users
- **Hundreds of thousands** of deployed agents
