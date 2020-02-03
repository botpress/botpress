import * as sdk from 'botpress/sdk'
import { Migration } from 'core/services/migration'

const migration: Migration = {
  info: {
    description: 'Add botId to srv_channel_users',
    target: 'core',
    type: 'database'
  },
  up: async ({ bp }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    try {
      await bp.database.schema.table('srv_channel_users', table => {
        table.string('botId')
      })

      // Can only populate botId from users created on channel web
      const users = await bp
        .database('srv_channel_users')
        .select('user_id')
        .where({ channel: 'web' })
        .then(res => res.map(x => x.user_id))

      const usersBots = await bp
        .database('web_conversations')
        .select(['botId', 'userId'])
        .whereIn('userId', users)
        .distinct()

      usersBots.forEach(async userBot => {
        await bp
          .database('srv_channel_users')
          .update({ botId: userBot['botId'] })
          .where({ user_id: userBot['userId'] })
      })

      return { success: true, message: 'Configuration updated successfully' }
    } catch (err) {
      return { success: false, message: err.message }
    }
  }
}

export default migration
