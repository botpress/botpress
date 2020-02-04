import { BotConfig, IO, Logger } from 'botpress/sdk'
import { BotpressConfig } from 'core/config/botpress.config'
import { ConfigProvider } from 'core/config/config-loader'
import { UserRepository } from 'core/repositories'
import { inject, injectable, tagged } from 'inversify'
import { Memoize } from 'lodash-decorators'
import ms = require('ms')

import { TYPES } from '../types'

import AnalyticsService from './analytics-service'
import { Janitor } from './janitor'
import { BotService } from './bot-service'

@injectable()
export default class AnalyticsJanitor extends Janitor {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'AnalyticsLogger')
    protected logger: Logger,
    @inject(TYPES.UserRepository) private userRepo: UserRepository,
    @inject(TYPES.AnalyticsService) private analytics: AnalyticsService,
    @inject(TYPES.BotService) private botService: BotService
  ) {
    super(logger)
  }

  protected async getInterval(): Promise<string> {
    // Todo: add config in botpress config if necessary.
    // Running once a day is enough at this time.
    return Promise.resolve('24h')
  }

  protected async runTask(): Promise<void> {
    const botsConfigs = await this.botService.getBots()
    const botsIds = Array.from(botsConfigs.keys())
    const channels = ['web', 'slack', 'messenger', 'telegram']

    const users = await this.userRepo.getAllUsers()
    for (var botId in botsIds) {
      const usersPerBot = users.filter(x => x.botId === botId)
      channels.forEach(async channel => {
        const usersPerChannel = usersPerBot.filter(x => x.channel === channel) as []
        await this.analytics.incrementMetric(botId, channel, 'new_users_count', usersPerChannel.length)
      })
    }

    // botsIds.forEach(async botId => {
    //   const userCount = await this.userRepo.getUserCount(undefined, botId)
    //   this.analytics.incrementMetric(botId, )
    // })
  }
}
