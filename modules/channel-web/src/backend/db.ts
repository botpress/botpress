import * as sdk from 'botpress/sdk'

export default class WebchatDb {
  private knex: sdk.KnexExtended

  constructor(bp: typeof sdk) {
    this.knex = bp.database
  }

  async getFeedbackInfoForEventIds(target: string, eventIds: string[]) {
    return this.knex('events')
      .select(['incomingEventId', 'feedback'])
      .whereIn('incomingEventId', eventIds)
      .andWhere({ target, direction: 'incoming' })
  }
}
