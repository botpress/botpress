import { Colors, H5 } from '@blueprintjs/core'
import React from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

export const Intents = props => {
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

const Intent = ({ intent, elected }) => {
  let content: string | JSX.Element = `${intent.name}: ${formatConfidence(intent.confidence)} %`
  if (elected) {
    content = <strong>{content}</strong>
  }
  return <li onClick={navigateToNlu(intent.name)}>{content}</li>
}

const navigateToNlu = intent => () => {
  window.parent.postMessage({ action: 'navigate-intent', intent }, '*')
}
