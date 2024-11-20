import { Client } from './client'
import { deserializeToken, Token } from './file-notification-token'
import { FilesCache } from './files-cache'
import { BaseGenericFile, Notification } from './types'

export class NotificationHandler {
  public constructor(private _driveClient: Client, private _filesCache: FilesCache) {}

  public async handle(notification: Notification): Promise<void> {
    const type = notification.headers['x-goog-resource-state']
    const changes = notification.headers['x-goog-changed']
    const serializedToken = notification.headers['x-goog-channel-token']
    const token = deserializeToken(serializedToken, 'placeholder_secret') // TODO: Use secret to sign the fileID
    if (!token) {
      // Ignore invalid notification
      return
    }
    if (type === 'update') {
      for (const change of changes) {
        if (change === 'children') {
          await this._handleUpdateChildrenNotif(token)
        }
      }
    }
  }

  private async _handleUpdateChildrenNotif(token: Token) {
    if (token.fileType !== 'folder') {
      return
    }

    const oldChildren = this._filesCache.getAll((file) => file.parentId === token.fileId)
    const oldChildrenMap = new Map(oldChildren.map((file) => [file.id, file]))
    const existingChildrenMap = new Map<string, BaseGenericFile>()

    const children = await this._driveClient.getChildren(token.fileId)
    for (const child of children) {
      if (!oldChildrenMap.has(child.id)) {
        this._handleFileCreated(child)
      }
      existingChildrenMap.set(child.id, child)
    }
    for (const oldChild of oldChildren) {
      if (!existingChildrenMap.has(oldChild.id)) {
        this._handleFileDeleted(oldChild)
      }
    }
  }

  private _handleFileCreated(file: BaseGenericFile) {
    console.log(`${file.type === 'folder' ? 'Folder' : 'File'} created: ${file.name} (${file.id})`)
    // TODO: Move logic to a class that handles cache update and event firing
    // TODO: Trigger event
    // TODO: Add file to cache (probably already is there)
    // TODO: Watch file
    this._filesCache.set(file)
  }

  private _handleFileDeleted(file: BaseGenericFile) {
    console.log(`${file.type === 'folder' ? 'Folder' : 'File'} deleted: ${file.name} (${file.id})`)
    // TODO: Move logic to a class that handles cache update and event firing
    // TODO: Trigger event
    // TODO: Remove file from cache
    // TODO: Watch file
    this._filesCache.remove(file.id)
  }
}
