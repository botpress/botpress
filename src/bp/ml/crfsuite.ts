import * as sdk from 'botpress/sdk'

const binding = require('./crfsuite.node')

export const Trainer = binding.TrainerClass as () => sdk.MLToolkit.CRF.Trainer
export const Tagger = binding.TaggerClass as () => sdk.MLToolkit.CRF.Tagger
