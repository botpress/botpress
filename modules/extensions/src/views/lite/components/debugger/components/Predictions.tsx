import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment } from 'react'

import lang from '../../../../lang'
import style from '../style.scss'
import { formatConfidence } from '../utils'

import { Intent } from './Intent'

interface Props {
  predictions: NLU.Predictions
}

const Predictions = (props: Props) => {
  const { predictions } = props

  if (!predictions) {
    return null
  }

  return (
    <div className={style.section}>
      <div className={style.sectionTitle}>{lang.tr('module.extensions.topPredictions')}</div>
      {Object.keys(predictions).map((key, index) => {
        const { confidence, intents } = predictions[key]
        return (
          <div className={style.subSection} key={index}>
            <p>
              {key} {formatConfidence(confidence)}%
            </p>
            <ul>
              {intents.slice(0, 4).map(i => {
                return (
                  <li key={i.label}>
                    <Intent topicName={key} name={i.label} confidence={i.confidence} />
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export default Predictions
