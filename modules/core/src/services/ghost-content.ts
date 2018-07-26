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

export interface IGhostContentService {
  addRootFolder(rootFolder: string, options: { filesGlob: string; isBinary: boolean }): Promise<void>
  upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void>
  readFile(rootFolder: string, file: string): Promise<string | Buffer>
  deleteFile(rootFolder: string, file: string): Promise<void>
  directoryListing(rootFolder: string, fileEndingPattern: string): Promise<Array<string>>
  getPending(): Promise<GhostPendingRevisions>
  getPendingWithContent(options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent>
}

export default class GhostContentService implements IGhostContentService {
  addRootFolder(rootFolder: string, options: { filesGlob: string; isBinary: boolean }): Promise<void> {
    throw new Error('Method not implemented.')
  }
  upsertFile(rootFolder: string, file: string, content: string | Buffer): Promise<void> {
    throw new Error('Method not implemented.')
  }
  readFile(rootFolder: string, file: string): Promise<string | Buffer> {
    throw new Error('Method not implemented.')
  }
  deleteFile(rootFolder: string, file: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  directoryListing(rootFolder: string, fileEndingPattern: string): Promise<string[]> {
    throw new Error('Method not implemented.')
  }
  getPending(): Promise<GhostPendingRevisions> {
    throw new Error('Method not implemented.')
  }
  getPendingWithContent(options: { stringifyBinary: boolean }): Promise<GhostPendingRevisionsWithContent> {
    throw new Error('Method not implemented.')
  }
}
