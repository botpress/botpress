export interface StorageDriver {
  upsertFile(path: string, content: Buffer | string): Promise<void>
  readFile(path: string): Promise<Buffer>
  deleteFile(path: string): Promise<void>
  directoryListing(folder: string, fileEndingPattern: string): Promise<string[]>
}

export interface ObjectCache {
  get<T>(key: string): Promise<T>
  set<T>(key: string, obj: T): Promise<void>
  has(key: string): Promise<boolean>
  invalidate(key: string): Promise<void>
}

export type GhostWatchFolderOptions = { filesGlob: string; isBinary: boolean }

export type GhostPendingRevisions = {
  [rootFolder: string]: Array<{
    file: string
    id: number
    revision: string
    created_on: Date
    created_by: string
  }>
}

export type GhostPendingRevisionsWithContent = {
  [rootFolder: string]: Array<{
    binary: boolean
    revisions: string[]
    files: Array<{ file: string; content: string | Buffer }>
  }>
}
