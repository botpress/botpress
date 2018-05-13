import React, { Component } from 'react'

import { Tabs, Tab } from 'react-bootstrap'
import _ from 'lodash'

import FlowsList from './flows/list'

const style = require('./style.scss')

export default class SidePanel extends Component {
  state = {}

  goToFlow = flow => this.props.history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)

  render() {
    const [skills, nonSkills] = _.partition(this.props.flows, x => x.name.startsWith('skills/'))

    return (
      <Tabs animation={false} className={style.panel} id="flow-panel-tabs-top">
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
    )
  }
}
