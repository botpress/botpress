import * as sdk from 'botpress/sdk'

export const initDatabase = async (bp: typeof sdk) => {
  await bp.database.createTableIfNotExists('nlu_training_queue', table => {
    table.string('botId').notNullable()
    table.string('language').notNullable()
    table.string('status').notNullable()
    table.string('owner').nullable()
    table.float('progress').notNullable()
    table.timestamp('modifiedOn').notNullable()
    table.primary(['botId', 'language'])
  })
}
