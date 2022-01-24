import Database from 'core/database'
import { createDatabaseSuite } from 'core/database/index.tests'
import { PersistedConsoleLogger } from 'core/logger'

import { createSpyObject, MockObject } from '../misc/utils'
import { KeyValueStore } from './kvs-service'

createDatabaseSuite('KVS', (database: Database) => {
  const logger: MockObject<PersistedConsoleLogger> = createSpyObject<PersistedConsoleLogger>()
  const kvs = new KeyValueStore(database, logger.T)
  const BOTID = 'welcome-bot'
  const KEY = 'key'
  const defaultValue = {
    profile: {
      firstName: 'Bob',
      lastName: 'Ross',
      address: {
        street: '123 Awesome Street',
        city: 'Awesome City'
      }
    },
    stats: {
      awesomeness: 'Chuck Norris Level'
    }
  }

  beforeEach(async () => {
    try {
      await kvs.forBot(BOTID).set(KEY, defaultValue)
    } catch (err) {}
  })

  describe('Get', () => {
    it("Returns undefined if key doesn't exist", async () => {
      const value = await kvs.forBot(BOTID).get('does-not-exist')
      expect(value).toBeUndefined()
    })

    it('Returns value if key exists', async () => {
      const value = await kvs.forBot(BOTID).get(KEY)
      expect(value).toEqual(defaultValue)
    })

    it('Returns value at path if key exists', async () => {
      const value = await kvs.forBot(BOTID).get(KEY, 'profile.firstName')
      expect(value).toEqual('Bob')
    })
  })

  describe('Set', () => {
    it("Sets value if key doesn't exist", async () => {
      const key = 'otherKey'
      const expected = 'value'
      await kvs.forBot(BOTID).set(key, expected)

      const value = await kvs.forBot(BOTID).get(key)
      expect(expected).toEqual(value)
    })

    it('Overwrite existing keys', async () => {
      const expected = 'new value'
      await kvs.forBot(BOTID).set(KEY, expected)

      const value = await kvs.forBot(BOTID).get(KEY)
      expect(value).toEqual(expected)
    })

    it('Overwrite existing keys at path but keep existing values', async () => {
      await kvs.forBot(BOTID).set(KEY, {}, 'profile')

      const value = await kvs.forBot(BOTID).get(KEY)
      expect(value.profile).toEqual({})
      expect(value.stats).toEqual({
        awesomeness: 'Chuck Norris Level'
      })
    })

    it('Deep overwrite', async () => {
      const newValue = 'The Great Bob'
      await kvs.forBot(BOTID).set(KEY, newValue, 'profile.firstName')

      const value = await kvs.forBot(BOTID).get(KEY)
      expect(value.profile.firstName).toEqual(newValue)
      expect(value.profile.lastName).toEqual('Ross')
      expect(value.profile.address).toEqual({
        street: '123 Awesome Street',
        city: 'Awesome City'
      })
    })
  })

  describe('global/scoped', () => {
    test('kvs entries of global and scoped should not interfer', async () => {
      // Arrange && Act
      const key = 'gordon-ramsay-favorite-number'
      await kvs.forBot('bot1').set(key, '1')
      await kvs.global().set(key, '2')
      await kvs.forBot('bot1').set(key, '666')
      await kvs.forBot('bot2').set(key, '69')
      await kvs.global().set(key, '42')

      const globalActual = await kvs.global().get(key)
      const bot1Actual = await kvs.forBot('bot1').get(key)
      const bot2actual = await kvs.forBot('bot2').get(key)

      // Assert
      expect(globalActual).toEqual('42')
      expect(bot1Actual).toEqual('666')
      expect(bot2actual).toEqual('69')
    })
  })
})
