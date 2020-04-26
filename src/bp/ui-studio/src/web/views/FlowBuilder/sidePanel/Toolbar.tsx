import { AnchorButton, Popover, Position, Tag, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import { FlowMutex } from 'common/typings'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { flowEditorRedo, flowEditorUndo } from '~/actions'
import { LeftToolbarButtons, RightToolbarButtons, Toolbar } from '~/components/Shared/Interface'
import { canFlowRedo, canFlowUndo } from '~/reducers'
import { getCurrentFlow } from '~/reducers'

import style from './style.scss'

export interface MutexInfo {
  currentMutex?: FlowMutex
  someoneElseIsEditingOtherFlow?: boolean
}

const FlowProblems = props => {
  const highlightNode = node => {
    // @ts-ignore
    window.highlightNode(props.currentFlow && props.currentFlow.name, node)
  }
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
        <Tag icon="error" className={style.flowProblems} minimal>
          {props.flowProblems.length}
        </Tag>
      </Tooltip>
      <div style={{ padding: 10 }}>
        {props.flowProblems.map(node => (
          <div key={node.nodeName}>
            <a onClick={() => highlightNode(node.nodeName)}>
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
    <Popover>
      <Tooltip content={<span>{tooltipContent}</span>} position={Position.BOTTOM}>
        <Tag icon={isLock ? 'lock' : 'user'} minimal />
      </Tooltip>
    </Popover>
  )
}

const MiniToolbar = props => {
  return (
    <Toolbar>
      <LeftToolbarButtons>
        <Tooltip content={lang.tr('undo')} position={Position.BOTTOM}>
          <AnchorButton id="btn-undo" icon="undo" disabled={!props.canUndo} onClick={props.undo} />
        </Tooltip>
        <Tooltip content={lang.tr('redo')} position={Position.BOTTOM}>
          <AnchorButton id="btn-redo" icon="redo" disabled={!props.canRedo} onClick={props.redo} />
        </Tooltip>
      </LeftToolbarButtons>
      <RightToolbarButtons>
        <FlowMutexInfo {...props} />
        <FlowProblems {...props} />
      </RightToolbarButtons>
    </Toolbar>
  )
}

const mapStateToProps = state => ({
  canUndo: canFlowUndo(state),
  canRedo: canFlowRedo(state),
  flowProblems: state.flows.flowProblems,
  currentFlow: getCurrentFlow(state)
})

const mapDispatchToProps = {
  undo: flowEditorUndo,
  redo: flowEditorRedo
}

export default connect(mapStateToProps, mapDispatchToProps)(MiniToolbar)
