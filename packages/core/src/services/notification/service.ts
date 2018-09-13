import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { Notification, NotificationsRepository } from '../../repositories'

@injectable()
export class NotificationsService {
  onNotification!: () => void | undefined

  constructor(@inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository) {}

  async archive(notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.getBydId(notificationId)
    notification.archived = true
    await this.notificationsRepository.update(notification)
  }

  async archiveAll(botId: string) {
    const notifications = await this.notificationsRepository.getAll(botId, { archived: false })
    await Promise.mapSeries(notifications, notification => {
      notification.archived = true
      this.notificationsRepository.update(notification)
    })
  }

  async create(botId: string, notification: Notification): Promise<void> {
    await this.notificationsRepository.insert(botId, notification)
    this.onNotification && this.onNotification()
  }

  async getInbox(botId: string): Promise<Notification[]> {
    return this.notificationsRepository.getAll(botId, { archived: false, read: false })
  }

  async markAsRead(notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.getBydId(notificationId)
    notification.read = true
    await this.notificationsRepository.update(notification)
  }

  async markAllAsRead(botId: string): Promise<void> {
    const notifications = await this.notificationsRepository.getAll(botId, { archived: false, read: false })
    await Promise.mapSeries(notifications, notification => {
      notification.read = true
      this.notificationsRepository.update(notification)
    })
  }

  async getArchived(botId: string): Promise<Notification[]> {
    return this.notificationsRepository.getAll(botId, { archived: true })
  }
}
