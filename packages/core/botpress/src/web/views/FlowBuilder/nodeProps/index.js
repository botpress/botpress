import React, { Component } from 'react'
import _ from 'lodash'

import { Modal } from 'react-bootstrap'

import StandardNode from './standardNode'
import SkillCallNode from './skillCallNode'
import FlowInformation from './flowInformation'

export default class NodePropsModal extends Component {
  render() {
    const node = this.props.currentFlowNode
    return (
      <Modal
        animation={false}
        show={this.props.show}
        onHide={this.props.closeFlowNodeProps}
        container={document.getElementById('app')}
      >
        <Modal.Header closeButton>
          <Modal.Title>{node ? 'Node Properties' : 'Flow Properties'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>{this.renderNodeProperties()}</Modal.Body>
      </Modal>
    )
  }

  goToFlow = flow => this.props.history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)

  renderNodeProperties() {
    const subflows = _.filter(_.map(this.props.flows, f => f.name), f => f !== _.get(this.props, 'currentFlow.name'))
    const flowType = _.get(this.props, 'currentFlowNode.type') || (this.props.currentFlowNode ? 'standard' : null)

    const updateNodeAndRefresh = (...args) => {
      this.props.updateFlowNode(...args)
      this.props.refreshFlowsLinks()
    }

    if (flowType === 'skill-call') {
      return (
        <SkillCallNode
          flow={this.props.currentFlow}
          subflows={subflows}
          node={this.props.currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={this.props.updateFlow}
          requestEditSkill={this.props.requestEditSkill}
          goToFlow={this.goToFlow}
          copyFlowNodeElement={this.props.copyFlowNodeElement}
          pasteFlowNodeElement={this.props.pasteFlowNodeElement}
          buffer={this.props.buffer}
        />
      )
    }

    if (flowType === 'standard') {
      return (
        <StandardNode
          flow={this.props.currentFlow}
          subflows={subflows}
          node={this.props.currentFlowNode}
          updateNode={updateNodeAndRefresh}
          updateFlow={this.props.updateFlow}
          copyFlowNodeElement={this.props.copyFlowNodeElement}
          pasteFlowNodeElement={this.props.pasteFlowNodeElement}
          buffer={this.props.buffer}
        />
      )
    }

    return <FlowInformation {...this.props} subflows={subflows} />
  }
}
