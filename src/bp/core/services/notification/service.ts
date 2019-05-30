import { Notification, NotificationsRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

@injectable()
export class NotificationsService {
  onNotification!: ((notification) => void | undefined) | undefined

  constructor(@inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository) {}

  async archive(botId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.get(botId, notificationId)
    notification.archived = true
    await this.notificationsRepository.update(notification)
  }

  async archiveAll(botId: string) {
    const notifications = await this.notificationsRepository.getAll(botId, { archived: false })
    await Promise.mapSeries(notifications, notification => {
      notification.archived = true
      return this.notificationsRepository.update(notification)
    })
  }

  async create(botId: string, notification: Notification): Promise<void> {
    const inserted = await this.notificationsRepository.insert(botId, notification)
    this.onNotification && this.onNotification(inserted)
  }

  async getInbox(botId: string): Promise<Notification[]> {
    return await this.notificationsRepository.getAll(botId, { archived: false, read: false })
  }

  async markAsRead(botId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationsRepository.get(botId, notificationId)
    notification.read = true
    await this.notificationsRepository.update(notification)
  }

  async markAllAsRead(botId: string): Promise<void> {
    const notifications = await this.notificationsRepository.getAll(botId, { archived: false, read: false })
    await Promise.each(notifications, notification => {
      notification.read = true
      return this.notificationsRepository.update(notification)
    })
  }

  async getArchived(botId: string): Promise<Notification[]> {
    return this.notificationsRepository.getAll(botId, { archived: true })
  }
}
