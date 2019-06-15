import * as sdk from 'botpress/sdk'

export const migration = {
  info: {
    description: `Adds incomingEventId to the table web_messages`,
    type: 'database'
  },
  up: async (bp: typeof sdk) => {
    if (await bp.database.schema.hasColumn('web_messages', 'incomingEventId')) {
      return { success: 'Column incomingEventId already exists, skipping...' }
    }

    try {
      await bp.database.schema.alterTable('web_messages', table => {
        table.string('incomingEventId')
      })

      return { success: 'Field created successfully' }
    } catch (error) {
      return { failure: error.message }
    }
  }
}

export default migration
