import Database from 'core/database'

const TABLE_NAME = 'srv_channels'

export class MessagingChannels {
  constructor(private database: Database) {}

  public async getClientByBotId(botId: string) {
    const client = await this.database.knex(TABLE_NAME).where({ botId })
    return client
  }

  public async createClient(botId: string, clientId: string, clientToken: string) {}

  public async listClients() {
    return this.database.knex(TABLE_NAME).select('clientId', 'botId')
  }
}
