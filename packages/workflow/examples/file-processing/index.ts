import { Client } from '@botpress/client'
import glob from 'glob'
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
    name: 'file-processing',
    run: async () => {
      const context = getContext()
      console.log('workflow ID:', context.workflow.id)

      const arr = await step('List all files', async () => {
        const files = glob('files/**/*.pdf')
        return files
      })

      console.log('files:', arr)
    },
  })

  console.log('Final Result:', result)
}

void main()
