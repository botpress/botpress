import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import kmeans from 'ml-kmeans'

import crfsuite from './crfsuite'
import { FastTextModel } from './fasttext'
import computeJaroWinklerDistance from './homebrew/jaro-winkler'
import computeLevenshteinDistance from './homebrew/levenshtein'
import { processor } from './sentencepiece'
import { Predictor, Trainer as SVMTrainer } from './svm'
import { CrfTrainer } from './crf'

// assuming 10 bots, 10 ctx * (oos, intent) + ndu + ctx cls + slot tagger
// all training concurrently
const MAX_TRAINING_LISTENENRS = 10 * (10 * 2 + 2)

const MLToolkit: typeof sdk.MLToolkit = {
  KMeans: {
    kmeans
  },
  CRF: {
    createTagger: () => new crfsuite.Tagger(),
    createTrainer: () => new CrfTrainer()
  },
  SVM: {
    Predictor,
    Trainer: SVMTrainer
  },
  FastText: { Model: FastTextModel },
  Strings: { computeLevenshteinDistance, computeJaroWinklerDistance },
  SentencePiece: { createProcessor: processor }
}

export default MLToolkit
