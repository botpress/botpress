import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'
import { UserRepository, KnexUserRepository } from 'core/repositories'
import { TYPES } from 'core/types'
import { AnalyticsRepository } from 'core/repositories/analytics-repository'
import _ from 'lodash'

const migration: Migration = {
  info: {
    description: 'Add botId to srv_channel_users',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp, inversify }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      await bp.database.createTableIfNotExists('srv_analytics', table => {
        table.increments('id').primary()
        table.string('botId')
        table.string('metric_name')
        table.string('channel')
        table.timestamp('created_on')
        table.timestamp('updated_on')
        table.decimal('value')
      })

      await bp.database.schema.table('srv_channel_users', table => {
        table.string('botId')
      })

      // Can only populate botId from users created on channel web
      const users = await bp
        .database('srv_channel_users')
        .select('user_id', 'channel', 'botId')
        .where({ channel: 'web' })

      const usersBots = await bp
        .database('web_conversations')
        .select(['botId', 'userId'])
        .whereIn(
          'userId',
          users.map(x => x.user_id)
        )
        .distinct()

      usersBots.forEach(async userBot => {
        await bp
          .database('srv_channel_users')
          .update({ botId: userBot['botId'] })
          .where({ user_id: userBot['userId'] })
      })

      _.uniqBy(users, 'botId')

      return { success: true, message: 'Configuration updated successfully' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }
}

export default migration
