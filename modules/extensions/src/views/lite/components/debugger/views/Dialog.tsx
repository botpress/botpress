import { Colors, H4, H5, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment, SFC } from 'react'

import { Collapsible } from '../components/Collapsible'
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
    <div className={style.section}>
      <div className={style.sectionTitle}>Decision</div>
      <div className={style.subSection}>
        {isQnA ? <Intent name={decision} /> : <p>{decision}</p>}
        <ul>
          <li>{props.decision.decision.reason}</li>
        </ul>
      </div>
    </div>
  )
}

const Suggestions: SFC<{ suggestions: sdk.IO.Suggestion[] }> = props => (
  <div className={style.section}>
    <div className={style.sectionTitle}>Suggestions</div>
    <div className={style.subSection}>
      <ul>
        {_.take(props.suggestions, 4).map(sugg => (
          <li key={sugg.sourceDetails}>
            <Intent name={sugg.sourceDetails} confidence={sugg.confidence} />
          </li>
        ))}
      </ul>
    </div>
  </div>
)

const highlightNode = (flow: string, node: string) => {
  // @ts-ignore
  window.parent && window.parent.highlightNode && window.parent.highlightNode(flow, node)
}

const Flow: SFC<{ stacktrace: sdk.IO.JumpPoint[] }> = props => (
  <div className={style.section}>
    <div className={style.sectionTitle}>Flow Nodes</div>
    <div className={style.subSection}>
      <ul>
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
      </ul>
    </div>
  </div>
)

const Dialog: SFC<Props> = props => {
  if (!props.decision) {
    return null
  }

  return (
    <Collapsible name="Dialog Manager">
      <Decision decision={props.decision} />
      {props.stacktrace && props.stacktrace.length > 0 && <Flow stacktrace={props.stacktrace} />}
      {props.suggestions && props.suggestions.length > 0 && <Suggestions suggestions={props.suggestions} />}
    </Collapsible>
  )
}

export default Dialog
