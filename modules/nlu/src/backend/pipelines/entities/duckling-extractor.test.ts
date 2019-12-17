import 'bluebird-global'
import _ from 'lodash'

import { DucklingEntityExtractor, JOIN_CHAR } from './duckling_extractor'

describe('Extract Multiple', () => {
  let duck: DucklingEntityExtractor
  let mockedFetch: jest.SpyInstance
  beforeAll(() => {
    duck = new DucklingEntityExtractor()
    mockedFetch = jest.spyOn(duck, 'fetchDuckling')
  })

  beforeEach(() => {
    DucklingEntityExtractor.enabled = true
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
    DucklingEntityExtractor.enabled = true
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

  // TODO test caching
})
