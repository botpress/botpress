import { IntegrationDefinitionProps } from '@botpress/sdk'
import { z } from 'zod'
import { LinearIssue, targets } from '../definitions/schemas'

export type IssueCreated = z.infer<typeof issueCreated.schema>
export type IssueUpdated = z.infer<typeof issueUpdated.schema>

const issueCreated = {
  title: 'Issue Created',
  schema: LinearIssue.extend({
    targets,
  }),
  ui: {},
}

const issueUpdated = {
  title: 'Issue Updated',
  schema: LinearIssue.extend({
    targets,
  }),
  ui: {},
}

export const events = {
  issueCreated,
  issueUpdated,
} satisfies IntegrationDefinitionProps['events']
