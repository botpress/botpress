import { z, IntegrationDefinitionProps } from '@botpress/sdk'

import { TargetsSchema } from './schemas'

export type PullRequestOpened = z.infer<typeof pullRequestOpened.schema>
export type PullRequestMerged = z.infer<typeof pullRequestMerged.schema>
export type IssueOpened = z.infer<typeof issueOpened.schema>

const pullRequestOpened = {
  schema: z.object({
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

export const issueOpened = {
  title: 'Issue opened',
  description: 'Triggered when an issue is opened',
  schema: z
    .object({
      id: z.number(),
      issueUrl: z.string(),
      repoUrl: z.string(),
      number: z.number(),
      title: z.string(),
      content: z.string().nullable(),
      repositoryName: z.string(),
      repositoryOwner: z.string(),
    })
    .passthrough(),
} satisfies NonNullable<IntegrationDefinitionProps['events']>[string]

export const events = {
  pullRequestOpened,
  pullRequestMerged,
  issueOpened,
} satisfies IntegrationDefinitionProps['events']
