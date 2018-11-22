import { Logger } from 'botpress/sdk'
import { UserRepository } from 'core/repositories'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'

import { BotpressConfig } from '../../config/botpress.config'
import { ConfigProvider } from '../../config/config-loader'
import { TYPES } from '../../types'
import { Janitor } from '../janitor'

import { DataRetentionService } from './service'

@injectable()
export class DataRetentionJanitor extends Janitor {
  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'RetentionJanitor')
    protected logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService,
    @inject(TYPES.UserRepository) private userRepo: UserRepository
  ) {
    super(logger)
  }

  @Memoize()
  private async getBotpressConfig(): Promise<BotpressConfig> {
    return this.configProvider.getBotpressConfig()
  }

  protected async getInterval(): Promise<string> {
    const config = await this.getBotpressConfig()
    return (config.dataRetention && config.dataRetention.janitorInterval) || '15m'
  }

  protected async runTask(): Promise<void> {
    const expired = await this.dataRetentionService.getExpired()

    await Promise.mapSeries(expired, async ({ channel, user_id, field_path }) => {
      const { result: user } = await this.userRepo.getOrCreate(channel, user_id)

      await this.userRepo.updateAttributes(channel, user.id, _.omit(user.attributes, field_path))
      await this.dataRetentionService.delete(channel, user_id, field_path)
    })
  }
}
