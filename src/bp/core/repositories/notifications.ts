import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../types'

export class Notification {
  constructor(
    public botId: string,
    public message: string,
    public level: string,
    public moduleId: string,
    public moduleIcon: string,
    public moduleName: string,
    public redirectUrl: string
  ) {}

  public id?: string
  public created_on?: string
  public read = false
  public archived = false
}

type DefaultGetOptions = { archived?: boolean; read?: boolean }

export interface NotificationsRepository {
  getBydId(id: string): Promise<Notification>
  getAll(botId: string, options?: DefaultGetOptions): Promise<Notification[]>
  insert(botId: string, notification: Notification): Promise<void>
  update(notification: Notification): Promise<void>
  deleteById(id: string): Promise<void>
}

@injectable()
export class KnexNotificationsRepository implements NotificationsRepository {
  private readonly TABLE_NAME = 'srv_notifications'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async getBydId(id: string): Promise<Notification> {
    return (await this.database
      .knex(this.TABLE_NAME)
      .select('*')
      .where({ id })
      .limit(1)
      .then(res => {
        if (!res || !res.length) {
          throw new Error('Entity not found')
        }
        return res[0]
      })) as Notification
  }

  async getAll(botId: string, options?: DefaultGetOptions): Promise<Notification[]> {
    let query = this.database
      .knex(this.TABLE_NAME)
      .select('*')
      .where({ botId })

    if (options && options.archived) {
      query = query.andWhere('archived', options.archived)
    }

    if (options && options.read) {
      query = query.andWhere('read', options.read)
    }

    query = query.limit(250)

    return (await query) as Notification[]
  }

  async insert(botId: string, notification: Notification): Promise<void> {
    const now = this.database.knex.date.now
    await this.database.knex(this.TABLE_NAME).insert({
      id: notification.id,
      botId: botId,
      level: notification.level,
      message: notification.message,
      module_id: notification.moduleId,
      module_name: notification.moduleName,
      module_icon: notification.moduleIcon,
      redirect_url: notification.redirectUrl,
      created_on: now()
    })
  }

  async update(notification: Notification): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .update({
        read: notification.read,
        archived: notification.archived
      })
      .where({ id: notification.id })
  }

  async deleteById(id: string): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .where({ id })
      .del()
  }
}
