import { Icon } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import sdk from 'botpress/sdk'
import React, { FC, useEffect, useState } from 'react'

import { NluMlRecommendations } from '../../../backend/typings'

import style from './style.scss'

interface Props {
  intent: sdk.NLU.IntentDefinition
  contentLang: string
  axios: AxiosInstance
}

const fetchRecommendations = async (axios: AxiosInstance): Promise<NluMlRecommendations> => {
  return axios.get('/mod/nlu/ml-recommendations').then(({ data }) => data)
}

// At some point, recommendations will be computed in the backend and this component will simply fetch and display intents recommendations
const IntentHint: FC<Props> = props => {
  const utterances = props.intent.utterances[props.contentLang] || []
  const slotsLength = (props.intent.slots || []).length
  const [recommendations, setRecommendations] = useState<NluMlRecommendations | undefined>()

  useEffect(() => {
    // tslint:disable-next-line: no-floating-promises
    fetchRecommendations(props.axios).then(setRecommendations)
  }, [props.intent.utterances, props.intent.slots])

  if (!recommendations) {
    return null
  }

  /*
    The ideal number of utterances should not be computed for the whole intent but rather by slots.
    Meaning, we should recommend a number of utterances for each slot, what we are doing right now is only
    valid if there're no slots. Also, we should do a density based clustering per slots and for the whole intent
    to see if the utterances all belong to the same class or if the are considerable different ways of saying
    the same thing. Then, we could also not only recommend number of utterances per intent & slots but by cluster also.
  */
  const idealNumberOfUtt = Math.max(Math.pow(slotsLength * 2, 2), recommendations.goodUtterancesForML)
  let hint: JSX.Element

  if (!utterances.length) {
    hint = <span>This intent will be ignored, start adding utterances to make it trainable.</span>
  }

  if (utterances.length && utterances.length < recommendations.minUtterancesForML) {
    const remaining = recommendations.minUtterancesForML - utterances.length
    hint = (
      <span>
        This intent will use <strong>exact match only</strong>. To enable machine learning, add at least{' '}
        <strong>
          {remaining} more utterance{remaining === 1 ? '' : 's'}
        </strong>
      </span>
    )
  }

  if (utterances.length >= recommendations.minUtterancesForML && utterances.length < idealNumberOfUtt) {
    const remaining = idealNumberOfUtt - utterances.length
    hint = (
      <span>
        Add{' '}
        <strong>
          {remaining} more utterance{remaining === 1 ? ' ' : 's '}
        </strong>
        to make NLU more resilient.
      </span>
    )
  }
  return hint ? (
    <p className={style.hint}>
      {!utterances.length && <Icon icon="warning-sign" />}
      {!!utterances.length && <Icon icon="symbol-diamond" />}
      {hint}
    </p>
  ) : null
}

export default IntentHint
