import 'bluebird-global'
import _ from 'lodash'
import path from 'path'
import { unlinkSync } from 'fs'
import { DucklingEntityExtractor } from '.'
import { JOIN_CHAR } from '../../tools/token-utils'
import { SystemEntityCacheManager } from '../entity-cache-manager'

describe('Duckling Extract Multiple', () => {
  let duck: DucklingEntityExtractor
  let mockedFetch: jest.SpyInstance
  let testCachePath = path.join(' ', 'cache', 'testCache.json')
  beforeAll(() => {
    const duckCache = new SystemEntityCacheManager(testCachePath, true)
    duck = new DucklingEntityExtractor(duckCache)
    // @ts-ignore
    mockedFetch = jest.spyOn(duck, '_fetchDuckling')
  })

  beforeEach(async () => {
    await duck.configure(true, '')
    duck.resetCache()
    duck.enable()
  })

  afterEach(() => {
    mockedFetch.mockReset()
  })

  afterAll(() => {
    unlinkSync(testCachePath)
  })

  test('When disabled returns empty array for each input', async () => {
    duck.disable()
    const examples = ['this is one', 'this is two']
    const res = await duck.extractMultiple(examples, 'en')
    expect(mockedFetch).not.toHaveBeenCalled()
    res.forEach(r => {
      expect(r).toEqual([])
    })
  })

  test('calls extract with join char', async () => {
    const examples = ['this is one', 'this is two']
    mockedFetch.mockResolvedValue([])
    await duck.extractMultiple(examples, 'en')
    expect(mockedFetch.mock.calls[0][0]).toContain(JOIN_CHAR)
  })

  test('returns as many results as n examples with single batch', async () => {
    mockedFetch.mockResolvedValue([])
    const examples = ['this is one', 'this is two', 'this is three']
    const res = await duck.extractMultiple(examples, 'en')
    expect(res.length).toEqual(examples.length)
  })

  test('returns as many results as n examples with multiple batches', async () => {
    mockedFetch.mockResolvedValue([])
    const examples = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '11', '12', '13', '14']
    const res = await duck.extractMultiple(examples, 'en')
    expect(res.length).toEqual(examples.length)
  })

  test('good results for each examples', async () => {
    const examples = ['one two three', 'nothing', 'now and then']
    // expected        0123456789012____0123456____012345678901
    // with JoinChar   one two three::_::nothing::_::now and then
    //                 012345678901234567890123456789012345678901
    const extractedEntities = [
      { start: 0, end: 3 },
      { start: 4, end: 7 },
      { start: 8, end: 13 },
      { start: 30, end: 33 }
    ]

    mockedFetch.mockResolvedValueOnce(extractedEntities)
    const res = await duck.extractMultiple(examples, 'en')
    expect(res[0].length).toEqual(3)
    expect(res[0][0].start).toEqual(0)
    expect(res[0][0].end).toEqual(3)
    expect(res[0][1].start).toEqual(4)
    expect(res[0][1].end).toEqual(7)
    expect(res[0][2].start).toEqual(8)
    expect(res[0][2].end).toEqual(13)
    expect(res[1].length).toEqual(0)
    expect(res[2].length).toEqual(1)
    expect(res[2][0].end).toEqual(3)
    expect(res[2][0].start).toEqual(0)
  })

  test('cache is not used when useCache is false', async () => {
    const ex = 'one two three'
    mockedFetch.mockResolvedValue([])

    await duck.extractMultiple([ex], 'en', false)
    await duck.extractMultiple([ex], 'en', false)

    expect(mockedFetch).toHaveBeenCalledTimes(2)
    // make sure ex isn't removed from 2nd call
    expect(mockedFetch.mock.calls[0][0]).toEqual(mockedFetch.mock.calls[1][0])
  })

  test('cached results are returned in the same order', async () => {
    const cachedEx = 'one two three'
    const cachedExRes = [{ start: 0, end: 3 }]

    mockedFetch.mockResolvedValueOnce(cachedExRes)
    mockedFetch.mockResolvedValue([])

    const firstCall = await duck.extractMultiple([cachedEx], 'en', true)
    const secondCall = await duck.extractMultiple([cachedEx, 'nothing', 'nothing 2', cachedEx], 'en', true)

    expect(firstCall[0]).toEqual(cachedExRes)
    expect(firstCall[0]).toEqual(secondCall[0])
    expect(firstCall[0]).toEqual(secondCall[secondCall.length - 1])
    expect(mockedFetch.mock.calls[1][0]).not.toContain(cachedEx) // 2nd call removes cached items
  })
})
