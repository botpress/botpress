import { QUEUE_ITEM_SCHEMA } from '../types'
import type * as types from '../types'
import * as utils from '../utils'
import * as bp from '.botpress'

export const getSyncQueue = async (
  props: bp.WorkflowHandlerProps['processQueue']
): Promise<{ syncQueue: types.SyncQueue; key: string }> => {
  const { jobFileContent, key } = await _retrieveJobFile(props).catch(async (thrown: unknown) => {
    const err: Error = thrown instanceof Error ? thrown : new Error(String(thrown))
    await props.workflow.setFailed({ failureReason: `Failed to retrieve job file: ${err.message}` })
    throw new Error(`Failed to retrieve job file: ${thrown}`)
  })

  const syncQueue: types.SyncQueue = []
  const syncQueueGenerator = utils.jsonl.parseJsonLines(jobFileContent, QUEUE_ITEM_SCHEMA)

  for (const item of syncQueueGenerator) {
    if ('error' in item) {
      props.logger.error('Error while parsing line in job file. This line will be ignored.', item)
      continue
    }

    syncQueue.push(item.value)
  }

  return { syncQueue, key }
}

const _retrieveJobFile = async (
  props: bp.WorkflowHandlerProps['processQueue']
): Promise<{ jobFileContent: string; key: string }> => {
  const { file: jobFile } = await props.client.getFile({
    id: props.workflow.input.jobFileId,
  })
  const jobFileContent = await fetch(jobFile.url, { signal: AbortSignal.timeout(30000) }).then((res) => res.text())

  return { jobFileContent, key: jobFile.key }
}

export const updateSyncQueue = async (
  props: types.CommonProps,
  key: string,
  syncQueue: types.SyncQueue,
  tags?: Record<string, string>
): Promise<string> => {
  const { file: jobFile } = await props.client.uploadFile({
    key,
    content: syncQueue.map((item) => JSON.stringify(item)).join('\n') + '\n',
    tags,
  })

  return jobFile.id
}
