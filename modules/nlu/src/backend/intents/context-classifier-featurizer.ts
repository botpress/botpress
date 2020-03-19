import Utterance, { UtteranceToken } from '../utterance/utterance'

function shouldConsiterToken(token: UtteranceToken): boolean {
  const isSysOrPatternEntity = token.entities.some(
    en => en.metadata.extractor === 'pattern' || en.metadata.extractor === 'system'
  )
  return token.isWord && !isSysOrPatternEntity
}

export function getSentenceEmbeddingForCtx(utt: Utterance): number[] {
  return []
}
