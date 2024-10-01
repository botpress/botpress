import { z, IntegrationDefinitionProps, EventDefinition, ZodTypeAny } from '@botpress/sdk'
import { Issue, PullRequest, User, PullRequestReview } from './entities'

const COMMON_EVENT_FIELDS = {
  sender: {
    eventSender: User.title('Sender').describe('The user who triggered the event'),
  },
} as const satisfies Record<string, Record<string, ZodTypeAny>>

const pullRequestOpened = {
  title: 'Pull Request opened',
  description: 'Triggered when a pull request is opened',
  schema: z.object({
    pullRequest: PullRequest.title('Pull Request').describe('The pull request that was opened'),
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies EventDefinition

export const pullRequestMerged = {
  title: 'Pull Request merged',
  description: 'Triggered when a pull request is merged',
  schema: z.object({
    pullRequest: PullRequest.title('Pull Request').describe('The pull request that was merged'),
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies EventDefinition

export const issueOpened = {
  title: 'Issue opened',
  description: 'Triggered when an issue is opened',
  schema: z.object({
    issue: Issue.title('Issue').describe('The issue that was opened'),
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies EventDefinition

export const pullRequestReviewSubmitted = {
  title: 'Pull Request review submitted',
  description: 'Triggered when a review is submitted on a pull request',
  schema: z.object({
    review: PullRequestReview.title('Review').describe('The review that was submitted'),
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies EventDefinition

export const events = {
  issueOpened,
  pullRequestMerged,
  pullRequestOpened,
  pullRequestReviewSubmitted,
} as const satisfies IntegrationDefinitionProps['events']
