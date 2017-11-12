import React, { Component } from 'react'
import classnames from 'classnames'

import { Button } from 'react-bootstrap'

import EditableInput from '../common/EditableInput'

import ActionSection from './ActionSection'
import TransitionSection from './TransitionSection'

const style = require('./style.scss')

export default class SidePanel extends Component {
  renameNode(text) {
    let newText = text.replace(/[^a-z0-9-_\.]/i, '').toLowerCase()

    if (newText.length > 0 && newText !== this.props.node.name) {
      this.props.updateNode({ name: newText })
    }
  }

  handleRemoveNode() {
    this.props.removeFlowNode(this.props.node.id)
  }

  renderBottomSection() {
    return (
      <div className={style.bottomSection}>
        <Button className={style.deleteNode} bsStyle="danger" onClick={::this.handleRemoveNode}>
          Delete node
        </Button>
      </div>
    )
  }

  render() {
    const { node } = this.props

    return (
      <div className={classnames(style.node, style['standard-node'])}>
        <EditableInput value={node.name} className={style.name} onChanged={::this.renameNode} />
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
          onItemsUpdated={items => this.props.updateNode({ next: items })}
        />
        {::this.renderBottomSection()}
      </div>
    )
  }
}
