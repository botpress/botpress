import React, { Component } from 'react'
import _ from 'lodash'

import { Panel, Button, Label } from 'react-bootstrap'

import ConditionItem from '../../common/condition'

import ConditionModalForm from './ConditionModalForm'

const style = require('../style.scss')

export default class TransitionSection extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showConditionalModalForm: false
    }
  }

  onMove(prevIndex, direction) {
    const clone = [...this.props.items]
    const a = clone[prevIndex]
    const b = clone[prevIndex + direction]

    clone[prevIndex + direction] = a
    clone[prevIndex] = b

    this.props.onItemsUpdated(clone)
  }

  onSubmit(item) {
    const editIndex = this.state.itemToEditIndex
    const { items } = this.props
    const updateByIndex = (originalItem, i) => (i === editIndex ? item : originalItem)
    this.setState({ showConditionalModalForm: false, itemToEditIndex: null })
    this.props.onItemsUpdated(Number.isInteger(editIndex) ? items.map(updateByIndex) : [...items, item])
  }

  onRemove(index) {
    const clone = [...this.props.items]
    _.pullAt(clone, [index])
    this.props.onItemsUpdated(clone)
  }

  onEdit(itemToEditIndex) {
    this.setState({ itemToEditIndex, showConditionalModalForm: true })
  }

  render() {
    let { items, header } = this.props

    if (!items) {
      items = []
    }

    const renderMoveUp = i => (i > 0 ? <a onClick={() => this.onMove(i, -1)}>Up</a> : null)

    const renderMoveDown = i => (i < items.length - 1 ? <a onClick={() => this.onMove(i, 1)}>Down</a> : null)

    const handleAddAction = () => this.setState({ showConditionalModalForm: true })

    const renderType = i => {
      if (!i.node || i.node === '') {
        return <Label bsStyle="danger">Missing Link</Label>
      }

      if (i.node === 'END') {
        return <Label bsStyle="warning">End</Label>
      }

      if (i.node.includes('.flow.json')) {
        return <Label bsStyle="primary">{i.node}</Label>
      }

      return <Label bsStyle="default">{i.node}</Label>
    }

    return (
      <div>
        <Panel collapsible defaultExpanded={true} header={header}>
          {items.map((item, i) => (
            <ConditionItem className={style.item} text={item.condition} position={i}>
              {renderType(item)}
              <div className={style.actions}>
                <a onClick={() => this.onEdit(i)}>Edit</a>
                <a onClick={() => this.onRemove(i)}>Remove</a>
                {renderMoveUp(i)}
                {renderMoveDown(i)}
              </div>
            </ConditionItem>
          ))}
          <div className={style.actions}>
            <Button className={style.addAction} onClick={handleAddAction}>
              Add condition
            </Button>
          </div>
        </Panel>
        <ConditionModalForm
          currentFlow={this.props.currentFlow}
          subflows={this.props.subflows}
          show={this.state.showConditionalModalForm}
          onClose={() => this.setState({ showConditionalModalForm: false, itemToEditIndex: null })}
          onSubmit={::this.onSubmit}
          item={this.props.items[this.state.itemToEditIndex]}
        />
      </div>
    )
  }
}
