import { Button, H4 } from '@blueprintjs/core'
import cx from 'classnames'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import {
  closeFlowNodeProps,
  copyFlowNodeElement,
  pasteFlowNodeElement,
  refreshFlowsLinks,
  requestEditSkill,
  updateFlow,
  updateFlowNode
} from '~/actions'
import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'

import SaySomethingForm from '../../FlowBuilder/sidePanelTopics/form/SaySomethingForm'
import { nodeTypes } from '../diagram/manager'
import FlowInformation from '../nodeProps/FlowInformation'
import SkillCallNode from '../nodeProps/SkillCallNode'
import StandardNode from '../nodeProps/StandardNode'

import style from './style.scss'

interface OwnProps {
  history: any
  onDeleteSelectedElements: () => void
  pasteFlowNode: any
  readOnly: any
  show: any
  updateFlowNode: any
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

class Inspector extends Component<Props> {
  render() {
    const { currentFlowNode } = this.props

    const close = () => {
      this.props.closeFlowNodeProps()
    }

    const node = currentFlowNode
    const nodeType = currentFlowNode?.type || (currentFlowNode ? 'standard' : null)
    return (
      <div className={cx(style.inspector, { [style.sideForm]: nodeType === 'say_something' })}>
        {nodeType !== 'say_something' && (
          <Fragment>
            {node && (
              <i className={cx('material-icons', style.closeIcon)} onClick={close}>
                close
              </i>
            )}
            <H4>{node ? 'Node Properties' : 'Flow Properties'}</H4>
          </Fragment>
        )}
        {this.renderNodeProperties(nodeType)}
      </div>
    )
  }

  renderNodeProperties(nodeType: string) {
    const {
      buffer,
      currentFlow,
      currentFlowNode,
      onDeleteSelectedElements,
      copyFlowNodeElement,
      pasteFlowNodeElement,
      readOnly,
      refreshFlowsLinks,
      requestEditSkill,
      updateFlow,
      updateFlowNode,
      flows,
      user
    } = this.props

    const subflows = _.filter(
      _.map(flows, f => f.name),
      f => f !== currentFlow?.name
    )

    const updateNodeAndRefresh = (...args) => {
      updateFlowNode(...args)
      refreshFlowsLinks()
    }

    if (nodeType === 'skill-call') {
      return (
        <SkillCallNode
          readOnly={readOnly}
          user={user}
          flow={currentFlow}
          subflows={subflows}
          node={currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={updateFlow}
          requestEditSkill={requestEditSkill}
          copyFlowNodeElement={copyFlowNodeElement}
          pasteFlowNodeElement={pasteFlowNodeElement}
          buffer={buffer}
        />
      )
    }

    if (nodeType === 'say_something') {
      return (
        <SaySomethingForm
          onDeleteSelectedElements={onDeleteSelectedElements}
          contentType={currentFlowNode.content?.contentType}
          formData={currentFlowNode.content?.formData}
          updateNode={updateNodeAndRefresh}
          readOnly={readOnly}
          subflows={subflows}
        />
      )
    }

    if (nodeTypes.includes(nodeType)) {
      const isLastNode = currentFlow.nodes.length
        ? currentFlow.nodes[currentFlow.nodes.length - 1].id === currentFlowNode.id
        : false

      return (
        <StandardNode
          isLastNode={isLastNode}
          readOnly={readOnly}
          flow={currentFlow}
          subflows={subflows}
          node={currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={updateFlow}
          copyFlowNodeElement={copyFlowNodeElement}
          pasteFlowNodeElement={pasteFlowNodeElement}
          transitionOnly={nodeType === 'router'}
          buffer={buffer}
        />
      )
    }

    return <FlowInformation {...this.props} subflows={subflows} />
  }
}

const mapStateToProps = state => ({
  flows: _.values(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state) as any,
  buffer: state.flows.buffer,
  user: state.user
})

const mapDispatchToProps = {
  updateFlow,
  requestEditSkill,
  copyFlowNodeElement,
  pasteFlowNodeElement,
  closeFlowNodeProps,
  updateFlowNode,
  refreshFlowsLinks
}

export default connect(mapStateToProps, mapDispatchToProps)(Inspector)
