import { Logger } from 'botpress/sdk'
import { BotpressConfig, ConfigProvider } from 'core/config'
import { Janitor } from 'core/services/janitor'
import { TYPES } from 'core/types'
import { ChannelUserRepository } from 'core/users'
import { inject, injectable, tagged } from 'inversify'
import _ from 'lodash'
import { Memoize } from 'lodash-decorators'

import { DataRetentionService } from './data-retention-service'

@injectable()
export class DataRetentionJanitor extends Janitor {
  private BATCH_SIZE = 250

  constructor(
    @inject(TYPES.Logger)
    @tagged('name', 'RetentionJanitor')
    protected logger: Logger,
    @inject(TYPES.ConfigProvider) private configProvider: ConfigProvider,
    @inject(TYPES.DataRetentionService) private dataRetentionService: DataRetentionService,
    @inject(TYPES.UserRepository) private userRepo: ChannelUserRepository
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

  async runTask(): Promise<void> {
    let expired = await this.dataRetentionService.getExpired(this.BATCH_SIZE)

    while (expired.length > 0) {
      await Promise.mapSeries(expired, async ({ channel, user_id, field_path }) => {
        const { result: user } = await this.userRepo.getOrCreate(channel, user_id)

        await this.userRepo.setAttributes(channel, user.id, _.omit(user.attributes, field_path))
        await this.dataRetentionService.delete(channel, user_id, field_path)
      })

      if (expired.length >= this.BATCH_SIZE) {
        expired = await this.dataRetentionService.getExpired(this.BATCH_SIZE)
      }
    }
  }
}
