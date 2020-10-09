import { Button, Colors, Icon, Position, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import Collapsible from '../../../../../../../../../src/bp/ui-shared-lite/Collapsible'
import ContentSection from '../../../../../../../../../src/bp/ui-shared-lite/ContentSection'
import lang from '../../../../../lang'
import style from '../../style.scss'
import { Inspector } from '../Inspector'

import { Intent, isQnaItem } from './Intent'

interface Props {
  suggestions: sdk.IO.Suggestion[]
  decision: sdk.IO.Suggestion
  stacktrace: sdk.IO.JumpPoint[]
  isExpanded: (key: string) => boolean
  toggleExpand: (section: string, expanded: boolean) => void
}

const Decision: FC<{ decision: sdk.IO.Suggestion }> = props => {
  const decision = props.decision.sourceDetails
  const isQnA = isQnaItem(decision)

  return (
    <ContentSection title={lang.tr('module.extensions.dialog.decision')}>
      <div>
        {isQnA ? <Intent name={decision} /> : <span>{decision}</span>}
        &nbsp;
        <Tooltip content={props.decision.decision.reason} position={Position.RIGHT}>
          <Icon color={Colors.GRAY3} icon="info-sign" />
        </Tooltip>
      </div>
    </ContentSection>
  )
}

const Suggestions: FC<{ suggestions: sdk.IO.Suggestion[] }> = props => (
  <ContentSection title={lang.tr('module.extensions.dialog.suggestions')}>
    <ul>
      {_.take(props.suggestions, 4).map(sugg => (
        <li key={sugg.sourceDetails}>
          <Intent name={sugg.sourceDetails} confidence={sugg.confidence} />
        </li>
      ))}
    </ul>
  </ContentSection>
)

const highlightNode = (flow: string, node: string) => {
  // @ts-ignore
  window.parent && window.parent.highlightNode && window.parent.highlightNode(flow, node)
}

const Flow: FC<{ stacktrace: sdk.IO.JumpPoint[] }> = props => (
  <ContentSection title={lang.tr('module.extensions.dialog.flowNodes')}>
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
  </ContentSection>
)

const DIALOG_JSON = 'json::dialog'
const DIALOG_PANEL = 'panel::dialog'

const Dialog: FC<Props> = ({ stacktrace, decision, suggestions, isExpanded, toggleExpand }) => {
  const [viewJSON, setViewJSON] = useState(isExpanded(DIALOG_JSON))

  useEffect(() => {
    setViewJSON(isExpanded(DIALOG_JSON))
  }, [isExpanded(DIALOG_JSON)])

  const toggleView = () => {
    const newValue = !viewJSON
    toggleExpand(DIALOG_JSON, newValue)
    setViewJSON(newValue)
  }

  const renderContent = () => {
    if (viewJSON) {
      return <Inspector data={{ stacktrace, decision, suggestions }} />
    }

    return (
      <div>
        <Decision decision={decision} />
        {stacktrace && stacktrace.length > 0 && <Flow stacktrace={stacktrace} />}
        {suggestions && suggestions.length > 0 && <Suggestions suggestions={suggestions} />}
      </div>
    )
  }

  if (!decision) {
    return null
  }

  return (
    <Collapsible
      opened={isExpanded(DIALOG_PANEL)}
      toggleExpand={expanded => toggleExpand(DIALOG_PANEL, expanded)}
      name={lang.tr('module.extensions.dialog.dialogManager')}
    >
      {renderContent()}
      <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
        {viewJSON ? lang.tr('module.extensions.viewAsSummary') : lang.tr('module.extensions.viewAsJson')}
      </Button>
    </Collapsible>
  )
}

export default Dialog
