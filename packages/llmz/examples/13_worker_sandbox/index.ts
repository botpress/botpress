import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Tool } from 'llmz'

import { printTrace } from '../utils/debug'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

let startedAt: number
const controller = new AbortController()

const wait = new Tool({
  name: 'wait',
  description: 'pauses the execution for a given number of milliseconds',
  input: z.object({
    ms: z.number().min(0, 'The number of milliseconds must be a positive integer'),
  }),
  async handler(input) {
    // Abort after 5 seconds
    setTimeout(() => controller.abort('5 seconds elasped'), 1000 * 5)
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), input.ms)
    })
  },
})

const checkin = new Tool({
  name: 'checkin',
  description: 'must call after every 2 seconds',
  async handler() {
    console.log(`Checkin at ${Date.now() - startedAt}ms`)
  },
})

const result = await execute({
  instructions: `console.log the number 1 to 10,000 in a for loop, pausing for 500 milliseconds between each number. Make sure to comment the code very well. Checkin when appropriate.`,
  tools: [wait, checkin],
  client,
  // The signal will be used to abort the execution after 5 seconds
  signal: controller.signal,
  onTrace: ({ trace }) => {
    printTrace(trace)
    if (trace.type === 'llm_call_success') {
      startedAt = Date.now()
    }
  },
  options: {
    loop: 10,
  },
})

console.log('Execution finished')
console.log('Last iteration:', result.iteration?.status)
