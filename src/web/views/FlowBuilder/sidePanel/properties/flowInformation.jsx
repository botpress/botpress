import React, { Component } from 'react'
import classnames from 'classnames'

import ActionSection from './ActionSection'
import TransitionSection from './TransitionSection'

const style = require('../style.scss')

export default class FlowPropertiesPanel extends Component {
  render() {
    let catchAll = Object.assign(
      {
        onReceive: [],
        next: []
      },
      this.props.currentFlow && this.props.currentFlow.catchAll
    )

    return (
      <div className={classnames(style.node, style['standard-node'])}>
        <ActionSection
          items={catchAll['onReceive']}
          header="On Receive"
          onItemsUpdated={items => this.props.updateFlow({ catchAll: { ...catchAll, onReceive: items } })}
        />
        <TransitionSection
          items={catchAll['next']}
          header="Transitions"
          subflows={this.props.subflows}
          onItemsUpdated={items => this.props.updateFlow({ catchAll: { ...catchAll, next: items } })}
        />
      </div>
    )
  }
}
