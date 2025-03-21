import * as sdk from '@botpress/sdk'
import { CommonHandlerProps } from '@botpress/sdk/dist/plugin'
import type * as models from '../definitions/models'
import type * as bp from '.botpress'

type TPlugin = sdk.DefaultPlugin<bp.TPlugin>

export type SyncQueueItem = models.FileWithPath & {
  status: 'pending' | 'newly-synced' | 'already-synced' | 'errored'
  errorMessage?: string
}
export type SyncQueue = SyncQueueItem[]

export type CommonProps = CommonHandlerProps<TPlugin>
