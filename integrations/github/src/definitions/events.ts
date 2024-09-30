import { z, IntegrationDefinitionProps, EventDefinition, ZodTypeAny } from '@botpress/sdk'
import { Issue, PullRequest, User } from './entities'

const COMMON_EVENT_FIELDS = {
  sender: {
    eventSender: User.title('Sender').describe('The user who triggered the event'),
  },
} as const satisfies Record<string, Record<string, ZodTypeAny>>

const pullRequestOpened = {
  schema: z.object({
    pullRequest: PullRequest,
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies EventDefinition

export const pullRequestMerged = {
  schema: z.object({
    pullRequest: PullRequest,
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies EventDefinition

export const issueOpened = {
  title: 'Issue opened',
  description: 'Triggered when an issue is opened',
  schema: z.object({
    issue: Issue,
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies EventDefinition

export const events = {
  pullRequestOpened,
  pullRequestMerged,
  issueOpened,
} satisfies IntegrationDefinitionProps['events']
