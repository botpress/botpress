## Intro

## Installation

```sh
# The core library
npm install llmz

# Dependencies
npm install @botpress/client
```

## Getting Started

```js
import { execute } from 'llmz'
import { Client } from '@botpress/client'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID,
  token: process.env.BOTPRESS_TOKEN,
})

const result = await execute({
  client,
  instructions: 'Return the value of 2 + 4.',
})

console.log(result.output) // Will print "6"
```

## LLMz vs Tool Calling

## LLMz vs MCP

## Examples

## Chat Mode

### Message types

## Worker Mode

## LLM Compatibility

## Code execution

#### Security Disclaimer / Sandbox

### Tools

### Objects

### Variables

## Dynamic Parameters

### Working with long-lived executions (Snapshots)

## Browser compatibility

## Tracing & Debugging

## Hooks

## Using LLMz with Botpress
