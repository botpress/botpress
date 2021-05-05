import _ from 'lodash'

import { Data } from '../typings'

import split from './split-dataset'

const SEED = 42

describe('split-dataset', () => {
  test('split-dataset with even kfold', async () => {
    // arrange
    const dataset: Data[] = [
      [[0, 0, 0], 0],
      [[0, 0, 1], 1],
      [[0, 1, 0], 0],
      [[0, 1, 1], 1],
      [[1, 0, 0], 0],
      [[1, 0, 1], 1],
      [[1, 1, 0], 0],
      [[1, 1, 1], 1]
    ]

    const kfold = 4

    // act
    const res = split(dataset, SEED, kfold)

    // assert
    const expectedNbOfSplit = 4
    const expectedNbOfTestSamplesPerSplit = 2
    const expectedNbOfTrainSamplesPerSplit = 6

    expect(res.length).toBe(expectedNbOfSplit)

    for (const ss of res) {
      const { train, test } = ss
      expect(test.length).toBe(expectedNbOfTestSamplesPerSplit)
      expect(train.length).toBe(expectedNbOfTrainSamplesPerSplit)
    }
  })

  test('split-dataset with uneven kfold', async () => {
    // arrange
    const dataset: Data[] = [
      [[0, 0, 0], 0],
      [[0, 0, 1], 1],
      [[0, 1, 0], 0],
      [[0, 1, 1], 1],
      [[1, 0, 0], 0],
      [[1, 0, 1], 1]
    ]

    const kfold = 4

    // act
    const res = split(dataset, SEED, kfold)

    // assert
    const expectedNbOfSplit = 4
    const expectedNbOfTestSamplesPerSplit = 1
    const expectedNbOfTrainSamplesPerSplit = 5

    expect(res.length).toBe(expectedNbOfSplit)

    for (const ss of res) {
      const { train, test } = ss
      expect(test.length).toBe(expectedNbOfTestSamplesPerSplit)
      expect(train.length).toBe(expectedNbOfTrainSamplesPerSplit)
    }
  })

  test('split-dataset never gives a training set of one class', async () => {
    // arrange
    const dataset: Data[] = [
      [[0, 0, 0, 0], 1],
      [[0, 0, 0, 1], 0],
      [[0, 0, 1, 0], 0],
      [[0, 0, 1, 1], 0],
      [[0, 1, 0, 0], 0],
      [[0, 1, 0, 1], 0],
      [[0, 1, 1, 0], 0],
      [[0, 1, 1, 1], 0],
      [[1, 0, 0, 0], 0],
      [[1, 0, 0, 1], 0],
      [[1, 0, 1, 0], 0],
      [[1, 0, 1, 1], 0],
      [[1, 1, 0, 0], 0],
      [[1, 1, 0, 1], 0],
      [[1, 1, 1, 0], 0],
      [[1, 1, 1, 1], 1]
    ]

    const kfold = 16

    // act
    const res = split(dataset, SEED, kfold)

    // assert
    for (const ss of res) {
      const { train } = ss
      const nClass = _(train)
        .map(t => t[1])
        .uniq()
        .value().length

      expect(nClass).toBe(2)
    }
  })
})
