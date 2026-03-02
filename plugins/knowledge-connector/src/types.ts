import * as sdk from '@botpress/sdk'
import { CommonHandlerProps } from '@botpress/sdk/dist/plugin'
import * as models from '../definitions/models'
import type * as bp from '.botpress'

type TPlugin = sdk.DefaultPlugin<bp.TPlugin>

export type SyncQueueItem = models.FileWithPath & {
  status: 'pending' | 'newly-synced' | 'already-synced' | 'errored'
  errorMessage?: string
  addToKbId?: string
}
export type SyncQueue = SyncQueueItem[]

export type CommonProps = CommonHandlerProps<TPlugin>

export type FilesApiFile = {
  id: string
  tags: Record<string, string>
}

export type Workflow = Awaited<ReturnType<bp.Client['listWorkflows']>>['workflows'][number]

export const QUEUE_ITEM_SCHEMA = models.FILE_WITH_PATH.extend({
  status: sdk.z.enum(['pending', 'newly-synced', 'already-synced', 'errored']),
  errorMessage: sdk.z.string().optional(),
  addToKbId: sdk.z.string().optional(),
})
