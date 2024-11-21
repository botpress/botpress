import { Client } from './client'
import { FileEventHandler } from './file-event-handler'
import { deserializeToken, Token } from './file-notification-token'
import { FilesCache } from './files-cache'
import { BaseGenericFile, Notification } from './types'

export class NotificationHandler {
  public constructor(
    private _driveClient: Client,
    private _filesCache: FilesCache,
    private _fileEventHandler: FileEventHandler
  ) {}

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
    } else if (type === 'remove') {
      await this._handleRemoveNotif(token)
    }
  }

  private async _handleUpdateChildrenNotif(token: Token) {
    if (token.fileType !== 'folder') {
      return
    }
    const currentChildrenMap = new Map<string, BaseGenericFile>()
    const currentChildren = await this._driveClient.getChildren(token.fileId)
    for (const child of currentChildren) {
      if (!this._filesCache.find(child.id)) {
        await this._fileEventHandler.handleFileCreated(child)
      }
      currentChildrenMap.set(child.id, child)
    }
  }

  private async _handleRemoveNotif(token: Token) {
    const file = this._filesCache.find(token.fileId)
    if (!file) {
      return
    }
    await this._fileEventHandler.handleFileDeleted(file)
  }
}
