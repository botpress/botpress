import { exit } from 'node:process'
import { Client } from '@botpress/client'
import { z } from '@botpress/sdk'
import { step, workflow } from '../../src'

const main = async () => {
  const client = new Client({
    botId: 'e682d427-e536-4ae3-8e21-e7500dfc43cf',
    token: 'bp_pat_jUYnQRWTYw1ZAETDdDSOUrTDVaaKYJqPH9ty',
  })

  const flow = workflow({
    name: 'basic',
    input: z.object({}),
    output: z.object({}),
    run: async ({ ctx, input }) => {
      console.log('workflow ID:', ctx.workflow.id)
      console.log('input:', input)

      const arr = await step('List needed sub-tasks', async () => {
        console.log('RUN 1')
        return ['task1', 'task2', 'task3']
      })

      if (ctx.state.executionCount <= 1) {
        console.log('exiting after 1st step')
        exit(0)
      }

      console.log(ctx.state.executionCount)

      for (const item of arr) {
        await step(`Do ${item}`, async () => {
          if (ctx.state.executionCount <= 3) {
            throw new Error('test')
          }

          console.log('RUN 2: ', item)
        })
      }

      if (ctx.state.executionCount <= 2) {
        console.log('exiting after 2nd step')
        exit(0)
      }

      const b = await step('After the loop', async () => {
        console.log('RUN 3: after loop')
        return 'b'
      })

      const c = await step('FINAL', async () => {
        console.log('RUN 4: final')
        return 'c'
      })

      return b + c
    },
  })

  const result = await flow.run({
    client: client as any,
    input: {
      name: 'John',
    },
  })

  console.log('Final Result:', result)
}

void main()
