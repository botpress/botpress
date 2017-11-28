import React, { Component } from 'react'
import classnames from 'classnames'

import { Button } from 'react-bootstrap'

import EditableInput from '../../common/EditableInput'

import ActionSection from './ActionSection'
import TransitionSection from './TransitionSection'

const style = require('../style.scss')

export default class StandardNodePropertiesPanel extends Component {
  renameNode(text) {
    if (text.length > 0 && text !== this.props.node.name) {
      this.props.updateNode({ name: text })
    }
  }

  transformText(text) {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
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
        <EditableInput
          onMount={onNameMounted}
          value={node.name}
          className={style.name}
          onChanged={::this.renameNode}
          transform={this.transformText}
        />
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
