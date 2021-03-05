import 'bluebird-global'
import { unlinkSync } from 'fs'
import path from 'path'
import { EntityExtractionResult } from '../typings'
import { SystemEntityCacheManager } from './entity-cache-manager'

describe('System Entity Cache', () => {
  let testCache: SystemEntityCacheManager
  let testCachePath = path.join(' ', 'cache', 'testCache.json')
  let inputExemples: string[]
  beforeEach(async () => {
    testCache = new SystemEntityCacheManager(testCachePath, true)
    inputExemples = [
      'Hello my name is pedro',
      'I know this sentences are not the same than the entity bellow',
      "But... we don't care, it's just a test okay ?!"
    ]
    const inputResults: EntityExtractionResult[][] = [
      [
        {
          confidence: 1,
          type: 'phoneNumber',
          value: '+33 6 66 66 66 66',
          start: 1,
          end: 2,
          metadata: {
            source: '+33 6 66 66 66 66',
            entityId: 'system.phoneNumber',
            extractor: 'system',
            unit: 'phonenumber'
          }
        },
        {
          confidence: 1,
          type: 'url',
          value: 'www.theCuteBoys.com',
          start: 19,
          end: 36,
          metadata: {
            source: 'www.theCuteBoys.com',
            entityId: 'system.url',
            extractor: 'system',
            unit: 'url'
          }
        }
      ],
      [
        {
          confidence: 1,
          type: 'ip',
          value: '135.19.84.102',
          start: 19,
          end: 32,
          metadata: {
            source: '135.19.84.102',
            entityId: 'system.ip',
            extractor: 'system',
            unit: 'ip'
          }
        }
      ],
      [
        {
          confidence: 1,
          type: 'mention',
          value: '@pedro',
          start: 8,
          end: 14,
          metadata: {
            source: '@pedro',
            entityId: 'system.mention',
            extractor: 'system',
            unit: 'mention'
          }
        }
      ]
    ]

    await testCache.cacheBatchResults(inputExemples, inputResults)
  })

  afterAll(() => {
    unlinkSync(testCachePath)
  })

  test('Return good split', async () => {
    const [testCached, testToFetch] = testCache.splitCacheHitFromCacheMiss(
      ['Hey ! Do you love me ?', 'Yes for sure I love you !', ...inputExemples],
      true
    )

    expect(testCached.length).toEqual(3)
    expect(testToFetch.length).toEqual(2)
  })

  test('Return good split without using cache', async () => {
    const [testCached, testToFetch] = testCache.splitCacheHitFromCacheMiss(
      ['Hey ! Do you love me ?', 'Yes for sure I love you !', ...inputExemples],
      false
    )

    expect(testCached.length).toEqual(0)
    expect(testToFetch.length).toEqual(5)
  })

  test('Reset the cache', async () => {
    testCache.reset()

    const [testCached, testToFetch] = testCache.splitCacheHitFromCacheMiss(inputExemples, true)

    expect(testCached.length).toEqual(0)
    expect(testToFetch.length).toEqual(3)
  })

  test('Cache is restored', async () => {
    testCache.restoreCache()

    const [testCached, testToFetch] = testCache.splitCacheHitFromCacheMiss(inputExemples, true)

    expect(testCached.length).toEqual(3)
    expect(testToFetch.length).toEqual(0)
  })
})
