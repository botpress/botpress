import { Colors, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import { ContentSection, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

import { Intent, isQnaItem } from '../components/Intent'
import style from '../style.scss'

interface Props {
  suggestions: sdk.IO.Suggestion[]
  decision: sdk.IO.Suggestion
  stacktrace: sdk.IO.JumpPoint[]
}

const Decision: FC<{ decision: sdk.IO.Suggestion }> = props => {
  const decision = props.decision.sourceDetails
  const isQnA = isQnaItem(decision)

  return (
    <Fragment>
      <div style={{ display: 'flex' }}>
        {isQnA ? <Intent name={decision} /> : <span>{decision}</span>}
        &nbsp;
        <Tooltip content={props.decision.decision.reason} position={Position.RIGHT}>
          <Icon color={Colors.GRAY3} icon="info-sign" />
        </Tooltip>
      </div>
    </Fragment>
  )
}

const Suggestions: FC<{ suggestions: sdk.IO.Suggestion[] }> = props => (
  <Fragment>
    <ul>
      {_.take(props.suggestions, 4).map(sugg => (
        <li key={sugg.sourceDetails}>
          <Intent name={sugg.sourceDetails} confidence={sugg.confidence} />
        </li>
      ))}
    </ul>
  </Fragment>
)

const Dialog: FC<Props> = props => {
  if (!props.decision) {
    return null
  }

  return (
    <Fragment>
      <ContentSection title={lang.tr('decision')} className={style.section}>
        <Decision decision={props.decision} />
      </ContentSection>

      {props.suggestions?.length > 0 && (
        <ContentSection title={lang.tr('studio.bottomPanel.debugger.dialog.dialogManager')} className={style.section}>
          <Suggestions suggestions={props.suggestions} />
        </ContentSection>
      )}
    </Fragment>
  )
}

export default Dialog
