import chalk from 'chalk'
import { ApiClient } from 'src/api/client'
import type commandDefinitions from '../command-definitions'
import * as errors from '../errors'
import { GlobalCommand } from './global-command'

export type GetBotCommandDefinition = typeof commandDefinitions.bots.subcommands.get
export class GetBotCommand extends GlobalCommand<GetBotCommandDefinition> {
  public async run(): Promise<void> {
    const { client } = await this.ensureLoginAndCreateClient(this.argv)

    try {
      const { bot } = await client.getBot({ id: this.argv.botRef })
      this.logger.success(`Bot ${chalk.bold(this.argv.botRef)}:`)
      this.logger.json(bot)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not get bot ${this.argv.botRef}`)
    }
  }
}

export type ListBotsCommandDefinition = typeof commandDefinitions.bots.subcommands.list
export class ListBotsCommand extends GlobalCommand<ListBotsCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)

    try {
      const { dev } = this.argv
      const bots = await api.listAllPages(
        (x) => api.client.listBots({ ...x, dev }),
        (r) => r.bots
      )
      this.logger.success('Bots:')
      this.logger.json(bots)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not list bots')
    }
  }
}

export type DeleteBotCommandDefinition = typeof commandDefinitions.bots.subcommands.delete
export class DeleteBotCommand extends GlobalCommand<DeleteBotCommandDefinition> {
  public async run(): Promise<void> {
    const { client } = await this.ensureLoginAndCreateClient(this.argv)

    try {
      await client.deleteBot({ id: this.argv.botRef })
      this.logger.success(`Bot ${chalk.bold(this.argv.botRef)} deleted`)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, `Could not delete bot ${this.argv.botRef}`)
    }
  }
}

export type CreateBotCommandDefinition = typeof commandDefinitions.bots.subcommands.create
export class CreateBotCommand extends GlobalCommand<CreateBotCommandDefinition> {
  public async run(): Promise<void> {
    const api = await this.ensureLoginAndCreateClient(this.argv)

    try {
      if (this.argv.ifNotExists) {
        await this._getOrCreate(api, this.argv.name)
        return
      }
      await this._create(api, this.argv.name)
    } catch (thrown) {
      throw errors.BotpressCLIError.wrap(thrown, 'Could not create bot')
    }
  }

  private _getOrCreate = async (api: ApiClient, name: string | undefined) => {
    if (!name) {
      throw new errors.BotpressCLIError('option --if-not-exists requires that a name be provided')
    }
    const existingBot = await api.findBotByName(name)
    if (existingBot) {
      this.logger.success(`Bot ${chalk.bold(name)} already exists`)
      this.logger.json(existingBot)
      return
    }
    return this._create(api, name)
  }

  private _create = async (api: ApiClient, name: string | undefined) => {
    const { bot } = await api.client.createBot({ name })
    this.logger.success(`Bot ${chalk.bold(bot.id)}:`)
    this.logger.json(bot)
  }
}
