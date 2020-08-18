import { IO, NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment } from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

import { Intent } from './Intent'

interface Props {
  predictions: NLU.Predictions
  activePrompt: any
}

const Predictions = (props: Props) => {
  const { predictions, activePrompt } = props

  if (!predictions) {
    return null
  }

  return (
    <div className={style.section}>
      <div className={style.sectionTitle}>Top Predictions</div>
      {Object.keys(predictions).map((key, index) => {
        const { confidence, intents } = predictions[key]
        if ((key === 'global' && activePrompt) || key !== 'global') {
          return (
            <div className={style.subSection} key={index}>
              <div>
                <p>
                  {key} {formatConfidence(confidence)}%
                </p>
                <ul>
                  {intents.slice(0, 4).map(i => {
                    return (
                      <li key={i.label}>
                        <Intent name={i.label} confidence={i.confidence} />
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          )
        }
      })}
    </div>
  )
}

export default Predictions
