import { AnchorButton, Icon, Popover, Position, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import { flowEditorRedo, flowEditorUndo, saveAllFlows } from '~/actions'
import { LeftToolbarButtons, RightToolbarButtons, Toolbar } from '~/components/Shared/Interface'
import { canFlowRedo, canFlowUndo } from '~/reducers'
import { getCurrentFlow } from '~/reducers'

const FlowProblems = props => {
  const highlightNode = node => {
    // @ts-ignore
    window.highlightNode(props.currentFlow && props.currentFlow.name, node)
  }
  const hasProblems = !!props.flowProblems.length

  return (
    <Popover>
      <Tooltip
        content={hasProblems ? 'Problems with your flow. Click for more details' : 'No issue with your flow'}
        position={Position.BOTTOM}
      >
        <Icon icon="info-sign" color={hasProblems ? 'red' : 'gray'} style={{ padding: '5px 5px 0 0' }} />
      </Tooltip>
      <div style={{ padding: 10 }}>
        {props.flowProblems.map(node => (
          <div key={node.nodeName}>
            <a onClick={() => highlightNode(node.nodeName)}>
              <strong>{node.nodeName}</strong>
            </a>
            : Missing <strong>{node.missingPorts}</strong> links
          </div>
        ))}
      </div>
    </Popover>
  )
}

const MiniToolbar = props => {
  return (
    <Toolbar>
      <LeftToolbarButtons>
        <Tooltip content="Undo" position={Position.BOTTOM}>
          <AnchorButton icon="undo" disabled={!props.canUndo} onClick={props.undo} />
        </Tooltip>
        <Tooltip content="Redo" position={Position.BOTTOM}>
          <AnchorButton icon="redo" disabled={!props.canRedo} onClick={props.redo} />
        </Tooltip>
        <Tooltip content="Save" position={Position.BOTTOM}>
          <AnchorButton icon="floppy-disk" onClick={() => props.saveAllFlows()} />
        </Tooltip>
      </LeftToolbarButtons>
      <RightToolbarButtons>
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
  redo: flowEditorRedo,
  saveAllFlows
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(MiniToolbar)
