import _ from 'lodash'
import React, { Fragment } from 'react'

import lang from '../../../../lang'
import style from '../style.scss'
import { formatConfidence } from '../utils'

import { Intent } from './Intent'

interface IntentDef {
  name: string
  confidence: number
  context: string
}

interface Props {
  intent: IntentDef
  intents: IntentDef[]
}

export const Intents = (props: Props) => {
  const { intent, intents } = props
  if (!intent || !intents || !intents.length) {
    return null
  }

  const intentsByContext: {
    [key: string]: { name: string; confidence: number; intents: IntentDef[] }
  } = intents.reduce((acc, intent) => {
    const context = acc[intent.context]
    const intentsArray = [...(context?.intents || []), intent]
    const totalConfidence = (context?.confidence || 0) + intent.confidence

    return { ...acc, [intent.context]: { name: intent.context, confidence: totalConfidence, intents: intentsArray } }
  }, {})

  return (
    <div className={style.section}>
      <div className={style.sectionTitle}>{lang.tr('module.extensions.topIntents')}</div>
      {Object.keys(intentsByContext).map((key, index) => {
        const { name, confidence, intents } = intentsByContext[key]
        return (
          <div className={style.subSection} key={index}>
            <p>
              {name} {formatConfidence(confidence)}%
            </p>
            <ul>
              {_.take(intents, 4).map(i => {
                return (
                  <li key={i.name}>
                    <Intent name={i.name} confidence={i.confidence} elected={i.name === intent.name} />
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
