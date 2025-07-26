import { readFile } from 'node:fs/promises'
import { z } from '@botpress/sdk'
import { workflow } from '@bpinternal/workflow'
import { glob } from 'glob'

export const processFile = workflow({
  name: 'processFile',
  input: z.object({
    file: z.string(),
  }),
  output: z.object({
    fileId: z.string(),
    fileUrl: z.string(),
  }),
  run: async ({ step, input, ctx }) => {
    const file = await step(`Process file ${input.file}`, async () => {
      const content = await readFile(input.file)

      const { file } = await ctx.client.uploadFile({
        key: `folder/${input.file}`,
        content,
        contentType: 'application/pdf',
        publicContentImmediatelyAccessible: true,
        accessPolicies: ['public_content'],
      })

      return file
    })

    return { fileId: file.id, fileUrl: file.url }
  },
})

export const basicFlow = workflow({
  name: 'basic',
  input: z.object({}),
  output: z.object({}),
  run: async ({ step, ctx, wait }) => {
    setTimeout(() => ctx.abort(), 2000)

    const files = await step('List files', async () => glob('files/**/*.pdf'))

    const workflowIds = []

    for (const file of files) {
      const w = await step(
        `Process ${file}`,
        () =>
          processFile.start({
            client: ctx.client,
            parentWorkflowId: ctx.workflow.id,
            input: {
              file,
            },
          }),
        {
          maxAttempts: 3,
        }
      )

      workflowIds.push(w.id)
    }

    await wait.allChildren({
      failOnChildFailure: true,
    })

    for (const workflowId of workflowIds) {
      await wait.forWorkflow(`Wait for workflow to complete ${workflowId}`, { workflowId })
    }

    console.log('Workflows completed')

    return {}
  },
})
