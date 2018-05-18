import React, { Component } from 'react'

import reject from 'lodash/reject'

import FlowsList from './flows'

const style = require('./style.scss')

export default class SidePanel extends Component {
  goToFlow = flow => this.props.history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)

  render() {
    const normalFlows = reject(this.props.flows, x => x.name.startsWith('skills/'))

    return (
      <div className={style.panel}>
        <FlowsList
          flows={normalFlows}
          dirtyFlows={this.props.dirtyFlows}
          goToFlow={this.goToFlow}
          deleteFlow={this.props.deleteFlow}
          duplicateFlow={this.props.duplicateFlow}
          currentFlow={this.props.currentFlow}
        />
      </div>
    )
  }
}
