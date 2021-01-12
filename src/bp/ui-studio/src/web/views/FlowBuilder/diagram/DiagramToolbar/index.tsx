import { Button, Icon, Intent, Popover, Position, Tag, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { FlowMutex } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { getCurrentFlow } from '~/reducers'

import style from './style.scss'

interface MutexInfo {
  currentMutex?: FlowMutex
  someoneElseIsEditingOtherFlow?: boolean
}

interface OwnProps {
  currentFlow: any
  handleFlowWideClicked: () => void
  mutexInfo: string
  highlightNode: (node: any) => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type Props = StateProps & OwnProps

const FlowProblems = props => {
  const hasProblems = !!props.flowProblems.length

  if (!hasProblems) {
    return null
  }

  return (
    <Popover>
      <Tooltip
        content={
          <span>
            {lang.tr('studio.flow.toolbar.problemsWithFlow')}
            <br />
            {lang.tr('studio.flow.toolbar.clickDetails')}
          </span>
        }
        position={Position.BOTTOM}
      >
        <div>
          <Icon icon="error" className={style.flowProblems} />
          {props.flowProblems.length}
        </div>
      </Tooltip>
      <div style={{ padding: 10 }}>
        {props.flowProblems.map(node => (
          <div key={node.nodeName}>
            <a onClick={() => props.highlightNode({ flow: props.currentFlow.name, node: node.nodeName })}>
              <strong>{node.nodeName}</strong>
            </a>
            : {lang.tr('studio.flow.toolbar.missingDetails', { nb: <strong>{node.missingPorts}</strong> })}
          </div>
        ))}
      </div>
    </Popover>
  )
}

const FlowMutexInfo = (props: { mutexInfo: MutexInfo }) => {
  if (!props.mutexInfo) {
    return null
  }

  const isLock = !!props.mutexInfo.currentMutex
  const { lastModifiedBy } = (props.mutexInfo.currentMutex || {}) as FlowMutex

  const tooltipContent = isLock ? (
    <span>{lang.tr('studio.flow.toolbar.currentlyEditing', { name: lastModifiedBy })}</span>
  ) : (
    <span>
      {lang.tr('studio.flow.toolbar.somebodyIsEditing')}
      <br />
      {lang.tr('studio.flow.toolbar.renamingAndDeletingDisabled')}
    </span>
  )

  return (
    <Tooltip content={<span>{tooltipContent}</span>} position={Position.BOTTOM}>
      <Icon icon={isLock ? 'lock' : 'user'} />
    </Tooltip>
  )
}

const CatchAll = props => {
  const nbNext = _.get(props.currentFlow, 'catchAll.next.length', 0)
  const nbReceive = _.get(props.currentFlow, 'catchAll.onReceive.length', 0)

  if (window.USE_ONEFLOW) {
    return null
  }

  return (
    <Fragment>
      <Button onClick={props.handleFlowWideClicked} minimal>
        <Tag intent={nbNext > 0 ? Intent.PRIMARY : Intent.NONE}>{nbNext}</Tag>{' '}
        {lang.tr('studio.flow.flowWideTransitions', { count: nbNext })}
      </Button>
      <Button onClick={props.handleFlowWideClicked} minimal>
        <Tag intent={nbReceive > 0 ? Intent.PRIMARY : Intent.NONE}>{nbReceive}</Tag>{' '}
        {lang.tr('studio.flow.flowWideOnReceives', { count: nbReceive })}
      </Button>
    </Fragment>
  )
}

const FlowBar = props => {
  if (!props.mutexInfo && !props.flowProblems.length) {
    return null
  }

  return (
    <div>
      <FlowMutexInfo {...props} />
      <FlowProblems {...props} />
    </div>
  )
}

const DiagramToolbar: FC<Props> = props => {
  return (
    <div className={style.toolbar}>
      <CatchAll {...props}></CatchAll>
      <FlowBar {...props}></FlowBar>
    </div>
  )
}

const mapStateToProps = state => ({
  flowProblems: state.flows.flowProblems,
  currentFlow: getCurrentFlow(state)
})

export default connect(mapStateToProps)(DiagramToolbar)
