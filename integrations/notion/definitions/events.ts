import * as sdk from '@botpress/sdk'

export const BASE_EVENT_PAYLOAD = sdk.z.object({
  workspace_id: sdk.z.string().min(1),
  type: sdk.z.string().min(1),
  entity: sdk.z.object({
    type: sdk.z.enum(['page', 'block', 'database', 'comment']),
    id: sdk.z.string().min(1),
  }),
  data: sdk.z.object({}).passthrough(),
})

export const events = {
  commentCreated: {
    title: 'Comment Created',
    description: 'A comment was created in Notion',
    schema: BASE_EVENT_PAYLOAD.extend({
      type: sdk.z.literal('comment.created').title('Type').describe('The type of event'),
      entity: BASE_EVENT_PAYLOAD.shape.entity
        .extend({
          type: sdk.z.literal('comment'),
        })
        .title('Entity')
        .describe('The entity that the event is related to'),
      workspace_id: sdk.z.string().min(1).title('Workspace ID').describe('The ID of the Notion workspace'),
      workspace_name: sdk.z.string().min(1).title('Workspace Name').describe('The name of the Notion workspace'),
      data: sdk.z
        .object({
          page_id: sdk.z.string().min(1).title('Page ID').describe('The ID of the page the comment was created on'),
        })
        .title('Data')
        .describe('Additional data about the event'),
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['events']
