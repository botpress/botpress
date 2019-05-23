import * as sdk from 'botpress/sdk'

const { Tagger, Trainer: CRFTrainer } = require('./crfsuite')
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { Predictor, Trainer as SVMTrainer } from './svm'

const MLToolkit: typeof sdk.MLToolkit = {
  CRF: {
    createTagger: Tagger,
    createTrainer: CRFTrainer
  },
  SVM: {
    Predictor,
    Trainer: SVMTrainer
  },
  FastText: { Model: FastTextModel },
  Strings: { computeLevenshteinDistance, computeJaroWinklerDistance }
}

export default MLToolkit
