import { Colors, H5 } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'

import style from '../style.scss'

import { Intent, IntentDef } from './Intent'

interface Props {
  intent: IntentDef
  intents: IntentDef[]
}

export const Intents = (props: Props) => {
  const { intent, intents } = props
  if (!intent || !intents || !intents.length) {
    return null
  }

  return (
    <div className={style.subSection}>
      <H5 color={Colors.DARK_GRAY5}>Intents</H5>
      {intents.length > 1 && (
        <ul>
          {intents.map(i => (
            <li>
              <Intent intent={i} elected={i.name === intent.name} />
            </li>
          ))}
        </ul>
      )}
      {intents.length === 1 && (
        <li>
          <Intent intent={intent} elected={true} />
        </li>
      )}
    </div>
  )
}
