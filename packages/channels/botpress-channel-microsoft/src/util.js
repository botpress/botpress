import _ from 'lodash'

export function getUserId(event) {
  const userId =
    _.get(event, 'user.id') ||
    _.get(event, 'user.userId') ||
    _.get(event, 'userId') ||
    _.get(event, 'raw.from') ||
    _.get(event, 'raw.userId') ||
    _.get(event, 'raw.user.id')

  if (!userId) {
    throw new Error('Could not find userId in the incoming event.')
  }

  return userId
}
