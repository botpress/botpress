import { Button, H4 } from '@blueprintjs/core'
import _ from 'lodash'
import React, { Component } from 'react'
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

import { nodeTypes } from '../diagram/manager'
import FlowInformation from '../nodeProps/FlowInformation'
import SkillCallNode from '../nodeProps/SkillCallNode'
import StandardNode from '../nodeProps/StandardNode'

import style from './style.scss'

interface Props {
  currentFlowNode: any
  closeFlowNodeProps: any
  show: any
  history: any
  readOnly: any
  updateFlowNode: any
  refreshFlowsLinks: any
  flows: any
  currentFlow: any
  requestEditSkill: any
  copyFlowNodeElement: any
  pasteFlowNodeElement: any
  buffer: any
  updateFlow: any
  user: any
}

class Inspector extends Component<Props> {
  render() {
    const goBackToMain = () => {
      this.props.closeFlowNodeProps()
      this.props.refreshFlowsLinks()
    }

    const node = this.props.currentFlowNode
    return (
      <div className={style.inspector}>
        {node && (
          <Button id="btn-back-element" className={style.noLineHeight} onClick={goBackToMain} small>
            <i className="material-icons">keyboard_backspace</i>
          </Button>
        )}
        <H4>{node ? 'Node Properties' : 'Flow Properties'}</H4>
        {this.renderNodeProperties()}
      </div>
    )
  }

  renderNodeProperties() {
    const { readOnly } = this.props
    const subflows = _.filter(
      _.map(this.props.flows, f => f.name),
      f => f !== _.get(this.props, 'currentFlow.name')
    )
    const flowType = _.get(this.props, 'currentFlowNode.type') || (this.props.currentFlowNode ? 'standard' : null)

    const updateNodeAndRefresh = (...args) => {
      this.props.updateFlowNode(...args)
      this.props.refreshFlowsLinks()
    }

    if (flowType === 'skill-call') {
      return (
        <SkillCallNode
          readOnly={readOnly}
          user={this.props.user}
          flow={this.props.currentFlow}
          subflows={subflows}
          node={this.props.currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={this.props.updateFlow}
          requestEditSkill={this.props.requestEditSkill}
          copyFlowNodeElement={this.props.copyFlowNodeElement}
          pasteFlowNodeElement={this.props.pasteFlowNodeElement}
          buffer={this.props.buffer}
        />
      )
    }

    if (nodeTypes.includes(flowType)) {
      return (
        <StandardNode
          readOnly={readOnly}
          flow={this.props.currentFlow}
          subflows={subflows}
          node={this.props.currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={this.props.updateFlow}
          copyFlowNodeElement={this.props.copyFlowNodeElement}
          pasteFlowNodeElement={this.props.pasteFlowNodeElement}
          transitionOnly={flowType === 'router'}
          buffer={this.props.buffer}
        />
      )
    }

    return <FlowInformation {...this.props} subflows={subflows} />
  }
}

const mapStateToProps = state => ({
  flows: _.values(state.flows.flowsByName),
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state),
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
