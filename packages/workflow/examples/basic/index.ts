import { Client } from '@botpress/client'
import { exit } from 'process'
import { step, workflow } from '../../src'
import { getContext } from '../../src/context'

const main = async () => {
  const client = new Client({
    botId: 'e682d427-e536-4ae3-8e21-e7500dfc43cf',
    token: 'bp_pat_KRIiUjqCzn7zAyHyDYO8j03XNlgHNvBOV4Ga',
  })

  const result = await workflow({
    client,
    name: 'basic',
    run: async () => {
      const context = getContext()
      console.log('workflow ID:', context.workflow.id)

      const arr = await step('List needed sub-tasks', async () => {
        console.log('RUN 1')
        return ['task1', 'task2', 'task3']
      })

      if (context.state.executionCount <= 1) {
        console.log('exiting after 1st step')
        exit(0)
      }

      for (const item of arr) {
        await step(`Do ${item}`, async () => {
          console.log('RUN 2: ', item)
        })
      }

      if (context.state.executionCount <= 2) {
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

  console.log('Final Result:', result)
}

void main()
