import { readFile } from 'node:fs/promises'
import { z } from '@botpress/sdk'
import { workflow } from '@bpinternal/workflow'
import { glob } from 'glob'
import crypto from 'crypto'

export const processFile = workflow({
  name: 'processFile',
  input: z.object({
    i: z.number(),
    file: z.string(),
  }),
  output: z.object({
    fileHash: z.string(),
  }),
  run: async ({ step, input, client, ctx }) => {
    // Delay random between 0 and 1 second
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000))

    const fileHash = await step(`Process file ${input.file}`, async () => {
      const content = await readFile(input.file)

      const hash = crypto.createHash('sha256').update(content).digest('hex')

      return hash
    })

    return { fileHash }
  },
})

export const basicFlow = workflow({
  name: 'basic',
  input: z.object({}),
  output: z.object({}),
  run: async ({ step, ctx, wait }) => {
    // console.log(`Execution count: ${ctx.state.executionCount}`)
    // setTimeout(() => ctx.abort(), 500)

    const files = await step('List files', async () => glob('files/**/*.pdf'))

    const workflows = await step.map('Process files', files, async (file, { i }) => {
      // wait for 1 second
      // await new Promise((resolve) => setTimeout(resolve, 200))

      const w = await processFile.start({
        client: ctx.client,
        parentWorkflowId: ctx.workflow.id,
        input: {
          i,
          file,
        },
      })

      return w
    })

    for (const workflow of workflows) {
      await wait.forWorkflow(`Wait for workflow to complete ${workflow.id}`, { workflowId: workflow.id })
    }

    console.log('Workflows completed')

    return {}
  },
})
