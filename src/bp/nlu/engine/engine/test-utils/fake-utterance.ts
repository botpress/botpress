import _ from 'lodash'
import { SPECIAL_CHARSET } from '../tools/chars'
import Utterance from '../utterance/utterance'

/**
 * @description Utility function that returns an utterance using a space tokenizer
 * @param str sentence as a textual value
 */
export function makeTestUtterance(str: string, dim: number = 25): Utterance {
  const toks = str.split(new RegExp(`(${SPECIAL_CHARSET.join('|')}|\\s)`, 'gi'))
  const vecs = new Array(toks.length).fill(_.range(dim))
  const pos = new Array(toks.length).fill('N/A')
  return new Utterance(toks, vecs, pos, 'en')
}
