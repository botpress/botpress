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

export interface GhostContentService {
  addRootFolder(rootFolder: string, options: GhostWatchFolderOptions): Promise<void>
  upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void>
  readFile(rootFolder: string, file: string): Promise<string | Buffer>
  deleteFile(rootFolder: string, file: string): Promise<void>
  directoryListing(rootFolder: string, fileEndingPattern: string, pathsToOmit?: string[]): Promise<Array<string>>
  getPending(): Promise<GhostPendingRevisions>
  getPendingWithContent(options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent>
}
