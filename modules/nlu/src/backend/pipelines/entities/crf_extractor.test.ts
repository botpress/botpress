import 'bluebird-global'
import { readFileSync } from 'fs'
import _ from 'lodash'
import { EOL } from 'os'
import path from 'path'

import { FiveFolder } from '../../tools/five-fold'

import CRFExtractor from './crf_extractor'
import { tokenize } from './tagger'

const samplesFromFile = (filePath: string): string[] => {
  const text = readFileSync(filePath, 'utf8')
  return text
    .split(EOL)
    .map(x => x.trim())
    .filter(x => x.length)
}

describe('CRFExtractor', () => {
  test(
    'Accuracy',
    async () => {
      const samples = samplesFromFile(path.resolve(__dirname, './stubs/dataset.txt'))
      const newTest = new FiveFolder(samples)
      const extractor = new CRFExtractor()

      await newTest.fold(
        'Experiment #1',
        async training => extractor.train(training),
        async (testSet, record) => {
          await Promise.mapSeries(testSet, async sample => {
            const tokens = tokenize(sample)
            const tags = await extractor.tag(tokens)
            const results = _.zip(tokens.map(t => t.type), tags)
            results.forEach(c => record(c[0]!, c[1]!))
          })
        }
      )

      const results = newTest.getResults()
      console.log('Results', results['Experiment #1'])
    },
    60000 // timeout of 1m
  )
})
