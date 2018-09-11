import { inject, injectable } from 'inversify'

import { TYPES } from '../../misc/types'

@injectable()
export class NotificationsService {
  constructor(@inject(TYPES.NotificationsRepository) private notificationsRepository) {}
}
