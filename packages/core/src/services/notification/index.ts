import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'
import { NotificationsRepository } from '../../repositories'

@injectable()
export class NotificationsService {
  constructor(@inject(TYPES.NotificationsRepository) private notificationsRepository: NotificationsRepository) {}

  async getInbox() {
    return this.notificationsRepository.getAllUnarchived()
  }

  load() {}
  markAsRead() {}
  markAllAsRead() {}

  getArchived() {}
  archive() {}
  archiveAll() {}
  create() {}
}
