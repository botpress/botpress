import React, { Component } from 'react'
import _ from 'lodash'

import { Panel, Button } from 'react-bootstrap'

import ActionModalForm from './ActionModalForm'
import ActionItem from '../../common/action'

const style = require('../style.scss')

export default class ActionSection extends Component {
  constructor(props) {
    super(props)
    this.state = { showActionModalForm: false }
  }

  onMoveAction(prevIndex, direction) {
    const clone = [...this.props.items]
    const a = clone[prevIndex]
    const b = clone[prevIndex + direction]

    clone[prevIndex + direction] = a
    clone[prevIndex] = b

    this.props.onItemsUpdated(clone)
  }

  optionsToItem(options) {
    if (options.type === 'message') {
      return options.message
    }
    return options.functionName + ' ' + JSON.stringify(options.parameters || {})
  }

  itemToOptions(item) {
    if (item && item.startsWith('say ')) {
      const chunks = item.split(' ')
      let text = item
      if (chunks.length > 2) {
        text = _.slice(chunks, 2).join(' ')
      }

      return { type: 'message', message: text }
    } else if (item) {
      const params = item.includes(' ') ? JSON.parse(item.substring(item.indexOf(' ') + 1)) : {}
      return {
        type: 'code',
        functionName: item.split(' ')[0],
        parameters: params
      }
    }
  }

  onSubmitAction(options) {
    const item = this.optionsToItem(options)
    const editIndex = this.state.itemToEditIndex
    const { items } = this.props
    const updateByIndex = (originalItem, i) => (i === editIndex ? item : originalItem)

    this.setState({ showActionModalForm: false, itemToEditIndex: null })
    this.props.onItemsUpdated(Number.isInteger(editIndex) ? items.map(updateByIndex) : [...(items || []), item])
  }

  onRemoveAction(index) {
    const clone = [...this.props.items]
    _.pullAt(clone, [index])
    this.props.onItemsUpdated(clone)
  }

  onEdit(itemToEditIndex) {
    this.setState({ itemToEditIndex, showActionModalForm: true })
  }

  renderWait() {
    const { items } = this.props

    if (!this.props.waitable || (items && items.length > 0)) {
      return null
    }

    const checked = _.isArray(items)

    const changeChecked = () => this.props.onItemsUpdated && this.props.onItemsUpdated(checked ? null : [])

    return (
      <label>
        <input name="isGoing" type="checkbox" checked={checked} onChange={changeChecked} />
        {'  Wait for user message'}
      </label>
    )
  }

  render() {
    let { items, header } = this.props

    if (_.isNil(items)) {
      items = []
    }

    const renderMoveUp = i => (i > 0 ? <a onClick={() => this.onMoveAction(i, -1)}>Up</a> : null)

    const renderMoveDown = i => (i < items.length - 1 ? <a onClick={() => this.onMoveAction(i, 1)}>Down</a> : null)

    const handleAddAction = () => this.setState({ showActionModalForm: true })

    return (
      <div>
        <Panel collapsible defaultExpanded={true} header={header}>
          {this.renderWait()}
          {items.map((item, i) => (
            <ActionItem className={style.item} text={item}>
              <div className={style.actions}>
                <a onClick={() => this.onEdit(i)}>Edit</a>
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
        <ActionModalForm
          show={this.state.showActionModalForm}
          onClose={() => this.setState({ showActionModalForm: false, itemToEditIndex: null })}
          onSubmit={::this.onSubmitAction}
          item={this.itemToOptions(items && items[this.state.itemToEditIndex])}
        />
      </div>
    )
  }
}
