import { Colors, H5 } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

const QNA_IDENTIFIER = '__qna__'

interface IntentDef {
  name: string
  confidence: number
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

  return (
    <div className={style.subSection}>
      <H5 color={Colors.DARK_GRAY5}>Intents</H5>
      {intents.length > 1 && (
        <ul>
          {intents.map(i => (
            <Intent intent={i} elected={i.name === intent.name} />
          ))}
        </ul>
      )}
      {intents.length === 1 && <Intent intent={intent} elected={true} />}
    </div>
  )
}

const Intent = (props: { intent: IntentDef; elected: boolean }) => {
  const { intent, elected } = props
  const isQnA = intent.name.startsWith(QNA_IDENTIFIER)

  let content: string | JSX.Element = `${intent.name}: ${formatConfidence(intent.confidence)} %`
  if (elected) {
    content = <strong>{content}</strong>
  }
  return (
    <li onClick={navigateToIntentDefinition(intent.name, isQnA)} style={{ cursor: 'pointer' }}>
      {content}
    </li>
  )
}

const navigateToIntentDefinition = (intent: string, isQna: boolean) => () => {
  intent = isQna ? intent.replace(QNA_IDENTIFIER, '') : intent
  const url = isQna ? `/modules/qna?id=${intent}` : `/modules/nlu?itemType=intent&itemName=${intent}`
  window.parent.postMessage({ action: 'navigate-url', payload: url }, '*')
}
