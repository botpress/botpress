import * as sdk from 'botpress/sdk'

const sp = require('./sentencepiece.node')
export const processor: () => sdk.MLToolkit.SentencePiece.Processor = () => {
  return new sp.Processor()
}
