import Promise from 'bluebird'

import { GhostContentService, GhostPendingRevisions, GhostPendingRevisionsWithContent } from '.'

export default class DBGhostContentService implements GhostContentService {
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
