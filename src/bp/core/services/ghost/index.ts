import { ReplaceInFileConfig } from 'replace-in-file'

export interface StorageDriver {
  upsertFile(filePath: string, content: Buffer | string, recordRevision: boolean): Promise<void>
  readFile(filePath: string): Promise<Buffer>
  deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  deleteDir(dirPath: string): Promise<void>
  directoryListing(
    folder: string,
    options: { excludes?: string | string[]; includeDotFiles?: boolean }
  ): Promise<string[]>
  listRevisions(pathPrefix: string): Promise<FileRevision[]>
  deleteRevision(filePath: string, revision: string): Promise<void>
  moveFile(fromPath: string, toPath: string): Promise<void>
}

export type FileRevision = {
  path: string
  revision: string
  created_by: string
  created_on: Date
}

export type PendingRevisions = {
  [rootFolder: string]: Array<FileRevision>
}

export interface ServerWidePendingRevisions {
  global: PendingRevisions
  bots: PendingRevisions[]
}

export type ReplaceContent = Pick<ReplaceInFileConfig, 'from' | 'to'>

export * from './cache-invalidators'
