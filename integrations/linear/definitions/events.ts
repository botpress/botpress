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

const issueDeleted = {
  title: 'Issue Deleted',
  description: 'Triggered when an issue is deleted',
  schema: issueEventSchema.omit({ userId: true, conversationId: true }),
} as const satisfies EventDefinition

export const events = {
  issueCreated,
  issueUpdated,
  issueDeleted,
} as const satisfies IntegrationDefinitionProps['events']
