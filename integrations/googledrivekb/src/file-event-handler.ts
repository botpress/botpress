import { Client as DriveClient } from './client'
import { FileChannelsCache } from './file-channels-cache'
import { FilesCache } from './files-cache'
import { BaseDiscriminatedFile, GenericFile } from './types'
import { Client } from '.botpress'

export class FileEventHandler {
  public constructor(
    private _client: Client,
    private _driveClient: DriveClient,
    private _filesCache: FilesCache,
    private _fileChannelsCache: FileChannelsCache
  ) {}

  public async handleFileCreated(file: GenericFile) {
    this._filesCache.set(file) // GenericFile is compatible with BaseDiscriminatedFile
    const channel = await this._driveClient.tryWatch(file.id)
    if (channel) {
      this._fileChannelsCache.set(channel)
    }
    if (file.type === 'normal') {
      await this._client.createEvent({
        type: 'fileCreated',
        payload: file,
      })
    } else if (file.type === 'folder') {
      await this._client.createEvent({
        type: 'folderCreated',
        payload: file,
      })
    }
  }

  // Work with BaseDiscriminatedFile, at this point the only file info available is in the cache
  public async handleFileDeleted(baseFile: BaseDiscriminatedFile) {
    this._fileChannelsCache.remove(baseFile.id) // No need to unwatch as resource is already deleted
    this._filesCache.remove(baseFile.id)

    if (baseFile.type === 'normal') {
      await this._client.createEvent({
        type: 'fileDeleted',
        payload: { id: baseFile.id },
      })
    } else if (baseFile.type === 'folder') {
      await this._client.createEvent({
        type: 'folderDeleted',
        payload: { id: baseFile.id },
      })
    }
  }
}
