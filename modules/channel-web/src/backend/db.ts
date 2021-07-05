import * as sdk from 'botpress/sdk'
import _ from 'lodash'

export default class WebchatDb {
  private readonly MAX_RETRY_ATTEMPTS = 3
  private knex: sdk.KnexExtended
  private users: typeof sdk.users

  constructor(private bp: typeof sdk) {
    this.users = bp.users
    this.knex = bp.database
  }

  async getUserInfo(userId: string, user: sdk.User) {
    if (!user) {
      user = (await this.users.getOrCreateUser('web', userId)).result
    }

    let fullName = 'User'

    if (user && user.attributes) {
      const { first_name, last_name } = user.attributes

      if (first_name || last_name) {
        fullName = `${first_name || ''} ${last_name || ''}`.trim()
      }
    }

    return { fullName, avatar_url: _.get(user, 'attributes.picture_url') }
  }

  async getFeedbackInfoForEventIds(target: string, eventIds: string[]) {
    return this.knex('events')
      .select(['incomingEventId', 'feedback'])
      .whereIn('incomingEventId', eventIds)
      .andWhere({ target, direction: 'incoming' })
  }
}
