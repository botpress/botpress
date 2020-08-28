import React from 'react'

import lang from '../../../../lang'
import style from '../style.scss'
import { formatConfidence } from '../utils'

export const Intents = props => {
  const { intent, intents } = props
  if (!intent || !intents || !intents.length) {
    return null
  }

  return (
    <div className={style.section}>
      <h2 className={style.sectionTitle}>{lang.tr('module.extensions.intents')}</h2>
      {intents.length > 1 && (
        <ul>
          {intents.map(i => {
            let content: string | JSX.Element = `${i.name}: ${formatConfidence(i.confidence)} %`
            if (i.name === intent.name) {
              content = <strong>{content}</strong>
            }
            return <li key={i.name}>{content}</li>
          })}
        </ul>
      )}
      {intents.length === 1 && <strong>{`${intent.name}: ${formatConfidence(intent.confidence)} %`}</strong>}
    </div>
  )
}
