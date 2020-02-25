import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export const rankingColumns = [
  'topicName',
  'topicConfidence',
  'topicIntentName',
  'topicIntentConfidence',
  'topicIntentConfidenceAdjusted', // topicConfidence * topicIntentConfidence..formula need adjustment
  'topicIntentType'
]

export const nbRankingIntent = 3

export default class Database {
  private knex: sdk.KnexExtended

  constructor(bp: typeof sdk) {
    this.knex = bp.database
  }

  async initialize() {
    /// await this.knex.schema.dropTable('ndu')

    return this.knex.createTableIfNotExists('ndu', table => {
      table.increments('id').primary()
      table.string('incomingEventId')
      table.string('currentTopicName')
      table.string('currentTopicGoal')
      table.string('currentTopicLastActionName')
      table.string('currentTopicLastActionSince')

      for (let i = 1; i < 1 + nbRankingIntent; i++) {
        rankingColumns.forEach(col => table.string(`ranking${i}${col}`))
      }

      table.jsonb('nduDecisionActions')
      table.string('nduDecisionConfidence')
      table.string('feedbackUser').nullable()
      table.string('adminDecisionOverride').nullable()
      table.string('adminDecisionWho').nullable()
      table.timestamp('created_on')
      table.timestamp('adminDecisionTs')
    })
  }

  async insertData(data: any) {
    await this.knex('ndu').insert({
      ...data,
      nduDecisionActions: this.knex.json.set(data.nduDecisionActions || [])
    })
  }
}
