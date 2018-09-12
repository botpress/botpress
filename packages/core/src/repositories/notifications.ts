import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../misc/types'

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

  public created_on?: string
  public modified_on?: string
  public read = false
  public archived = false
}

type DefaultGetOptions = { archived?: boolean; read?: boolean }

export interface NotificationsRepository {
  getBydId(id: string): Promise<Notification>
  getAll(options?: DefaultGetOptions): Promise<Notification[]>
  insert(notification: Notification): Promise<Notification>
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
      .then()) as Notification
  }

  async getAll(options?: DefaultGetOptions): Promise<Notification[]> {
    let query = this.database.knex(this.TABLE_NAME).select('*')
    // Knex cannot chain "where" clause like "orderBy". They must be chained with "andWhere" or "orWhere"
    if (options && options.archived && options.read) {
      query = query.where('archived', options.archived).andWhere('read', options.read)
    } else if (options && options.archived) {
      query = query.where('archived', options.archived)
    } else if (options && options.read) {
      query = query.where('read', options.read)
    }
    query.limit(250)

    return (await query.then()) as Notification[]
  }

  async insert(notification: Notification): Promise<Notification> {
    return (await this.database.knex.insertAndRetrieve(this.TABLE_NAME, notification, [
      'id',
      'message',
      'level',
      'module_id',
      'module_icon',
      'module_name',
      'redirect_url',
      'created_on',
      'read',
      'archived'
    ])) as Notification
  }

  async update(notification: Notification): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .update(notification)
      .then()
  }

  async deleteById(id: string): Promise<void> {
    await this.database
      .knex(this.TABLE_NAME)
      .where({ id })
      .del()
      .then()
  }
}
