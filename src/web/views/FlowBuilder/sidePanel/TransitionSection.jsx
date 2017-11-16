import React, { Component } from 'react'
import _ from 'lodash'

import { Panel, Button } from 'react-bootstrap'

import ConditionItem from '../common/condition'

import NewConditionModal from './properties/NewConditionModal'

const style = require('./style.scss')

export default class TransitionSection extends Component {
  constructor(props) {
    super(props)
    this.state = {
      showNewConditionModal: false
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

  onAdd(item) {
    const clone = [...this.props.items, item]
    this.setState({ showNewConditionModal: false })
    this.props.onItemsUpdated(clone)
  }

  onRemove(index) {
    const clone = [...this.props.items]
    _.pullAt(clone, [index])
    this.props.onItemsUpdated(clone)
  }

  render() {
    let { items, header } = this.props

    if (!items) {
      items = []
    }

    const renderMoveUp = i => (i > 0 ? <a onClick={() => this.onMove(i, -1)}>Up</a> : null)

    const renderMoveDown = i => (i < items.length - 1 ? <a onClick={() => this.onMove(i, 1)}>Down</a> : null)

    const handleAddAction = () => this.setState({ showNewConditionModal: true })

    return (
      <div>
        <Panel collapsible defaultExpanded={true} header={header}>
          {items.map((item, i) => (
            <ConditionItem className={style.item} text={item.condition}>
              <div className={style.actions}>
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
        <NewConditionModal
          subflows={this.props.subflows}
          show={this.state.showNewConditionModal}
          onClose={() => this.setState({ showNewConditionModal: false })}
          onAdd={::this.onAdd}
        />
      </div>
    )
  }
}
