import Knex from 'knex'

export const up = async (knex: Knex): Promise<void> => {
  return knex.schema.alterTable('web_messages', table => {
    table.string('incomingEventId')
  })
}
export const down = async (knex: Knex): Promise<void> => {
  return knex.schema.alterTable('web_messages', table => {
    table.dropColumn('incomingEventId')
  })
}
