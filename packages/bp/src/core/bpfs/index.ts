import { DirectoryListingOptions } from 'botpress/sdk'
import { ReplaceInFileConfig } from 'replace-in-file'

export interface StorageDriver {
  upsertFile(filePath: string, content: Buffer | string, recordRevision: boolean): Promise<void>
  readFile(filePath: string): Promise<Buffer>
  fileExists(filePath: string): Promise<boolean>
  deleteFile(filePath: string, recordRevision: boolean): Promise<void>
  deleteDir(dirPath: string): Promise<void>
  directoryListing(folder: string, options: DirectoryListingOptions): Promise<string[]>
  listRevisions(pathPrefix: string): Promise<FileRevision[]>
  deleteRevision(filePath: string, revision: string): Promise<void>
  fileSize(filePath: string): Promise<number>
  moveFile(fromPath: string, toPath: string): Promise<void>
}

export interface FileRevision {
  path: string
  revision: string
  created_by: string
  created_on: Date
}

export interface PendingRevisions {
  [rootFolder: string]: FileRevision[]
}

export interface ServerWidePendingRevisions {
  global: PendingRevisions
  bots: PendingRevisions[]
}

export type ReplaceContent = Pick<ReplaceInFileConfig, 'from' | 'to'>

export * from './cache-invalidators'
export * from './ghost-service'
export * from './ghost.inversify'
export * from './memory-cache'
