import { IO, NLU } from 'botpress/sdk'
import _ from 'lodash'
import React from 'react'

import ContentSection from '../../../../../../../../src/bp/ui-shared-lite/ContentSection'
import lang from '../../../../lang'
import style from '../style.scss'
import { formatConfidence } from '../utils'

import { Intent } from './Intent'
const GLOBAL_TOPIC = 'global'
interface Props {
  predictions: NLU.Predictions
  activePrompt: IO.PromptStatus
}

const Predictions = (props: Props) => {
  const { predictions, activePrompt } = props

  if (!predictions) {
    return null
  }

  return (
    <ContentSection title={lang.tr('module.extensions.topPredictions')}>
      {Object.keys(predictions)
        .filter(x => !x.startsWith('explicit'))
        .map((topicName, index) => {
          const { confidence, intents } = predictions[topicName]
          if ((topicName === GLOBAL_TOPIC && activePrompt) || topicName !== GLOBAL_TOPIC) {
            return (
              <div className={style.subSection} key={index}>
                <p>
                  {topicName} {formatConfidence(confidence)}
                </p>
                <ul>
                  {intents.slice(0, 4).map(i => {
                    return (
                      <li key={i.label}>
                        <Intent topicName={topicName} name={i.label} confidence={i.confidence} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          }
        })}
    </ContentSection>
  )
}

export default Predictions
