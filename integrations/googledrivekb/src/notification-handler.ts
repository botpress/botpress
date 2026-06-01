import { Client } from './client'
import { FileEventHandler } from './file-event-handler'
import { deserializeToken, Token } from './file-notification-token'
import { FilesCache } from './files-cache'
import { Notification } from './types'
import * as bp from '.botpress'

export class NotificationHandler {
  public constructor(
    private _driveClient: Client,
    private _filesCache: FilesCache,
    private _fileEventHandler: FileEventHandler
  ) {}

  public static isSupported(notification: Notification): boolean {
    const type = notification.headers['x-goog-resource-state']
    return type === 'update' || type === 'remove'
  }

  public async handle(notification: Notification): Promise<void> {
    const type = notification.headers['x-goog-resource-state']
    const changes = notification.headers['x-goog-changed']
    const serializedToken = notification.headers['x-goog-channel-token']
    const token = deserializeToken(serializedToken, bp.secrets.WEBHOOK_SECRET)
    if (!token) {
      console.error('Invalid notification token:', token)
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
    const currentChildren = await this._driveClient.getChildren(token.fileId)
    for (const child of currentChildren) {
      if (!this._filesCache.find(child.id)) {
        await this._fileEventHandler.handleFileCreated(child)
      }
    }
  }

  private async _handleRemoveNotif(token: Token) {
    const baseFile = this._filesCache.find(token.fileId)
    if (!baseFile) {
      return
    }
    await this._fileEventHandler.handleFileDeleted(baseFile)
  }
}
