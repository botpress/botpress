import { EventDefinition, z } from '@botpress/sdk'

// Base event schema that all Attio events share
const baseEventSchema = z.object({
  event_type: z.string().title('Event Type').describe('The type of event'),
  id: z.object({
    workspace_id: z.string().title('Workspace ID').describe('The workspace identifier'),
    object_id: z.string().title('Object ID').describe('The object identifier'),
    record_id: z.string().title('Record ID').describe('The record identifier'),
  }),
  actor: z.object({
    type: z.string().title('Actor Type').describe('The type of actor (e.g., workspace-member)'),
    id: z.string().title('Actor ID').describe('The actor identifier'),
  }),
})

// Webhook payload schema
export const webhookPayloadSchema = z.object({
  webhook_id: z.string().title('Webhook ID').describe('The webhook identifier'),
  events: z.array(baseEventSchema).title('Events').describe('Array of events'),
})

const recordCreated = {
  title: 'Record Created',
  description: 'A new record has been created in Attio',
  schema: baseEventSchema,
}

const recordUpdated = {
  title: 'Record Updated',
  description: 'A record has been updated in Attio',
  schema: baseEventSchema,
}

const recordDeleted = {
  title: 'Record Deleted',
  description: 'A record has been deleted in Attio',
  schema: baseEventSchema,
}

export const events = {
  recordCreated,
  recordUpdated,
  recordDeleted,
} as const satisfies Record<string, EventDefinition>
