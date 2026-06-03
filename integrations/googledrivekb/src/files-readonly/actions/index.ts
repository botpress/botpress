import { filesReadonlyListItemsInFolder } from './list-items-in-folder'
import { filesReadonlyTransferFileToBotpress } from './transfer-file-to-botpress'
import * as bp from '.botpress'

export const filesReadonlyActions = {
  filesReadonlyListItemsInFolder,
  filesReadonlyTransferFileToBotpress,
} as const satisfies Pick<
  bp.IntegrationProps['actions'],
  'filesReadonlyListItemsInFolder' | 'filesReadonlyTransferFileToBotpress'
>
