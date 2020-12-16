import { getUnitAndValue } from './map-duckling'
import { DucklingDimension, DucklingType } from './typings'

/**
 * Unit tests here are true examples of data structures
 * that where returned by Duckling and made extraction fail.
 * Make sure to add a test any time, duckling extraction fails. - FL
 */

test('dimension time is supported', () => {
  // arrange
  const duck = {
    body: 'next week',
    start: 12,
    value: {
      values: [
        {
          value: '2020-10-12T00:00:00.000-04:00',
          grain: 'week',
          type: 'value' as 'value'
        }
      ],
      value: '2020-10-12T00:00:00.000-04:00',
      grain: 'week',
      type: 'value' as DucklingType
    },
    end: 21,
    dim: 'time' as DucklingDimension,
    latent: false
  }

  // act
  const { unit, value } = getUnitAndValue(duck)

  // assert
  expect(value).toBe('2020-10-12T00:00:00.000-04:00')
  expect(unit).toBe('week')
})

test('dimension time with type interval is supported', () => {
  // arrange
  const duck = {
    body: 'tonight',
    start: 27,
    value: {
      values: [
        {
          to: {
            value: '2020-10-09T00:00:00.000-04:00',
            grain: 'hour'
          },
          from: {
            value: '2020-10-08T18:00:00.000-04:00',
            grain: 'hour'
          },
          type: 'interval' as 'interval'
        }
      ],
      to: {
        value: '2020-10-09T00:00:00.000-04:00',
        grain: 'hour'
      },
      from: {
        value: '2020-10-08T18:00:00.000-04:00',
        grain: 'hour'
      },
      type: 'interval' as DucklingType
    },
    end: 34,
    dim: 'time' as DucklingDimension,
    latent: false
  }

  // act
  const { unit, value } = getUnitAndValue(duck)

  // assert
  expect(value).toBe('2020-10-08T18:00:00.000-04:00')
  expect(unit).toBe('hour')
})

test('number is supported', () => {
  // arrange
  const duck = {
    body: '500',
    start: 0,
    value: {
      value: 500,
      type: 'value' as 'value'
    },
    end: 3,
    dim: 'number' as DucklingDimension,
    latent: false
  }

  // act
  const { unit, value } = getUnitAndValue(duck)

  // assert
  expect(value).toBe(500)
  expect(unit).toBe('')
})

test('zero is supported', () => {
  // arrange
  const duck = {
    body: '0',
    start: 0,
    value: {
      value: 0,
      type: 'value' as 'value'
    },
    end: 1,
    dim: 'number' as DucklingDimension,
    latent: false
  }

  // act
  const { unit, value } = getUnitAndValue(duck)

  // assert
  expect(value).toBe(0)
  expect(unit).toBe('')
})

test('time interval with no from date should still work', () => {
  // arrange
  const duck = {
    body: 'until 6:00pm tonight',
    start: 256,
    value: {
      values: [
        {
          to: {
            value: '2020-10-22T18:00:00.000-04:00',
            grain: 'minute'
          },
          type: 'interval' as 'interval'
        }
      ],
      to: {
        value: '2020-10-22T18:00:00.000-04:00',
        grain: 'minute'
      },
      type: 'interval' as 'interval'
    },
    end: 276,
    dim: 'time' as 'time',
    latent: false
  }

  // act
  const { unit, value } = getUnitAndValue(duck)

  // assert
  expect(value).toBe('2020-10-22T18:00:00.000-04:00')
  expect(unit).toBe('minute')
})
