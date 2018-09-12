import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { Notification, NotificationsRepository } from '../../repositories'

@injectable()
export class NotificationsService {
  constructor(@inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository) {}

  async archive(notification: Notification): Promise<void> {
    notification.archived = true
    await this.notificationsRepository.update(notification)
  }

  async archiveAll() {
    const notifications = await this.notificationsRepository.getAll({ archived: false })
    await Promise.mapSeries(notifications, n => this.archive(n))
  }

  async create(notification: Notification): Promise<Notification> {
    return this.notificationsRepository.insert(notification)
  }

  async getInbox(): Promise<Notification[]> {
    return this.notificationsRepository.getAll({ archived: false, read: false })
  }

  async markAsRead(notification: Notification): Promise<void> {
    notification.read = true
    await this.notificationsRepository.update(notification)
  }

  async markAllAsRead(): Promise<void> {
    const notifications = await this.notificationsRepository.getAll({ archived: false, read: false })
    await Promise.mapSeries(notifications, n => this.markAsRead(n))
  }

  async getArchived(): Promise<Notification[]> {
    return this.notificationsRepository.getAll({ archived: true })
  }
}
