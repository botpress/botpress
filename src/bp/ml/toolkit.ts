import * as sdk from 'botpress/sdk'

const { Tagger, Trainer } = require('./crfsuite')
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'

const MLToolkit: typeof sdk.MLToolkit = {
  CRF: {
    createTagger: Tagger,
    createTrainer: Trainer
  },
  FastText: { Model: FastTextModel },
  Strings: { computeLevenshteinDistance, computeJaroWinklerDistance }
}

export default MLToolkit
