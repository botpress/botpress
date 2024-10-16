import { EventDefinition, IntegrationDefinitionProps } from '@botpress/sdk'
import { issueEventSchema, targets } from './schemas'

const issueCreated = {
  title: 'Issue Created',
  description: 'Triggered when an issue is created',
  schema: issueEventSchema.extend({
    targets: targets.title('Created Issue').describe('The issue that was created'),
  }),
} as const satisfies EventDefinition

const issueUpdated = {
  title: 'Issue Updated',
  description: 'Triggered when an issue is updated',
  schema: issueEventSchema.extend({
    targets: targets.title('Updated Issue').describe('The issue that was updated'),
  }),
} as const satisfies EventDefinition

export const events = {
  issueCreated,
  issueUpdated,
} as const satisfies IntegrationDefinitionProps['events']
