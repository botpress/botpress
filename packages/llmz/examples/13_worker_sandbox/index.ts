import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { setTimeout as delay } from 'node:timers/promises'
import { execute, Tool } from 'llmz'

const client = new Client({
  apiUrl: process.env.BOTPRESS_API_URL,
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})
const controller = new AbortController()
let timer: ReturnType<typeof setTimeout> | undefined
const wait = new Tool({
  name: 'wait',
  input: z.object({ ms: z.number().int().min(0).max(1000) }),
  handler: async ({ ms }) => {
    // Start once the first tool runs, so model latency does not consume the demonstration.
    timer ??= setTimeout(() => controller.abort(new Error('Five seconds elapsed')), 5000)
    await delay(ms, undefined, { signal: controller.signal })
  },
})

try {
  const result = await execute({
    model: process.env.BOTPRESS_MODEL ?? 'openai:gpt-5.6-luna',
    client,
    signal: controller.signal,
    tools: [wait],
    instructions:
      'In one JavaScript program, count from 1 to 100, logging each number and awaiting wait({ms:500}) each time, then complete.',
    options: { loop: 1, timeout: 60_000 },
  })
  console.log('Execution status:', result.status, result.iteration?.status)
} finally {
  clearTimeout(timer)
}
