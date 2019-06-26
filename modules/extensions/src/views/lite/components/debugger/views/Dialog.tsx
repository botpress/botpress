import { Colors, H4, H5, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import React, { SFC } from 'react'

import style from '../style.scss'
import { formatConfidence } from '../utils'

interface Props {
  suggestions: sdk.IO.Suggestion[]
  decision: sdk.IO.Suggestion
}

const Decision: SFC<{ decision: sdk.IO.Suggestion }> = props => (
  <div className={style.subSection}>
    <H5 color={Colors.DARK_GRAY5}>Decision</H5>
    <div>
      <strong>{props.decision.sourceDetails}</strong>&nbsp;
      <Tooltip content={props.decision.decision.reason} position={Position.RIGHT}>
        <Icon color={Colors.GRAY3} icon="info-sign" />
      </Tooltip>
    </div>
  </div>
)

const Suggestions: SFC<{ suggestions: sdk.IO.Suggestion[] }> = props => (
  <div className={style.subSection}>
    <H5 color={Colors.DARK_GRAY5}>Suggestions</H5>
    <ul>
      {props.suggestions.map(sugg => (
        <li key={sugg.source}>
          {sugg.sourceDetails}: {formatConfidence(sugg.confidence)}%
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
      <H4>Dialog manager</H4>
      <Decision decision={props.decision} />
      {props.suggestions && props.suggestions.length > 0 && <Suggestions suggestions={props.suggestions} />}
    </div>
  )
}

export default Dialog
