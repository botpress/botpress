import * as sdk from 'botpress/sdk'

import '../import-rewire'

import { Predictor, Trainer } from './svm'

test('Trainer', async () => {
  // prettier-ignore
  const line: sdk.MLToolkit.SVM.DataPoint[] = [
    { coordinates: [0, 0], label: 'A' },
    { coordinates: [0, 1], label: 'A' },
    { coordinates: [1, 0], label: 'B' },
    { coordinates: [1, 1], label: 'B' }
  ]

  const trainer = new Trainer({ classifier: 'C_SVC', kernel: 'LINEAR', c: 1 })
  await trainer.train(line)

  const predictor = new Predictor(trainer.serialize())

  const r1 = await predictor.predict([0, 0])
  const r2 = await predictor.predict([1, 1])
  const r3 = await predictor.predict([0, 1])
  const r4 = await predictor.predict([1, 0])

  expect(r1[0].label).toBe('A')
  expect(r2[0].label).toBe('B')
  expect(r3[0].label).toBe('A')
  expect(r4[0].label).toBe('B')
})
