import React, { Component } from 'react'
import SplitPane from 'react-split-pane'

import { Tabs, Tab } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'

import StandardNode from './properties/standardNode'
import FlowInformation from './properties/flowInformation'

import FlowsList from './flows/list'

const style = require('./style.scss')

export default class SidePanel extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  render() {
    const objectPropertiesTitle = !!this.props.currentFlowNode ? 'Node Properties' : 'Flow Properties'

    return (
      <SplitPane
        split="horizontal"
        minSize={50}
        defaultSize={200}
        pane2Style={{
          overflowY: 'auto',
          maxHeight: '100%'
        }}
      >
        <div className={classnames(style.panelTop)}>
          <Tabs animation={false}>
            <Tab eventKey={1} title="Flows">
              <FlowsList
                flows={this.props.flows}
                dirtyFlows={this.props.dirtyFlows}
                switchFlow={this.props.switchFlow}
                deleteFlow={this.props.deleteFlow}
                duplicateFlow={this.props.duplicateFlow}
                currentFlow={this.props.currentFlow}
              />
            </Tab>
          </Tabs>
        </div>
        <div className={classnames(style.panelDown)}>
          <Tabs animation={false}>
            <Tab eventKey={3} title={objectPropertiesTitle}>
              {this.renderBefore()}
            </Tab>
          </Tabs>
        </div>
      </SplitPane>
    )
  }

  renderBefore() {
    const subflows = _.filter(_.map(this.props.flows, f => f.name), f => f !== _.get(this.props, 'currentFlow.name'))

    if (this.props.currentFlowNode) {
      return (
        <StandardNode
          flow={this.props.currentFlow}
          subflows={subflows}
          node={this.props.currentFlowNode}
          updateNode={this.props.updateFlowNode}
          updateFlow={this.props.updateFlow}
        />
      )
    }

    return <FlowInformation {...this.props} subflows={subflows} />
  }
}
