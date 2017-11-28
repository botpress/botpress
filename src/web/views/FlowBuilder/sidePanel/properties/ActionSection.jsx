import React, { Component } from 'react'
import _ from 'lodash'

import { Panel, Button } from 'react-bootstrap'

import NewActionModal from './NewActionModal'
import ActionItem from '../../common/action'

const style = require('../style.scss')

export default class ActionSection extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showNewActionModal: false
    }
  }

  onMoveAction(prevIndex, direction) {
    const clone = [...this.props.items]
    const a = clone[prevIndex]
    const b = clone[prevIndex + direction]

    clone[prevIndex + direction] = a
    clone[prevIndex] = b

    this.props.onItemsUpdated(clone)
  }

  onAddAction(options) {
    let action = null

    if (options.type === 'message') {
      action = '@' + options.message // TODO Update this to "say #bloc [message]" structure
    } else {
      action = options.functionName + ' ' + JSON.stringify(options.parameters || {})
    }

    const copy = [...(this.props.items || []), action]

    this.props.onItemsUpdated(copy)
    this.setState({ showNewActionModal: false })
  }

  onRemoveAction(index) {
    const clone = [...this.props.items]
    _.pullAt(clone, [index])
    this.props.onItemsUpdated(clone)
  }

  render() {
    let { items, header } = this.props

    if (!items) {
      items = []
    }

    const renderMoveUp = i => (i > 0 ? <a onClick={() => this.onMoveAction(i, -1)}>Up</a> : null)

    const renderMoveDown = i => (i < items.length - 1 ? <a onClick={() => this.onMoveAction(i, 1)}>Down</a> : null)

    const handleAddAction = () => this.setState({ showNewActionModal: true })

    return (
      <div>
        <Panel collapsible defaultExpanded={true} header={header}>
          {items.map((item, i) => (
            <ActionItem className={style.item} text={item}>
              <div className={style.actions}>
                <a onClick={() => this.onRemoveAction(i)}>Remove</a>
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
        <NewActionModal
          show={this.state.showNewActionModal}
          onClose={() => this.setState({ showNewActionModal: false })}
          onAdd={::this.onAddAction}
        />
      </div>
    )
  }
}
