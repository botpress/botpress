import { NluMlRecommendations } from '../typings'

const MIN_NB_UTTERANCES = 3
const GOOD_NB_UTTERANCES = 10

export default {
  minUtterancesForML: MIN_NB_UTTERANCES,
  goodUtterancesForML: GOOD_NB_UTTERANCES
} as NluMlRecommendations
