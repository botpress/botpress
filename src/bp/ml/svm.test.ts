import * as sdk from 'botpress/sdk'

import '../import-rewire'

import { Predictor, Trainer } from './svm'

test('Trainer XOR', async () => {
  // prettier-ignore
  const xor: sdk.MLToolkit.SVM.DataPoint[] = [
    { coordinates: [0, 0], label: 'A' },
    { coordinates: [0, 1], label: 'B' },
    { coordinates: [1, 0], label: 'B' },
    { coordinates: [1, 1], label: 'A' },
  ]

  const trainer = new Trainer()
  await trainer.train(xor)

  const predictor = new Predictor(trainer.serialize())

  const rA = await predictor.predict([0, 0])
  const rB = await predictor.predict([1, 1])

  expect(rA[0].label).toBe('A')
  expect(rB[0].label).toBe('B')
})
