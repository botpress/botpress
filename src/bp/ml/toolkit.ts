import * as sdk from 'botpress/sdk'

const { Tagger, Trainer } = require('./crfsuite')
import { FastTextModel } from './fasttext'

const MLToolkit: typeof sdk.MLToolkit = {
  CRF: {
    createTagger: Tagger,
    createTrainer: Trainer
  },
  FastText: { Model: FastTextModel }
}

export default MLToolkit
