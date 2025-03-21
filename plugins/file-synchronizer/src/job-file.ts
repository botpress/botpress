import type * as types from './types'
import * as bp from '.botpress'

export const getSyncQueue = async (
  props: bp.WorkflowHandlerProps['processQueue']
): Promise<{ syncQueue: types.SyncQueue; key: string }> => {
  try {
    const { jobFileContent, key } = await _retrieveJobFile(props)
    const syncQueue = _parseJobFile(jobFileContent)

    return { syncQueue, key }
  } catch (thrown: unknown) {
    await props.workflow.setFailed({ failureReason: `Failed to retrieve job file: ${thrown}` })
    throw new Error(`Failed to retrieve job file: ${thrown}`)
  }
}

const _retrieveJobFile = async (
  props: bp.WorkflowHandlerProps['processQueue']
): Promise<{ jobFileContent: string; key: string }> => {
  const { file: jobFile } = await props.client.getFile({ id: props.workflow.input.jobFileId })
  const jobFileContent = await fetch(jobFile.url).then((res) => res.text())

  return { jobFileContent, key: jobFile.key }
}

const _parseJobFile = (jsonl: string): types.SyncQueue => {
  const result: types.SyncQueue = []
  let startCursor = 0

  for (let endCursor = 0; endCursor <= jsonl.length; endCursor++) {
    if (jsonl[endCursor] === '\n' || endCursor === jsonl.length) {
      const line = jsonl.slice(startCursor, endCursor).trim()
      startCursor = endCursor + 1

      if (line) {
        try {
          // TODO: validate against a zod schema
          result.push(JSON.parse(line) as types.SyncQueueItem)
        } catch (thrown: unknown) {
          throw new Error(`Failed to parse job file line: ${line} - ${thrown}`)
        }
      }
    }
  }

  return result
}

export const updateSyncQueue = async (
  props: types.CommonProps,
  key: string,
  syncQueue: types.SyncQueue,
  tags?: Record<string, string>
): Promise<string> => {
  const { file: jobFile } = await props.client.uploadFile({
    key,
    content: syncQueue.map((item) => JSON.stringify(item)).join('\n'),
    tags,
  })

  return jobFile.id
}
