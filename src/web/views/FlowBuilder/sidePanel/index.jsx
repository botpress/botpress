import React, { Component } from 'react'

import StandardNode from './standardNode'
import FlowInformation from './flowInformation'

export default class SidePanel extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    if (this.props.currentFlowNode) {
      return (
        <StandardNode
          flow={this.props.currentFlow}
          node={this.props.currentFlowNode}
          updateNode={this.props.updateFlowNode}
          updateFlow={this.props.updateFlow}
          removeFlowNode={this.props.removeFlowNode}
        />
      )
    }

    return <FlowInformation {...this.props} />
  }
}
