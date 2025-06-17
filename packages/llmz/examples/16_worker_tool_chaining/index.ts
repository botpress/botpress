import { Client } from '@botpress/client'
import { z } from '@bpinternal/zui'
import { execute, Exit, Tool } from 'llmz'
import { box } from '../utils/box'
import chalk from 'chalk'

const client = new Client({
  botId: process.env.BOTPRESS_BOT_ID!,
  token: process.env.BOTPRESS_TOKEN!,
})

// Tool C requires output from Tool A + filtered output from Tool B
// All these tool calls will be executed in a single turn
// LLMz is aware of the output schemas, and can chain tool calls in a single LLM turn
// Because it generates code, it can also handle complex logic and conditions between tool calls

const ToolA = new Tool({
  name: 'tool_a',
  output: z.object({
    pick: z.object({
      deep: z.object({
        deep_number: z.number(),
      }),
    }),
  }),
  async handler() {
    const deep_number = Math.floor(Math.random() * 100)
    console.log('Tool A executed, returning number:', deep_number)
    return {
      pick: {
        deep: {
          deep_number,
        },
      },
    }
  },
})

const ToolB = new Tool({
  name: 'tool_b',
  output: z.number().array(),
  async handler() {
    const array = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100))
    console.log('Tool B executed, returning array:', array)
    return array
  },
})

const ToolC = new Tool({
  name: 'tool_c',
  input: z.object({
    first_task: z.number().describe('Number from tool A'),
    second_task: z.number().array().describe('Numbers from tool B that are greater than 50'),
  }),
  output: z.number().describe("The 'secret' number"),
  async handler({ first_task, second_task }) {
    console.log('Tool C executed with input:', { first_task, second_task })
    return first_task + second_task.reduce((acc, num) => acc + num, 0)
  },
})

const exit = new Exit({
  name: 'exit',
  description: 'Exit the program',
  schema: z.object({
    result: z.number(),
  }),
})

const result = await execute({
  instructions: `I need the 'secret' number please. Do not think, try to do it in one step.`,
  tools: [ToolA, ToolB, ToolC],
  exits: [exit],
  client,
})

if (result.is(exit)) {
  console.log(
    box([
      'The LLM wrote the code to solve the problem:',
      ...result.iteration.code!.split('\n'),
      '',
      'It then executed it and returned the result:',
      chalk.cyan.bold(result.output.result),
    ])
  )
}
