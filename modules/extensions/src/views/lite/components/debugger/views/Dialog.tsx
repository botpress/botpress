import { Colors, H4, H5, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { SFC } from 'react'

import { Intent, isQnaItem } from '../components/Intent'
import style from '../style.scss'

interface Props {
  suggestions: sdk.IO.Suggestion[]
  decision: sdk.IO.Suggestion
  stacktrace: sdk.IO.JumpPoint[]
}

const Decision: SFC<{ decision: sdk.IO.Suggestion }> = props => {
  const decision = props.decision.sourceDetails
  const isQnA = isQnaItem(decision)

  return (
    <div className={style.subSection}>
      <H5 color={Colors.DARK_GRAY5}>Decision</H5>
      <div style={{ display: 'flex' }}>
        {isQnA ? <Intent name={decision} /> : <strong>{decision}</strong>}
        &nbsp;
        <Tooltip content={props.decision.decision.reason} position={Position.RIGHT}>
          <Icon color={Colors.GRAY3} icon="info-sign" />
        </Tooltip>
      </div>
    </div>
  )
}

const Suggestions: SFC<{ suggestions: sdk.IO.Suggestion[] }> = props => (
  <div className={style.subSection}>
    <H5 color={Colors.DARK_GRAY5}>Suggestions</H5>
    <ul>
      {_.take(props.suggestions, 4).map(sugg => (
        <li key={sugg.sourceDetails}>
          <Intent name={sugg.sourceDetails} confidence={sugg.confidence} />
        </li>
      ))}
    </ul>
  </div>
)

const Dialog: SFC<Props> = props => {
  if (!props.decision) {
    return null
  }

  return (
    <div className={style.block}>
      <H4>Dialog Manager</H4>
      <Decision decision={props.decision} />
      {props.suggestions && props.suggestions.length > 0 && <Suggestions suggestions={props.suggestions} />}
    </div>
  )
}

export default Dialog
