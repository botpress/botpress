import { EventDefinition, z } from '@botpress/sdk'

const recordCreated = {
  title: 'Record Created',
  description: 'A new record has been created in Attio',
  schema: z.object({
    event_type: z.literal('record.created'),
    id: z.object({
      workspace_id: z.string(),
      object_id: z.string(),
      record_id: z.string(),
    }),
    actor: z.object({
      id: z.string().nullable(),
      type: z.string().nullable(),
    }),
  }),
}

export const events = {
  recordCreated,
} as const satisfies Record<string, EventDefinition>
