export type GhostFileRevision = {
  path: string
  revision: string
  created_by: string
  created_on: Date
}

export interface StorageDriver {
  upsertFile(filePath: string, content: Buffer | string, recordRevision: boolean): Promise<void>
  readFile(filePath: string): Promise<Buffer>
  deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  directoryListing(folder: string): Promise<string[]>
  listRevisions(pathPrefix: string): Promise<GhostFileRevision[]>
  deleteRevision(filePath: string, revision: string): Promise<void>
}

export interface ObjectCache {
  get<T>(key: string): Promise<T>
  set<T>(key: string, obj: T): Promise<void>
  has(key: string): Promise<boolean>
  invalidate(key: string): Promise<void>
}

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
