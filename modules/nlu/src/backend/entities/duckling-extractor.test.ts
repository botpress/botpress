import 'bluebird-global'
import _ from 'lodash'

import { DucklingEntityExtractor, JOIN_CHAR } from './duckling_extractor'

class FakeCache {
  private _cache = {}
  get(key) {
    return this._cache[key]
  }
  set(key, val) {
    this._cache[key] = val
  }
  has(key) {
    return !!this._cache[key]
  }
  load() {}
  dump() {}
}

jest.mock(
  'lru-cache',
  () =>
    function() {
      return new FakeCache()
    }
)

describe('Extract Multiple', () => {
  let duck: DucklingEntityExtractor
  let mockedFetch: jest.SpyInstance
  beforeAll(() => {
    duck = new DucklingEntityExtractor()
    mockedFetch = jest.spyOn(duck, '_fetchDuckling')
  })

  beforeEach(async () => {
    await DucklingEntityExtractor.configure(true, '') // reset mocked cache
    DucklingEntityExtractor.enabled = true // mock axios to remove this line
  })

  afterEach(() => {
    mockedFetch.mockReset()
  })

  test('When disabled returns empty array for each input', async () => {
    DucklingEntityExtractor.enabled = false
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
      { meta: { start: 0, end: 3 } },
      { meta: { start: 4, end: 7 } },
      { meta: { start: 8, end: 13 } },
      { meta: { start: 30, end: 33 } }
    ]

    mockedFetch.mockResolvedValueOnce(extractedEntities)
    const res = await duck.extractMultiple(examples, 'en')
    expect(res[0].length).toEqual(3)
    expect(res[0][0].meta.start).toEqual(0)
    expect(res[0][0].meta.end).toEqual(3)
    expect(res[0][1].meta.start).toEqual(4)
    expect(res[0][1].meta.end).toEqual(7)
    expect(res[0][2].meta.start).toEqual(8)
    expect(res[0][2].meta.end).toEqual(13)
    expect(res[1].length).toEqual(0)
    expect(res[2].length).toEqual(1)
    expect(res[2][0].meta.start).toEqual(0)
    expect(res[2][0].meta.end).toEqual(3)
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
    const cachedExRes = [{ meta: { start: 0, end: 3 } }]

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
