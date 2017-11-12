import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

import { Panel, Button } from 'react-bootstrap'

import EditableInput from '../common/EditableInput'
import ActionItem from '../common/action'

import ActionSection from './ActionSection'

const style = require('./style.scss')

export default class SidePanel extends Component {
  renameNode(text) {
    let newText = text.replace(/[^a-z0-9-_\.]/i, '').toLowerCase()

    if (newText.length > 0 && newText !== this.props.node.name) {
      this.props.updateNode({ name: newText })
    }
  }

  renderConditionSection(section, title) {
    const { node } = this.props
    const items = node[section] || []

    return (
      <Panel style={style['section-' + section]} collapsible defaultExpanded={true} header={title}>
        {items.map((item, i) => (
          <ActionItem className={style.item} text={item.condition}>
            <div className={style.remove}>
              <a onClick={() => ::this.removeAction(section, i)}>Remove</a>
            </div>
          </ActionItem>
        ))}
        <div className={style.actions}>
          <Button className={style.addAction}>Add condition</Button>
        </div>
      </Panel>
    )
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
        {this.renderConditionSection('next', 'Next nodes')}
        {::this.renderBottomSection()}
      </div>
    )
  }
}
