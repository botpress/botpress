import Database from 'core/database'
import { TYPES } from 'core/types'
import { inject, injectable } from 'inversify'

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

interface DefaultGetOptions {
  archived?: boolean
  read?: boolean
}

@injectable()
export class NotificationsRepository {
  private readonly TABLE_NAME = 'srv_notifications'

  constructor(@inject(TYPES.Database) private database: Database) {}

  async get(botId: string, id: string): Promise<Notification> {
    return (await this.database
      .knex(this.TABLE_NAME)
      .select('*')
      .where({ botId, id })
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

    if (options && options.archived !== undefined) {
      query = query.andWhere('archived', options.archived)
    }

    if (options && options.read !== undefined) {
      query = query.andWhere('read', options && options.read)
    }

    query = query.limit(250)

    return (await query) as Notification[]
  }

  async insert(botId: string, notification: Notification): Promise<Notification> {
    const now = this.database.knex.date.now
    return this.database.knex.insertAndRetrieve<Notification>(
      this.TABLE_NAME,
      {
        id: notification.id,
        botId,
        level: notification.level,
        message: notification.message,
        module_id: notification.moduleId,
        module_name: notification.moduleName,
        module_icon: notification.moduleIcon,
        redirect_url: notification.redirectUrl,
        created_on: now()
      },
      ['id', 'botId', 'level', 'message', 'module_id', 'module_name', 'module_icon', 'redirect_url', 'created_on']
    )
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
