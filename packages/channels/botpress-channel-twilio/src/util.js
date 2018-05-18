import _ from 'lodash'

function extractNumber(event) {
  const number =
    _.get(event, 'user.number') ||
    _.get(event, 'number') ||
    _.get(event, 'raw.to') ||
    _.get(event, 'raw.number') ||
    _.get(event, 'user.userId')

  if (!number) {
    throw new Error('Could not extract user phone number number from event')
  }

  return number
}

module.exports = { extractNumber }
