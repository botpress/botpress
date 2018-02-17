import React, { Component } from 'react'
import SplitPane from 'react-split-pane'

import { Tabs, Tab } from 'react-bootstrap'
import _ from 'lodash'
import classnames from 'classnames'

import StandardNode from './properties/standardNode'
import SkillCallNode from './properties/skillCallNode'
import FlowInformation from './properties/flowInformation'

import FlowsList from './flows/list'

const style = require('./style.scss')

export default class SidePanel extends Component {
  state = {}

  goToFlow = flow => this.props.router.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)

  render() {
    const objectPropertiesTitle = !!this.props.currentFlowNode ? 'Node Properties' : 'Flow Properties'
    const [skills, nonSkills] = _.partition(this.props.flows, x => x.name.startsWith('skills/'))

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
                flows={nonSkills}
                dirtyFlows={this.props.dirtyFlows}
                goToFlow={this.goToFlow}
                deleteFlow={this.props.deleteFlow}
                duplicateFlow={this.props.duplicateFlow}
                currentFlow={this.props.currentFlow}
              />
            </Tab>
            <Tab eventKey={2} title="Skills">
              <FlowsList
                stripPrefix="skills/"
                flows={skills}
                dirtyFlows={this.props.dirtyFlows}
                goToFlow={this.goToFlow}
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
              {this.renderNodeProperties()}
            </Tab>
          </Tabs>
        </div>
      </SplitPane>
    )
  }

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
