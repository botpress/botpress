export interface StorageDriver {
  upsertFile(filePath: string, content: Buffer | string, recordRevision: boolean): Promise<void>
  readFile(filePath: string): Promise<Buffer>
  deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  directoryListing(folder: string, exlude?): Promise<string[]>
  listRevisions(pathPrefix: string): Promise<GhostFileRevision[]>
  deleteRevision(filePath: string, revision: string): Promise<void>
}

export interface ObjectCache {
  get<T>(key: string): Promise<T>
  set<T>(key: string, obj: T): Promise<void>
  has(key: string): Promise<boolean>
  invalidate(key: string): Promise<void>
  invalidateStartingWith(prefix: string): Promise<void>
}

export type GhostFileRevision = {
  path: string
  revision: string
  created_by: string
  created_on: Date
}

export type GhostPendingRevisions = {
  [rootFolder: string]: Array<GhostFileRevision>
}

export type GhostPendingRevisionsWithContent = {
  [rootFolder: string]: Array<GhostFileRevision & { content: Buffer }>
}

export * from './cache-invalidators'
