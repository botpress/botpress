import React, { Component } from 'react'

import reject from 'lodash/reject'
import classnames from 'classnames'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'

import FlowsList from './flows'

const style = require('./style.scss')

export default class SidePanel extends Component {
  createFlow = () => {
    let name = prompt('Enter the name of the new flow')

    if (!name) {
      return
    }

    name = name.replace(/\.flow\.json$/i, '')

    if (/[^A-Z0-9-_\/]/i.test(name)) {
      return alert('ERROR: The flow name can only contain letters, numbers, underscores and hyphens.')
    }

    if (_.includes(this.props.flowsNames, name + '.flow.json')) {
      return alert('ERROR: This flow already exists')
    }

    this.props.onCreateFlow(name)
  }

  goToFlow = flow => this.props.history.push(`/flows/${flow.replace(/\.flow\.json/, '')}`)

  render() {
    const normalFlows = reject(this.props.flows, x => x.name.startsWith('skills/'))

    return (
      <div className={style.panel}>
        <div className={style.panelHead}>
          <span>Flows</span>
          {!this.props.readOnly && (
            <button className={classnames(style.newFlow, 'pull-right')} onClick={this.createFlow}>
              <OverlayTrigger placement="bottom" overlay={<Tooltip>Create flow</Tooltip>}>
                <i className="material-icons">create_new_folder</i>
              </OverlayTrigger>
            </button>
          )}
        </div>
        <FlowsList
          readOnly={this.props.readOnly}
          flows={normalFlows}
          dirtyFlows={this.props.dirtyFlows}
          goToFlow={this.goToFlow}
          deleteFlow={this.props.deleteFlow}
          duplicateFlow={this.props.duplicateFlow}
          renameFlow={this.props.renameFlow}
          currentFlow={this.props.currentFlow}
        />
      </div>
    )
  }
}
