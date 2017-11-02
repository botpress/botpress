import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

import { Panel, Button } from 'react-bootstrap'

import EditableInput from '../common/EditableInput'
import ActionItem from '../common/action'

import NewActionModal from './NewActionModal'

const style = require('./style.scss')

export default class SidePanel extends Component {
  constructor(props) {
    super(props)
    this.state = {
      currentSection: null,
      showNewActionModal: false
    }
  }

  onAddActionClicked(options) {
    const { node } = this.props
    console.log(options)
    const action = options.type === 'message' ? '@' + options.message : options.functionName

    const section = this.state.currentSection
    const copy = [...(node[section] || []), action]

    this.props.updateNode({
      [section]: copy
    })

    this.setState({
      showNewActionModal: false,
      currentSection: null
    })
  }

  removeAction(name, index) {
    const clone = [...this.props.node[name]]
    _.pullAt(clone, [index])
    this.props.updateNode({
      [name]: clone
    })
  }

  moveAction(name, prevIndex, direction) {
    const clone = [...this.props.node[name]]
    const a = clone[prevIndex]
    const b = clone[prevIndex + direction]

    clone[prevIndex + direction] = a
    clone[prevIndex] = b

    this.props.updateNode({
      [name]: clone
    })
  }

  renameNode(text) {
    let newText = text.replace(/[^a-z0-9-_\.]/i, '').toLowerCase()

    if (newText.length > 0 && newText !== this.props.node.name) {
      this.props.updateNode({ name: newText })
    }
  }

  renderActionSection(section, title) {
    const { node } = this.props

    const items = node[section] || []

    const renderMoveUp = i => (i > 0 ? <a onClick={() => this.moveAction(section, i, -1)}>Up</a> : null)

    const renderMoveDown = i =>
      i < node[section].length - 1 ? <a onClick={() => this.moveAction(section, i, 1)}>Down</a> : null

    const handleAddAction = () =>
      this.setState({
        currentSection: section,
        showNewActionModal: true
      })

    return (
      <Panel style={style['section-' + section]} collapsible defaultExpanded={true} header={title}>
        {items.map((item, i) => (
          <ActionItem className={style.item} text={item}>
            <div className={style.actions}>
              <a onClick={() => this.removeAction(section, i)}>Remove</a>
              {renderMoveUp(i)}
              {renderMoveDown(i)}
            </div>
          </ActionItem>
        ))}
        <div className={style.actions}>
          <Button className={style.addAction} onClick={handleAddAction}>
            Add action
          </Button>
        </div>
      </Panel>
    )
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

        {this.renderActionSection('onEnter', 'On Enter')}
        {this.renderActionSection('onReceive', 'On Receive')}
        {this.renderConditionSection('next', 'Next nodes')}
        {::this.renderBottomSection()}

        <NewActionModal
          show={this.state.showNewActionModal}
          onClose={() => {
            this.setState({ showNewActionModal: false })
          }}
          onAdd={::this.onAddActionClicked}
        />
      </div>
    )
  }
}
