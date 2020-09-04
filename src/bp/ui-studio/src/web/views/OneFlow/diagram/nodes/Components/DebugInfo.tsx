import { Button } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { history } from '~/components/Routes'

import { NodeDebugInfo } from '../../debugger'

import style from './style.scss'

const getPercentage = (number: number) => _.round(number * 100, 2)

const listTriggerResults = results => {
  const keys = Object.keys(results || [])
  if (!keys.length) {
    return null
  }

  return (
    <div>
      {keys.map(id => (
        <div key={id}>
          {id}: {getPercentage(results[id])}%
        </div>
      ))}
    </div>
  )
}

type NodeDebugInfoProps = {
  className?: string
  nodeType?: string
} & NodeDebugInfo

export const DebugInfo: FC<NodeDebugInfoProps> = ({
  triggers,
  variable,
  prompt,
  isEndOfFlow,
  nextWorkflow,
  prevWorkflow,
  hasError,
  nodeType,
  className
}) => {
  const goToFlow = flow => history.push(`/oneflow/${flow.replace(/\.flow\.json/, '')}`)

  const highestTrigger = triggers?.[0]
  const infos: JSX.Element[] = []

  if (highestTrigger && nodeType !== 'prompt') {
    infos.push(
      <ToolTip content={<span className={style.results}>{listTriggerResults(highestTrigger.result)}</span>}>
        <span>{lang.tr('studio.flow.likelyTriggered', { pct: getPercentage(highestTrigger.score) })}</span>
      </ToolTip>
    )
  }

  if (variable) {
    infos.push(<div>{lang.tr('studio.flow.extractedVar', { output: variable.output, value: variable.value })}</div>)
  }

  if (isEndOfFlow) {
    infos.push(<div>{lang.tr('studio.flow.endOfWorkflow')}</div>)
  }

  if (prompt?.stage) {
    infos.push(<div>{lang.tr('studio.flow.currentStage', { stage: prompt.stage })}</div>)
  }

  if (nextWorkflow) {
    infos.push(
      <Button minimal className={style.smallButton} onClick={() => goToFlow(nextWorkflow)}>
        {lang.tr(`studio.flow.${nextWorkflow.startsWith('__reusable') ? 'jumpIntoWorkflow' : 'jumpOutOfWorkflow'}`)}
      </Button>
    )
  }

  if (prevWorkflow) {
    infos.push(
      <Button minimal className={style.smallButton} onClick={() => goToFlow(prevWorkflow)}>
        {lang.tr(`studio.flow.${prevWorkflow.startsWith('__reusable') ? 'jumpIntoWorkflow' : 'jumpOutOfWorkflow'}`)}
      </Button>
    )
  }

  if (hasError) {
    infos.push(<div>{lang.tr('studio.flow.errorOccurred')}</div>)
  }

  if (!infos.length) {
    return null
  }

  return (
    <div className={cx(style.debugInfo, className, { [style.hasError]: hasError })}>
      {infos.map((info, idx) => (
        <Fragment key={idx}>{info}</Fragment>
      ))}
    </div>
  )
}
