import { Client } from './client'
import { FilesCache } from './files-cache'
import { BaseGenericFile } from './types'

export class FileEventHandler {
  public constructor(private _driveClient: Client, private _filesCache: FilesCache) {}

  public async handleFileCreated(file: BaseGenericFile) {
    // TODO: Trigger event
    // TODO: Watch file
    console.log(`${file.type === 'folder' ? 'Folder' : 'File'} created: ${file.name} (${file.id})`)
    this._filesCache.set(file)
  }

  public async handleFileDeleted(file: BaseGenericFile) {
    // TODO: Trigger event
    // TODO: Unwatch file
    console.log(`${file.type === 'folder' ? 'Folder' : 'File'} deleted: ${file.name} (${file.id})`)
    this._filesCache.remove(file.id)
  }
}
