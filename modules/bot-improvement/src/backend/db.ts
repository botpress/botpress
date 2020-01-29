import { SDK } from '.'

export default (bp: SDK) => {
  const knex = bp.database

  const initialize = async () => {
    if (!knex) {
      throw new Error('you must initialize the database before')
    }

    await knex.createTableIfNotExists('bot_improvement_feedback_items', table => {
      table.increments('id').primary()
      table
        .integer('eventId')
        .unsigned()
        .notNullable()
      table.string('state').notNullable()
      table.string('correctedActionType').notNullable()
      table.string('correctedObjectId').notNullable()
    })
  }

  return { initialize }
}
