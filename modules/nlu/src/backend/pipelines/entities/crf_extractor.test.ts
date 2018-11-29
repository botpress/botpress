import 'bluebird-global'
import _ from 'lodash'
import path from 'path'

import { FiveFolder } from '../../tools/five-fold'

import CRFExtractor from './crf_extractor'

describe('CRFExtractor', () => {
  test(
    'Accuracy',
    async () => {
      const samples = CRFExtractor.samplesFromFile(path.resolve(__dirname, './stubs/dataset.txt'))
      const newTest = new FiveFolder(samples)
      const extractor = new CRFExtractor()

      await newTest.fold(
        'Experiment #1',
        async training => extractor.train(training),
        async (test, record) => {
          await Promise.mapSeries(test, async sample => {
            const tags = await extractor.predict(sample)
            const expected = sample.map(t => t.type)
            const results = _.zip(expected, tags)
            results.forEach(c => record(c[0]!, c[1]!))
          })
        }
      )

      const results = newTest.getResults()
      console.log('Results', results['Experiment #1'])
      expect(results['Experiment #1'].all.f1).toBeGreaterThan(0.85)
    },
    60000 // timeout of 1m
  )
})
