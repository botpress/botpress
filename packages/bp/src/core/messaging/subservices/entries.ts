import Database from 'core/database'

const TABLE_NAME = 'srv_channels'

export class MessagingEntries {
  constructor(private database: Database) {}

  public async create(botId: string, clientId: string, clientToken: string): Promise<MessagingEntry> {
    const entry = {
      clientId,
      botId,
      clientToken,
      config: {}
    }

    await this.query().insert(this.serialize(entry))

    return entry
  }

  public async update(clientId: string, config: any): Promise<void> {
    await this.query()
      .where({ clientId })
      .update({ config: this.database.knex.json.set(config) })
  }

  public async delete(clientId: string): Promise<void> {
    await this.query()
      .where({ clientId })
      .del()
  }

  public async get(clientId: string): Promise<MessagingEntry | undefined> {
    const [entry] = await this.query().where({ clientId })
    if (entry) {
      return this.deserialize(entry)
    } else {
      return undefined
    }
  }

  public async getByBotId(botId: string): Promise<MessagingEntry | undefined> {
    const [entry] = await this.query().where({ botId })
    if (entry) {
      return this.deserialize(entry)
    } else {
      return undefined
    }
  }

  public async list(): Promise<{ clientId: string; botId: string }[]> {
    return this.query()
      .select('clientId', 'botId')
      .orderBy('botId')
  }

  private query() {
    return this.database.knex(TABLE_NAME)
  }

  private serialize(entry: Partial<MessagingEntry>) {
    return {
      ...entry,
      config: this.database.knex.json.set(entry.config)
    }
  }

  private deserialize(entry: any): MessagingEntry {
    return {
      ...entry,
      config: this.database.knex.json.get(entry.config)
    }
  }
}

export interface MessagingEntry {
  clientId: string
  botId: string
  clientToken: string
  config: any
}
