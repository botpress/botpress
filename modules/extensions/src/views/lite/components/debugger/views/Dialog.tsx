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

const highlightNode = (flow: string, node: string) => {
  // @ts-ignore
  window.parent && window.parent.highlightNode && window.parent.highlightNode(flow, node)
}

const Flow: SFC<{ stacktrace: sdk.IO.JumpPoint[] }> = props => (
  <div className={style.subSection}>
    <H5 color={Colors.DARK_GRAY5}>Flow Nodes</H5>
    <ol>
      {props.stacktrace.map(({ flow, node }, idx) => {
        const flowName = flow && flow.replace(/\.flow\.json$/i, '')
        return (
          <li key={`${flow}:${node}:${idx}`}>
            <span>
              <a onClick={() => highlightNode(flow, node)}>
                {flowName} / {node}
              </a>
            </span>
          </li>
        )
      })}
    </ol>
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
      {props.stacktrace && props.stacktrace.length > 0 && <Flow stacktrace={props.stacktrace} />}
      {props.suggestions && props.suggestions.length > 0 && <Suggestions suggestions={props.suggestions} />}
    </div>
  )
}

export default Dialog
