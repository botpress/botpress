import 'bluebird-global'
import _ from 'lodash'
import path from 'path'
import { unlinkSync } from 'fs'
import { MicrosoftEntityExtractor } from '.'
import { SystemEntityCacheManager } from '../entity-cache-manager'

describe('Microsoft Extract Multiple', () => {
  let microsoft: MicrosoftEntityExtractor
  let testCachePath = path.join(process.APP_DATA_PATH || '', 'cache', 'testCache.json')
  beforeAll(() => {
    const duckCache = new SystemEntityCacheManager(testCachePath, true)
    microsoft = new MicrosoftEntityExtractor(duckCache)
  })

  beforeEach(async () => {
    microsoft.resetCache()
  })

  afterAll(() => {
    unlinkSync(testCachePath)
  })

  test('Return nothing for unsupported lang', async () => {
    const examples = ['один два три четыре пять', 'Я говорю по русски сегодня, но и завтра вечером']
    const res = await microsoft.extractMultiple(examples, 'ru')
    res.forEach(r => {
      expect(r).toEqual([])
    })
  })

  // Note we could add numbers as global recognizers as well.
  test('Return phone number, ip address, mention, hashtag, email, url for unsupported lang', async () => {
    const results = [
      [
        {
          confidence: 1,
          type: 'phoneNumber',
          value: '+33 6 66 66 66 66',
          start: 19,
          end: 36,
          metadata: {
            source: '+33 6 66 66 66 66',
            entityId: 'system.phoneNumber',
            extractor: 'system',
            unit: 'phonenumber'
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
      ],
      [
        {
          confidence: 1,
          type: 'hashtag',
          value: '#sport',
          start: 24,
          end: 30,
          metadata: {
            source: '#sport',
            entityId: 'system.hashtag',
            extractor: 'system',
            unit: 'hashtag'
          }
        }
      ],
      [
        {
          confidence: 1,
          type: 'email',
          value: 'hello@helloworld.com',
          start: 25,
          end: 45,
          metadata: {
            source: 'hello@helloworld.com',
            entityId: 'system.email',
            extractor: 'system',
            unit: 'email'
          }
        }
      ],
      [
        {
          confidence: 1,
          type: 'url',
          value: 'www.thecuteboys.com',
          start: 9,
          end: 28,
          metadata: {
            source: 'www.thecuteboys.com',
            entityId: 'system.url',
            extractor: 'system',
            unit: 'url'
          }
        }
      ]
    ]

    const examples = [
      'мой номер телефона +33 6 66 66 66 66',
      'Можете попробовать 135.19.84.102, пожалуйста?',
      'Привет, @pedro, можешь помочь?',
      'Вы смотрели новый канал #sport? Это потрясающе',
      'пн электронная почта est hello@helloworld.com',
      'Мой сайт www.thecuteboys.com, пожалуйста, напишите отзыв'
    ]
    const res = await microsoft.extractMultiple(examples, 'ru')
    res
      .map((val, idx) => [val, results[idx]])
      .forEach(([prem, hyp]) => {
        expect(prem).toEqual(hyp)
      })
  })

  test('returns as many results as n examples with single batch', async () => {
    const examples = ['this is one', 'this is two', 'this is three']
    const res = await microsoft.extractMultiple(examples, 'en')
    expect(res.length).toEqual(examples.length)
  })

  test('returns as many results as n examples with multiple batches', async () => {
    const examples = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '11', '12', '13', '14']
    const res = await microsoft.extractMultiple(examples, 'en')
    expect(res.length).toEqual(examples.length)
  })

  test('good results for each examples', async () => {
    const examples = ['one two three', 'nothing', 'the 3rd of december 2022 at 4:56pm and then']
    // expected        0123456789012____0123456____012345678901
    // with JoinChar   one two three::_::nothing::_::now and then
    //                 012345678901234567890123456789012345678901
    const result = [
      [
        {
          confidence: 1,
          type: 'number',
          value: '1',
          start: 0,
          end: 3,
          metadata: {
            source: 'one',
            entityId: 'system.number',
            extractor: 'system',
            unit: 'number'
          }
        },
        {
          confidence: 1,
          type: 'number',
          value: '2',
          start: 4,
          end: 7,
          metadata: {
            source: 'two',
            entityId: 'system.number',
            extractor: 'system',
            unit: 'number'
          }
        },
        {
          confidence: 1,
          type: 'number',
          value: '3',
          start: 8,
          end: 13,
          metadata: {
            source: 'three',
            entityId: 'system.number',
            extractor: 'system',
            unit: 'number'
          }
        }
      ],
      [],
      [
        {
          confidence: 1,
          type: 'ordinal',
          value: '3',
          start: 4,
          end: 7,
          metadata: {
            source: '3rd',
            entityId: 'system.ordinal',
            extractor: 'system',
            unit: 'ordinal'
          }
        },
        {
          confidence: 1,
          type: 'number',
          value: '2022',
          start: 20,
          end: 24,
          metadata: {
            source: '2022',
            entityId: 'system.number',
            extractor: 'system',
            unit: 'number'
          }
        },
        {
          confidence: 1,
          type: 'number',
          value: '4',
          start: 28,
          end: 29,
          metadata: {
            source: '4',
            entityId: 'system.number',
            extractor: 'system',
            unit: 'number'
          }
        },
        {
          confidence: 1,
          type: 'time',
          value: '2022-12-03 16:56:00',
          start: 0,
          end: 34,
          metadata: {
            source: 'the 3rd of december 2022 at 4:56pm',
            entityId: 'system.time',
            extractor: 'system',
            unit: 'datetime'
          }
        }
      ]
    ]

    const res = await microsoft.extractMultiple(examples, 'en')

    expect(res).toEqual(result)
  })
})
