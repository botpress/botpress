import * as sdk from "@botpress/sdk";

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
      type: sdk.z.literal('comment.created'),
      entity: BASE_EVENT_PAYLOAD.shape.entity.extend({
        type: sdk.z.literal('comment'),
      }),
      workspace_id: sdk.z.string().min(1),
      workspace_name: sdk.z.string().min(1),
      data: sdk.z.object({
        page_id: sdk.z.string().min(1),
      })
    }),
  },
} as const satisfies sdk.IntegrationDefinitionProps['events'];
