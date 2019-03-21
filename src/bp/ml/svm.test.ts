import * as sdk from 'botpress/sdk'

import { Predictor, Trainer } from './svm'

test('Trainer XOR', async () => {
  // prettier-ignore
  const xor: sdk.MLToolkit.SVM.DataPoint[] = [
    { coordinates: [0, 0], label: '0' },
    { coordinates: [0, 1], label: '1' },
    { coordinates: [1, 0], label: '1' },
    { coordinates: [1, 1], label: '0' },
  ]

  const trainer = new Trainer()
  await trainer.train(xor, progress => console.log('SVM Progress: ', progress))

  const predictor = new Predictor(trainer.serialize())
  expect(await predictor.predict([0, 0])).toBe('0')
})
