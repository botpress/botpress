import { IO, NLU } from 'botpress/sdk'
import _ from 'lodash'
import { getMostConfidentContext } from './most-confident'
import { NONE_INTENT } from './typings'

const debug = DEBUG('nlu:predict')

const getTop1Intent = (mostConfidentCtx: NLU.ContextPrediction & { name: string }) => {
  return _(mostConfidentCtx.intents)
    .orderBy(i => i.confidence, 'desc')
    .filter(i => i.label !== NONE_INTENT) // only relevant when legacy-election is enabled
    .map(({ label, confidence }) => ({ name: label, context: mostConfidentCtx.name, confidence }))
    .first()
}

const pickSpellChecked = (
  originalOutput: IO.EventUnderstanding,
  spellCheckedOutput: IO.EventUnderstanding
): IO.EventUnderstanding => {
  if (!originalOutput.predictions || !spellCheckedOutput.predictions) {
    return originalOutput
  }

  const originalMostConfidentContext = getMostConfidentContext(originalOutput)
  const spellCheckedMostConfidentContext = getMostConfidentContext(spellCheckedOutput)

  if (!originalMostConfidentContext || !spellCheckedMostConfidentContext) {
    return originalOutput
  }

  const originalTop1 = getTop1Intent(originalMostConfidentContext)
  const spellCheckedTop1 = getTop1Intent(spellCheckedMostConfidentContext)

  if (!originalTop1 || !spellCheckedTop1 || originalTop1.confidence >= spellCheckedTop1.confidence) {
    return originalOutput
  }

  debug(`spell-checked output picked: "${originalOutput.spellChecked}"`)
  return spellCheckedOutput
}
export default pickSpellChecked
