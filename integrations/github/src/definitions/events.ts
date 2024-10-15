import { z, ZodTypeAny } from '@botpress/sdk'
import * as sdk from '@botpress/sdk'
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

    // The following fields have been kept for backwards compatibility.
    // TODO: Remove these fields in the next major version :
    type: z.literal('github:pullRequestOpened').optional().title('DEPRECATED: type'),
    id: z.number().title('DEPRECATED: id').describe('use pullRequest.id instead'),
    title: z.string().title('DEPRECATED: title').describe('use pullRequest.name instead'),
    content: z.string().title('DEPRECATED: content').describe('use pullRequest.body instead'),
    baseBranch: z.string().optional().title('DEPRECATED: baseBranch').describe('use pullRequest.source.ref instead'),
    userId: z.string().optional().title('DEPRECATED: userId').describe('use pullRequest.author.id instead'),
    conversationId: z
      .string()
      .optional()
      .title('DEPRECATED: conversationId')
      .describe('use the conversation id associated with the event instead'),
    targets: z
      .object({
        pullRequest: z.string().optional().title('DEPRECATED: pullRequest').describe('use pullRequest.number instead'),
        issue: z.string().optional().title('DEPRECATED: issue'),
        discussion: z.string().optional().title('DEPRECATED: discussion'),
      })
      .title('DEPRECATED: targets'),
  }),
} as const satisfies sdk.EventDefinition

export const pullRequestMerged = {
  title: 'Pull Request merged',
  description: 'Triggered when a pull request is merged',
  schema: z.object({
    pullRequest: PullRequest.title('Pull Request').describe('The pull request that was merged'),
    ...COMMON_EVENT_FIELDS.sender,

    // The following fields have been kept for backwards compatibility.
    // TODO: Remove these fields in the next major version :
    type: z.literal('github:pullRequestMerged').optional().title('DEPRECATED: type'),
    id: z.number().title('DEPRECATED: id').describe('use pullRequest.id instead'),
    title: z.string().title('DEPRECATED: title').describe('use pullRequest.name instead'),
    content: z.string().title('DEPRECATED: content').describe('use pullRequest.body instead'),
    baseBranch: z.string().optional().title('DEPRECATED: baseBranch').describe('use pullRequest.source.ref instead'),
    userId: z.string().optional().title('DEPRECATED: userId').describe('use pullRequest.author.id instead'),
    conversationId: z
      .string()
      .optional()
      .title('DEPRECATED: conversationId')
      .describe('use the conversation id associated with the event instead'),
    targets: z
      .object({
        pullRequest: z.string().optional().title('DEPRECATED: pullRequest').describe('use pullRequest.number instead'),
        issue: z.string().optional().title('DEPRECATED: issue'),
        discussion: z.string().optional().title('DEPRECATED: discussion'),
      })
      .title('DEPRECATED: targets'),
  }),
} as const satisfies sdk.EventDefinition

export const issueOpened = {
  title: 'Issue opened',
  description: 'Triggered when an issue is opened',
  schema: z.object({
    issue: Issue.title('Issue').describe('The issue that was opened'),
    ...COMMON_EVENT_FIELDS.sender,

    // The following fields have been kept for backwards compatibility.
    // TODO: Remove these fields in the next major version :
    id: z.number().title('DEPRECATED: id').describe('use issue.id instead'),
    issueUrl: z.string().title('DEPRECATED: issueUrl').describe('use issue.url instead'),
    repoUrl: z.string().title('DEPRECATED: repoUrl').describe('use issue.repository.url instead'),
    number: z.number().title('DEPRECATED: number').describe('use issue.number instead'),
    title: z.string().title('DEPRECATED: title').describe('use issue.name instead'),
    content: z.string().nullable().title('DEPRECATED: content').describe('use issue.body instead'),
    repositoryName: z.string().title('DEPRECATED: repositoryName').describe('use issue.repository.name instead'),
    repositoryOwner: z
      .string()
      .title('DEPRECATED: repositoryOwner')
      .describe('use issue.repository.owner.handle instead'),
  }),
} as const satisfies sdk.EventDefinition

export const pullRequestReviewSubmitted = {
  title: 'Pull Request review submitted',
  description: 'Triggered when a review is submitted on a pull request',
  schema: z.object({
    review: PullRequestReview.title('Review').describe('The review that was submitted'),
    ...COMMON_EVENT_FIELDS.sender,
  }),
} as const satisfies sdk.EventDefinition

export const events = {
  issueOpened,
  pullRequestMerged,
  pullRequestOpened,
  pullRequestReviewSubmitted,
} as const satisfies sdk.IntegrationDefinitionProps['events']
