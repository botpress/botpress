import { H5, Pre } from '@blueprintjs/core'
import React from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

export const Intents = props => {
  const { intent, intents, includedContexts } = props.nlu
  if (!intent || !intents || !intents.length) {
    return null
  }

  return (
    <div className={style.block}>
      <H5>Intents</H5>
      <div>
        {intents.map(i => {
          const content = `${i.name}: ${formatConfidence(i.confidence)} %`
          if (i.name === intent.name) {
            return <strong>{content} (elected)</strong>
          }
          return <div>{content}</div>
        })}
      </div>
    </div>
  )
}
