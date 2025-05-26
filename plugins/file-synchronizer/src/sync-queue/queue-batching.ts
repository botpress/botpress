import { MAX_BATCH_SIZE_BYTES } from '../consts'
import type * as types from '../types'

type SimpleFile = Pick<types.SyncQueueItem, 'sizeInBytes'>

export const findBatchEndCursor = ({
  startCursor,
  files,
}: {
  startCursor: number
  files: SimpleFile[]
}): { endCursor: number } => {
  let currentBatchSize = 0
  let endCursor = files.length

  for (let newCursor = startCursor; newCursor < files.length; newCursor++) {
    const fileToSync = files[newCursor]
    const fileSizeInBytes = _getFileSize(fileToSync!)
    currentBatchSize += fileSizeInBytes

    // First file is always included even if it exceeds the batch size:
    if (newCursor > startCursor && currentBatchSize > MAX_BATCH_SIZE_BYTES) {
      endCursor = newCursor
      break
    }
  }

  return { endCursor }
}

const _getFileSize = (file: SimpleFile) => {
  if (file.sizeInBytes === undefined) {
    // If a file has no size, we assume it takes up half the batch size limit.
    // This should be relatively safe, since we'd process at most two files of
    // unknown size in a batch, and we don't want to just skip them.
    return MAX_BATCH_SIZE_BYTES / 2
  }

  return file.sizeInBytes
}
