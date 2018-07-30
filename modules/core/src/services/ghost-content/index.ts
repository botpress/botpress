import 'bluebird-global'

export type GhostPendingRevisions = {
  [key: string]: [
    {
      file: string
      id: number
      revision: string
      created_on: Date
      created_by: string
    }
  ]
}

export type GhostPendingRevisionsWithContent = {
  [key: string]: [
    {
      binary: boolean
      revisions: string[]
      files: [{ file: string; content: string | Buffer }]
    }
  ]
}

export type GhostWatchFolderOptions = { filesGlob: string; isBinary: boolean }
export type BotId = 'global' | string

export interface GhostContentService {
  addRootFolder(botId: BotId, rootFolder: string, options: GhostWatchFolderOptions): Promise<void>
  upsertFile(botId: BotId, rootFolder: string, file: string, content: string | Buffer): Promise<void>
  readFile(botId: BotId, rootFolder: string, file: string): Promise<string | Buffer>
  deleteFile(botId: BotId, rootFolder: string, file: string): Promise<void>
  directoryListing(
    botId: BotId,
    rootFolder: string,
    fileEndingPattern: string,
    pathsToOmit?: string[]
  ): Promise<Array<string>>
  getPending(botId: BotId): Promise<GhostPendingRevisions>
  getPendingWithContent(botId: BotId, options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent>
}
