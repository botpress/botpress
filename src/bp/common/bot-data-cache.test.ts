import 'jest-extended'

import _ from 'lodash'

import { FlowView } from 'common/typings'
import { BotDataCache } from './bot-data-cache'

const FLOW = () => ({
  name: RANDOM_STRING(),
  startNode: RANDOM_STRING(),
  nodes: [
    {
      name: RANDOM_STRING(),
      x: RANDOM_NUMBER(),
      y: RANDOM_NUMBER()
    }
  ],
  links: [
    {
      source: RANDOM_STRING(),
      target: RANDOM_STRING(),
      points: [
        {
          x: RANDOM_NUMBER(),
          y: RANDOM_NUMBER()
        }
      ]
    }
  ]
})
const BOT_ID = 'bot_123'
const OTHER_BOT_ID = 'bot_321'
const RANDOM_NUMBER = () => Math.random() * 1000
const RANDOM_STRING = () =>
  Math.random()
    .toString(36)
    .substring(7)

describe('FlowCache', () => {
  let cache: BotDataCache<FlowView>
  let flows: FlowView[]

  beforeEach(() => {
    cache = new BotDataCache<FlowView>('name')
    flows = Array.from(new Array(10), _ => FLOW())
  })

  describe('Get', () => {
    it("Returns all the bot's flows from the cache", () => {
      cache.set(BOT_ID, flows)

      const cacheFlows = cache['_cache']

      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID)).toEqual(flows)
      expect(Array.from(cacheFlows.get(BOT_ID)!.values())).toEqual(flows)
    })

    it('Returns a particular flow for a given bot from the cache', () => {
      cache.set(BOT_ID, flows)

      const singleFlow = flows[0]
      const cacheFlows = cache['_cache']

      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID)).toEqual(flows)
      expect(cache.get(BOT_ID, singleFlow.name)).toEqual(singleFlow)
      expect(cacheFlows.get(BOT_ID)!.get(singleFlow.name)).toEqual(singleFlow)
    })

    it('Returns undefined if the bot is not found in the cache', () => {
      expect(OTHER_BOT_ID).not.toEqual(BOT_ID)

      cache.set(OTHER_BOT_ID, flows)

      const randomName = RANDOM_STRING()
      const cacheFlows = cache['_cache']

      expect(cache.get(BOT_ID)).toBeUndefined()
      expect(cache.get(BOT_ID, randomName)).toBeUndefined()
      expect(cacheFlows.get(BOT_ID)).toBeUndefined()
    })

    it('Returns undefined if the flow cannot be found', () => {
      cache.set(BOT_ID, flows)

      const randomName = RANDOM_STRING()

      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID, randomName)).toBeUndefined()
    })
  })

  describe('Set', () => {
    it('Sets the bot with its flows in the cache', () => {
      cache.set(BOT_ID, flows)

      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID)).toEqual(flows)
    })

    it('Sets the bot with its one flow in the cache', () => {
      const singleFlow = flows[0]
      cache.set(BOT_ID, singleFlow)

      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID, singleFlow.name)).toEqual(singleFlow)
    })

    it('Overrides the bot flow when its already present in the cache', () => {
      cache.set(BOT_ID, flows)

      const singleFlow = _.cloneDeep(flows[0])
      singleFlow.description = 'a new description'

      cache.set(BOT_ID, singleFlow)

      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID, singleFlow.name)).toEqual(singleFlow)
    })
  })

  describe('Remove', () => {
    it('Removes a particular flow for a given bot', () => {
      expect(OTHER_BOT_ID).not.toEqual(BOT_ID)

      const singleFlow = flows[0]

      cache.set(BOT_ID, flows)
      cache.set(OTHER_BOT_ID, flows)

      cache.remove(BOT_ID, singleFlow.name)

      expect(cache.get(OTHER_BOT_ID)).not.toBeUndefined()
      expect(cache.get(OTHER_BOT_ID)).toEqual(flows)
      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID, singleFlow.name)).toBeUndefined()
    })

    it("Does not remove a particular flow if it is not part of the bot's flows", () => {
      const singleFlow = FLOW()

      cache.set(BOT_ID, flows)
      cache.remove(BOT_ID, singleFlow.name)

      expect(cache.get(BOT_ID)).not.toBeUndefined()
      expect(cache.get(BOT_ID)).toEqual(flows)
      expect(cache.get(BOT_ID, singleFlow.name)).toBeUndefined()
    })

    it('Removes a particular bot from the cache', () => {
      expect(OTHER_BOT_ID).not.toEqual(BOT_ID)

      cache.set(BOT_ID, flows)
      cache.set(OTHER_BOT_ID, flows)

      cache.remove(BOT_ID)

      expect(cache.get(OTHER_BOT_ID)).not.toBeUndefined()
      expect(cache.get(OTHER_BOT_ID)).toEqual(flows)
      expect(cache.get(BOT_ID)).toBeUndefined()
    })

    it('Does nothing if the bot is not in the cache', () => {
      try {
        cache.remove(BOT_ID)
        expect(cache.get(BOT_ID)).toBeUndefined()
      } catch (e) {
        fail(e)
      }
    })
  })

  describe('Has', () => {
    it('Returns true if the bot is found in the cache', () => {
      cache.set(BOT_ID, flows)

      expect(cache.has(BOT_ID)).toBeTrue()
    })

    it('Returns false if the bot is not found in the cache', () => {
      expect(OTHER_BOT_ID).not.toEqual(BOT_ID)

      cache.set(BOT_ID, flows)

      expect(cache.has(OTHER_BOT_ID)).toBeFalse()
    })

    it("Returns true if the flow is found in the bot's cache", () => {
      const flow = flows[0]
      cache.set(BOT_ID, flows)

      expect(cache.has(BOT_ID)).toBeTrue()
      expect(cache.has(BOT_ID, flow.name)).toBeTrue()
    })

    it("Returns false if the flow is not found in the bot's cache", () => {
      expect(OTHER_BOT_ID).not.toEqual(BOT_ID)

      const flow = flows[0]
      cache.set(BOT_ID, flows)

      const randomName = RANDOM_STRING()

      expect(cache.has(OTHER_BOT_ID)).toBeFalse()
      expect(cache.has(OTHER_BOT_ID, flow.name)).toBeFalse()
      expect(cache.has(BOT_ID, randomName)).toBeFalse()
    })
  })

  describe('IsEmpty', () => {
    it('Returns true if the cache is empty', () => {
      const cacheFlows = cache['_cache']

      expect(cache.isEmpty()).toBeTrue()
      expect(cache.isEmpty(BOT_ID)).toBeTrue()
      expect(cacheFlows.size === 0).toBeTrue()
    })

    it('Returns false if the cache is not empty', () => {
      cache.set(BOT_ID, [])
      const cacheFlows = cache['_cache']

      expect(cache.isEmpty()).toBeFalse()
      expect(cacheFlows.size === 0).toBeFalse()
    })

    it('Returns true if the bot has no flow', () => {
      cache.set(BOT_ID, [])
      const cacheFlows = cache['_cache']

      expect(cache.isEmpty(BOT_ID)).toBeTrue()
      expect(cacheFlows.get(BOT_ID)!.size === 0).toBeTrue()
    })

    it('Returns false if the bot has some flows', () => {
      cache.set(BOT_ID, flows)
      const cacheFlows = cache['_cache']

      expect(cache.isEmpty(BOT_ID)).toBeFalse()
      expect(cacheFlows.get(BOT_ID)!.size === 0).toBeFalse()
    })
  })
})
