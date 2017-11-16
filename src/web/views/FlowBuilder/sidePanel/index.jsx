import React, { Component } from 'react'

import { Tabs, Tab } from 'react-bootstrap'

import StandardNode from './standardNode'
import FlowInformation from './flowInformation'

import FlowsList from './flows/list'

export default class SidePanel extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    return (
      <Tabs animation={false}>
        <Tab eventKey={1} title="Flows">
          <FlowsList flows={this.props.flows} switchFlow={this.props.switchFlow} currentFlow={this.props.currentFlow} />
        </Tab>
        <Tab eventKey={3} title="Node">
          {this.renderBefore()}
        </Tab>
      </Tabs>
    )
  }

  renderBefore() {
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
