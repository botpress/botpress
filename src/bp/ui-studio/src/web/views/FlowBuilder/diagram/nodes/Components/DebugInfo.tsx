import { Button } from '@blueprintjs/core'
import { lang, ToolTip } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { history } from '~/components/Routes'

import { NodeDebugInfo } from '../../debugger'

import style from './style.scss'

type NodeDebugInfoProps = {
  className?: string
  nodeType?: string
} & NodeDebugInfo

export const DebugInfo: FC<NodeDebugInfoProps> = ({
  isEndOfFlow,
  nextWorkflow,
  prevWorkflow,
  hasError,
  nodeType,
  className
}) => {
  const goToFlow = flow => history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)

  const infos: JSX.Element[] = []

  if (isEndOfFlow) {
    infos.push(<div>{lang.tr('studio.flow.endOfWorkflow')}</div>)
  }

  if (nextWorkflow) {
    infos.push(
      <Button minimal className={style.smallButton} onClick={() => goToFlow(nextWorkflow)}>
        {lang.tr('studio.flow.nextWorkflow')}
      </Button>
    )
  }

  if (prevWorkflow) {
    infos.push(
      <Button minimal className={style.smallButton} onClick={() => goToFlow(prevWorkflow)}>
        {lang.tr('studio.flow.prevWorkflow')}
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
