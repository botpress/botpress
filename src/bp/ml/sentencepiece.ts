import * as sdk from 'botpress/sdk'

const sp = require('./sentencepiece.node')

export const encode: typeof sdk.MLToolkit.SentencePiece.encode = (inputText: string, modelName: string) => {
  return sp.encode(`${process.PROJECT_LOCATION}/data/${modelName}`, inputText)
}

export const decode: typeof sdk.MLToolkit.SentencePiece.decode = (pieces: string[], modelName: string) => {
  return sp.decode(`${process.PROJECT_LOCATION}/data/${modelName}`, pieces)
}
