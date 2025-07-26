import { BotDefinition, z } from '@botpress/sdk'
export default new BotDefinition({
  actions: {
    start: {
      input: {
        schema: z.object({
          name: z.string(),
        }),
      },
      output: {
        schema: z.object({
          workflowId: z.string(),
        }),
      },
    },
  },
  workflows: {
    basic: {
      input: {
        schema: z.object({}),
      },
      output: {
        schema: z.object({}),
      },
    },
  },
})
