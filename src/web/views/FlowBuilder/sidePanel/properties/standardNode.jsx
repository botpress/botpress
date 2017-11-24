import React, { Component } from 'react'
import classnames from 'classnames'

import { Button } from 'react-bootstrap'

import EditableInput from '../../common/EditableInput'

import ActionSection from './ActionSection'
import TransitionSection from './TransitionSection'

const style = require('../style.scss')

export default class StandardNodePropertiesPanel extends Component {
  renameNode(text) {
    let newText = text.replace(/[^a-z0-9-_\.]/i, '_').toLowerCase()

    if (newText.length > 0 && newText !== this.props.node.name) {
      this.props.updateNode({ name: newText })
    }
  }

  render() {
    const { node } = this.props

    const onNameMounted = input => {
      if (input.value.startsWith('node-')) {
        input.focus()
        input.setSelectionRange(0, 1000)
      }
    }

    return (
      <div className={classnames(style.node, style['standard-node'])}>
        <EditableInput onMount={onNameMounted} value={node.name} className={style.name} onChanged={::this.renameNode} />
        <ActionSection
          items={node['onEnter']}
          header="On Enter"
          onItemsUpdated={items => this.props.updateNode({ onEnter: items })}
        />
        <ActionSection
          items={node['onReceive']}
          header="On Receive"
          onItemsUpdated={items => this.props.updateNode({ onReceive: items })}
        />
        <TransitionSection
          items={node['next']}
          header="Transitions"
          subflows={this.props.subflows}
          onItemsUpdated={items => this.props.updateNode({ next: items })}
        />
      </div>
    )
  }
}
