import { IntegrationDefinitionProps } from '@botpress/sdk'
import z from 'zod'

import { INTEGRATION_NAME } from '../const'
import { TargetsSchema } from './schemas'

export type PullRequestOpened = z.infer<typeof pullRequestOpened.schema>
export type PullRequestMerged = z.infer<typeof pullRequestMerged.schema>

const pullRequestOpened = {
  schema: z.object({
    type: z.literal(`${INTEGRATION_NAME}:pullRequestOpened`).optional(),
    id: z.number(),
    title: z.string(),
    content: z.string(),
    baseBranch: z.string().optional(),
    userId: z.string().optional(),
    conversationId: z.string().optional(),
    targets: TargetsSchema,
  }),
  ui: {},
}

export const pullRequestMerged = {
  schema: z.object({
    type: z.literal(`${INTEGRATION_NAME}:pullRequestMerged`).optional(),
    id: z.number(),
    title: z.string(),
    content: z.string(),
    baseBranch: z.string().optional(),
    userId: z.string().optional(),
    conversationId: z.string().optional(),
    targets: TargetsSchema,
  }),
  ui: {},
}

export const events = {
  pullRequestOpened,
  pullRequestMerged,
} satisfies IntegrationDefinitionProps['events']
