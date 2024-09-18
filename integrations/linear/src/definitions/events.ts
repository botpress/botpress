import { IntegrationDefinitionProps } from '@botpress/sdk'
import { issueEventSchema, targets } from '../definitions/schemas'

const issueCreated = {
  title: 'Issue Created',
  schema: issueEventSchema.extend({
    targets,
  }),
  ui: {},
}

const issueUpdated = {
  title: 'Issue Updated',
  schema: issueEventSchema.extend({
    targets,
  }),
  ui: {},
}

export const events = {
  issueCreated,
  issueUpdated,
} satisfies IntegrationDefinitionProps['events']
