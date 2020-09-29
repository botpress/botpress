import React, { Fragment } from 'react'

import ContentSection from '../../../../../../../../src/bp/ui-shared-lite/ContentSection'
import lang from '../../../../lang'
import { formatConfidence } from '../utils'

export const Intents = props => {
  const { intent, intents } = props
  if (!intent || !intents || !intents.length) {
    return null
  }

  return (
    <ContentSection title={lang.tr('module.extensions.intents')}>
      <Fragment>
        {intents.length > 1 && (
          <ul>
            {intents.map(i => {
              let content: string | JSX.Element = `${i.name}: ${formatConfidence(i.confidence)}`
              if (i.name === intent.name) {
                content = <strong>{content}</strong>
              }
              return <li key={i.name}>{content}</li>
            })}
          </ul>
        )}
        {intents.length === 1 && <strong>{`${intent.name}: ${formatConfidence(intent.confidence)}`}</strong>}
      </Fragment>
    </ContentSection>
  )
}
