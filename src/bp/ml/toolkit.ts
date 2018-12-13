import * as sdk from 'botpress/sdk'

const { Tagger, Trainer } = require('./crfsuite')

const MLToolkit: typeof sdk.MLToolkit = {
  CRF: {
    createTagger: Tagger,
    createTrainer: Trainer
  }
}

export default MLToolkit
