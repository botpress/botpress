import * as sdk from 'botpress/sdk'
import { Migration } from 'core/migration'

const migration: Migration = {
  info: {
    description: 'Add indices to conversations, events and logs',
    target: 'core',
    type: 'database'
  },
  up: async ({
    bp,
    configProvider,
    database,
    inversify,
    metadata
  }: sdk.ModuleMigrationOpts): Promise<sdk.MigrationResult> => {
    const db = database.knex as sdk.KnexExtended

    try {
      await db.schema.raw('CREATE INDEX IF NOT EXISTS ets_idx on events("createdOn");')
      await db.schema.raw('CREATE INDEX IF NOT EXISTS sld_idx on srv_logs("botId", timestamp);')
      await db.schema.raw('CREATE INDEX IF NOT EXISTS scu_idx on srv_channel_users("channel", "user_id");')
      await db.schema.raw('CREATE INDEX IF NOT EXISTS wcub_idx ON web_conversations("userId", "botId");')
      await db.schema.raw('CREATE INDEX IF NOT EXISTS wmcs_idx ON web_messages("conversationId", "sent_on" DESC);')
      await db.schema.raw(
        'CREATE INDEX IF NOT EXISTS wmcms_idx ON web_messages ("conversationId", message_type, sent_on DESC) WHERE message_type != \'visit\';'
      )
    } catch (err) {
      bp.logger.attachError(err).error('Could not add indices')
      return { success: false, message: 'Could not add indices' }
    }
    return { success: true, message: 'Configuration updated successfully' }
  }
}

export default migration
