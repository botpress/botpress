import React, { Component, Fragment } from 'react'
import _ from 'lodash'
import classnames from 'classnames'

import { Button, Label } from 'react-bootstrap'

import ConditionItem from '../common/condition'

import ConditionModalForm from './ConditionModalForm'
import { lang } from 'botpress/shared'

import { Icon, Intent, Tooltip, Position } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'

const style = require('./style.scss')

export default class TransitionSection extends Component {
  state = {
    showConditionalModalForm: false
  }

  onMove(prevIndex, direction) {
    const clone = [...this.props.items]
    const a = clone[prevIndex]
    const b = clone[prevIndex + direction]

    clone[prevIndex + direction] = a
    clone[prevIndex] = b

    this.props.onItemsUpdated(clone)
  }

  onSubmit = item => {
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

  onCopyAction(index) {
    this.props.copyItem(this.props.items[index])
  }

  onEdit(itemToEditIndex) {
    this.setState({ itemToEditIndex, showConditionalModalForm: true })
  }

  render() {
    let { items, readOnly } = this.props

    if (!items) {
      items = []
    }

    const renderMoveUp = i => {
      const enabled = i > 0
      return (
        <Tooltip position={Position.LEFT} content="Up" hoverOpenDelay="500">
          <Icon
            icon={IconNames.CHEVRON_UP}
            intent={enabled ? Intent.PRIMARY : Intent.NONE}
            onClick={() => (enabled ? this.onMoveAction(i, -1) : null)}
          />
        </Tooltip>
      )
    }
    const renderMoveDown = i => {
      const enabled = i < items.length - 1
      return (
        <Tooltip position={Position.LEFT} content="Down" hoverOpenDelay="500">
          <Icon
            icon={IconNames.CHEVRON_DOWN}
            intent={enabled ? Intent.PRIMARY : Intent.NONE}
            onClick={() => (enabled ? this.onMoveAction(i, 1) : null)}
          />
        </Tooltip>
      )
    }

    const handleAddAction = () => this.setState({ showConditionalModalForm: true })

    const renderType = i => {
      if (!i.node || i.node === '') {
        return <Label bsStyle="danger">{lang.tr('studio.flow.node.missingLink')}</Label>
      }

      if (i.node === 'END') {
        return <Label bsStyle="warning">{lang.tr('studio.flow.node.end')}</Label>
      }

      if (i.node === '#') {
        return <Label bsStyle="warning">{lang.tr('studio.flow.node.return')}</Label>
      }

      if (i.node.includes('.flow.json')) {
        return <Label bsStyle="primary">{i.node}</Label>
      }

      return <Label bsStyle="default">{i.node}</Label>
    }

    return (
      <Fragment>
        <div>
          {items.map((item, i) => (
            <ConditionItem className={style.item} condition={item} position={i} key={`${i}.${item.node || '-'}`}>
              {renderType(item)}
              {!readOnly && (
                <div className={style.actions}>
                  <div>
                    <Tooltip
                      style={style.tooltip}
                      position={Position.LEFT}
                      content={lang.tr('edit')}
                      hoverOpenDelay="500"
                    >
                      <Icon icon={IconNames.EDIT} intent={Intent.PRIMARY} onClick={() => this.onEdit(i)} />
                    </Tooltip>
                    <Tooltip position={Position.LEFT} content={lang.tr('copy')} hoverOpenDelay="500">
                      <Icon icon={IconNames.DUPLICATE} intent={Intent.PRIMARY} onClick={() => this.onCopyAction(i)} />
                    </Tooltip>
                    {renderMoveUp(i)}
                    {renderMoveDown(i)}
                  </div>

                  <div>
                    <Tooltip position={Position.LEFT} content={lang.tr('remove')} hoverOpenDelay="500">
                      <Icon icon={IconNames.TRASH} intent={Intent.DANGER} onClick={() => this.onRemoveAction(i)} />
                    </Tooltip>
                  </div>
                </div>
              )}
            </ConditionItem>
          ))}
          {!readOnly && (
            <div className={style.actions}>
              <Button onClick={handleAddAction} bsSize="xsmall">
                <i className={classnames('material-icons', style.actionIcons)}>add</i>
              </Button>
              <Button onClick={this.props.pasteItem} bsSize="xsmall" disabled={!this.props.canPaste}>
                <i className={classnames('material-icons', style.actionIcons)}>content_paste</i>
              </Button>
            </div>
          )}
        </div>
        {!readOnly && (
          <ConditionModalForm
            currentFlow={this.props.currentFlow}
            currentNodeName={this.props.currentNodeName}
            subflows={this.props.subflows}
            show={this.state.showConditionalModalForm}
            onClose={() => this.setState({ showConditionalModalForm: false, itemToEditIndex: null })}
            onSubmit={this.onSubmit}
            item={items[this.state.itemToEditIndex]}
          />
        )}
      </Fragment>
    )
  }
}
