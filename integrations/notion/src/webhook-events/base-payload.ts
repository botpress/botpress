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
