import { z } from '@botpress/sdk'

const ENTITY = (name: string = 'entity') =>
  ({
    id: z.number().title('ID').describe(`Unique identifier of the ${name}`),
    nodeId: z.string().title('Global Node ID').describe('Node ID for GraphQL'),
    url: z.string().title('URL').describe(`URL of the ${name}`),
  }) as const

const NAMED_ENTITY = (name: string = 'entity') =>
  ({
    ...ENTITY(name),
    name: z.string().title('Name').describe(`Name of the ${name}`),
  }) as const

const USER_OR_ORG = (name: string = 'user') =>
  ({
    ...NAMED_ENTITY(name),
    handle: z.string().title('Handle').describe(`The handle of the ${name}`),
    botpressUser: z
      .string()
      .title('Botpress User ID')
      .describe(`The ID of the Botpress user corresponding to this ${name}`),
  }) as const

const USER = USER_OR_ORG('user')

const REPOSITORY = {
  ...NAMED_ENTITY('repository'),
  owner: z.object(USER_OR_ORG('repository owner')).title('Owner').describe('The owner of the repository'),
} as const

const REPOSITORY_BRANCH = {
  ref: z.string().title('Branch name').describe('The name of the branch'),
  label: z.string().title('Branch label').describe('The display label of the branch'),
  repository: z.object(REPOSITORY).title('Repository').describe('The repository the branch belongs to'),
} as const

const LABEL = NAMED_ENTITY('label')

const REPOSITORY_SUBENTITY = (name: string = 'entity') =>
  ({
    ...NAMED_ENTITY(name),
    repository: z.object(REPOSITORY).title('Repository').describe(`The repository the ${name} belongs to`),
    body: z.string().title('Body').describe(`The body of the ${name}`),
    number: z.number().title('Number').describe(`The ${name} number`),
    labels: z.array(z.object(LABEL)).title('Labels').describe(`The labels associated with the ${name}`),
    author: z.object(USER_OR_ORG('author')).title('Author').describe(`The author of the ${name}`),
  }) as const

const ISSUE_OR_PR = (name: string = 'issue') =>
  ({
    ...REPOSITORY_SUBENTITY(name),
    assignees: z
      .array(z.object(USER_OR_ORG('assignee')))
      .title('Assignees')
      .describe(`The assignees of the ${name}`),
  }) as const

const ISSUE = ISSUE_OR_PR('issue')

const PULL_REQUEST = {
  ...ISSUE_OR_PR('pull request'),
  target: z.object(REPOSITORY_BRANCH).title('Target').describe('The target repository and branch of the pull request'),
  source: z.object(REPOSITORY_BRANCH).title('Source').describe('The source repository and branch of the pull request'),
} as const

const DISCUSSION = {
  ...REPOSITORY_SUBENTITY('discussion'),
  category: z.object(NAMED_ENTITY('category')).title('Category').describe('The category of the discussion'),
} as const

const PULL_REQUEST_REVIEW_STATES = ['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED'] as const

const PULL_REQUEST_REVIEW = {
  ...ENTITY('pull request review'),
  pullRequest: z.object(PULL_REQUEST).title('Pull Request').describe('The pull request being reviewed'),
  commitId: z.string().title('Commit ID').describe('The commit ID of the review'),
  state: z.enum(PULL_REQUEST_REVIEW_STATES).title('State').describe('The state of the review'),
  author: z.object(USER_OR_ORG('review author')).title('Author').describe('The author of the review'),
  body: z.string().title('Body').describe('The body of the review'),
} as const

export const User = z.object(USER)
export type User = z.infer<typeof User>

export const Repository = z.object(REPOSITORY)
export type Repository = z.infer<typeof Repository>

export const PullRequest = z.object(PULL_REQUEST)
export type PullRequest = z.infer<typeof PullRequest>

export const Issue = z.object(ISSUE)
export type Issue = z.infer<typeof Issue>

export const Label = z.object(LABEL)
export type Label = z.infer<typeof Label>

export const Discussion = z.object(DISCUSSION)
export type Discussion = z.infer<typeof Discussion>

export const PullRequestReview = z.object(PULL_REQUEST_REVIEW)
export type PullRequestReview = z.infer<typeof PullRequestReview>
