import { inject, injectable } from 'inversify'

import Database from '../database'
import { TYPES } from '../misc/types'

export class ModuleNotification {
  constructor(public id: string, public icon: string, public name: string) {}
}

export class Notification {
  constructor(
    public message: string,
    public level: string,
    public module: ModuleNotification,
    public redirectUrl: string
  ) {}

  public created_on?: string
  public read = false
  public archived = false
}

export interface NotificationsRepository {
  getBydId(id: string)
  insert(notification: Notification)
  update(notification: Notification)
  deleteById(id: string)
  getAllUnarchived()
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

  async getAllUnarchived(): Promise<Notification[]> {
    return (await this.database
      .knex(this.TABLE_NAME)
      .select('*')
      .where('archived', false)
      .limit(250)
      .then()) as Notification[]
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
