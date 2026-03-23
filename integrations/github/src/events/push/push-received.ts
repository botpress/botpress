import type { PushEvent } from '@octokit/webhooks-types'
import * as mapping from '../../files-readonly/mapping'
import * as bp from '.botpress'

const MAX_BATCH_SIZE = 50

export const firePushReceived = async ({
  githubEvent,
  client,
  logger,
}: bp.HandlerProps & { githubEvent: PushEvent }) => {
  try {
    const repo = githubEvent.repository
    const owner = repo.owner.login ?? repo.owner.name
    const repoName = repo.name
    const defaultRef = `refs/heads/${repo.default_branch ?? repo.master_branch ?? 'main'}`

    if (githubEvent.ref !== defaultRef) {
      logger.forBot().debug(`Ignoring push to non-default branch: ${githubEvent.ref}`)
      return
    }

    const fileStates = new Map<string, 'created' | 'updated' | 'deleted'>()

    for (const commit of githubEvent.commits) {
      for (const filePath of commit.added ?? []) {
        const prev = fileStates.get(filePath)
        fileStates.set(filePath, prev === 'deleted' ? 'updated' : 'created')
      }
      for (const filePath of commit.modified ?? []) {
        const prev = fileStates.get(filePath)
        if (prev !== 'created') {
          fileStates.set(filePath, 'updated')
        }
      }
      for (const filePath of commit.removed ?? []) {
        const prev = fileStates.get(filePath)
        if (prev === 'created') {
          fileStates.delete(filePath)
        } else {
          fileStates.set(filePath, 'deleted')
        }
      }
    }

    if (fileStates.size === 0) {
      return
    }

    const created: bp.events.Events['aggregateFileChanges']['modifiedItems']['created'] = []
    const updated: bp.events.Events['aggregateFileChanges']['modifiedItems']['updated'] = []
    const deleted: bp.events.Events['aggregateFileChanges']['modifiedItems']['deleted'] = []

    for (const [filePath, state] of fileStates) {
      const file = mapping.mapPushFileToFile(owner, repoName, filePath)
      if (state === 'created') {
        created.push(file)
      } else if (state === 'updated') {
        updated.push(file)
      } else {
        deleted.push(file)
      }
    }

    await _emitFileChangeEvents({ client, logger, changes: { created, updated, deleted } })
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.forBot().error('Failed to process push event; swallowing to prevent webhook retries', error)
  }
}

const _emitFileChangeEvents = async ({
  client,
  logger,
  changes,
}: {
  client: bp.Client
  logger: bp.Logger
  changes: FileChanges
}) => {
  try {
    for (const batch of _getBatches(changes)) {
      await client.createEvent({
        type: 'aggregateFileChanges',
        payload: {
          modifiedItems: batch,
        },
      })
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err))
    logger.forBot().error('Failed to emit file-change events; swallowing to prevent webhook retries', error)
  }
}

type FileChanges = {
  created: bp.events.Events['aggregateFileChanges']['modifiedItems']['created']
  updated: bp.events.Events['aggregateFileChanges']['modifiedItems']['updated']
  deleted: bp.events.Events['aggregateFileChanges']['modifiedItems']['deleted']
}

function* _getBatches(changes: FileChanges): Generator<FileChanges> {
  let createdIdx = 0
  let updatedIdx = 0
  let deletedIdx = 0

  while (
    createdIdx < changes.created.length ||
    updatedIdx < changes.updated.length ||
    deletedIdx < changes.deleted.length
  ) {
    const batch: FileChanges = { created: [], updated: [], deleted: [] }
    let size = 0

    while (size < MAX_BATCH_SIZE) {
      const startSize = size
      if (createdIdx < changes.created.length && size < MAX_BATCH_SIZE) {
        batch.created.push(changes.created[createdIdx++]!)
        size++
      }
      if (updatedIdx < changes.updated.length && size < MAX_BATCH_SIZE) {
        batch.updated.push(changes.updated[updatedIdx++]!)
        size++
      }
      if (deletedIdx < changes.deleted.length && size < MAX_BATCH_SIZE) {
        batch.deleted.push(changes.deleted[deletedIdx++]!)
        size++
      }
      if (size === startSize) {
        break
      }
    }

    yield batch
  }
}
