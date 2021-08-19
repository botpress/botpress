import _ from 'lodash'
import { BOTID_REGEX, LEGACY_BOTID_REGEX } from './validation'

describe('BotId validation', () => {
  const validLegacyBotIDs = ['bot123', 'bot_123', 'lol-123', 'bo-t-the-valid-123', 'bo_t-the-valid-123']
  const invalidLegacyBotIDs = ['_bot123', '-bot123', '.bot123', '|bot123', '~bot123', 'bot123_', 'bot123-']

  const validWSPrefix = [
    'asd',
    'a1s',
    'a_s',
    'a_1',
    'a-1',
    '1_a',
    '1-a',
    'as-',
    'as_',
    '1s-',
    '1s_',
    'a1',
    '1a',
    'a-',
    'a_',
    '1_',
    '1-'
  ]
  const invalidWSPrefix = ['-', '_', '.', '/', '?', '|', '_a', '-a']
  const validBotIds = _.flatMap(validLegacyBotIDs, id => validWSPrefix.map(pref => `${pref}_-_${id}`))
  const invalidBotIds = [
    ...validLegacyBotIDs,
    ...invalidLegacyBotIDs,
    ..._.flatMap(validLegacyBotIDs, id => invalidWSPrefix.map(prefix => `${prefix}_-_${id}`)),
    ...validBotIds.map(id => id.replace('_-_', ''))
  ]

  test('Legacy bot id validation should pass', () => {
    for (let id of validLegacyBotIDs) {
      expect(id).toMatch(LEGACY_BOTID_REGEX)
    }

    for (let id of invalidLegacyBotIDs) {
      expect(id).not.toMatch(LEGACY_BOTID_REGEX)
    }
  })

  test('New worspace id bot id validation should pass', () => {
    for (let id of validBotIds) {
      expect(id).toMatch(BOTID_REGEX)
    }

    for (let id of invalidBotIds) {
      expect(id).not.toMatch(BOTID_REGEX)
    }
  })
})
