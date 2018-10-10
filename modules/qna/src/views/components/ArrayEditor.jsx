import React, { Component, Fragment } from 'react'
import omit from 'lodash/omit'
import Promise from 'bluebird'

const NEW_INDEX = 'new'

export default class ArrayEditor extends Component {
  state = {
    originals: {}
  }

  onCreate = () => {
    const { newItem, onCreate, updateState, createNewItem } = this.props

    Promise.resolve(onCreate && onCreate(newItem)).then(updatedNewItem => {
      updateState &&
        updateState({
          newItem: createNewItem(),
          items: [updatedNewItem || newItem].concat(this.props.items)
        })
    })
  }

  onChange = (value, index) => {
    const { onChange, updateState } = this.props

    Promise.resolve(onChange && onChange(value, index)).then(() => {
      if (index == null) {
        if (!this.state.originals[NEW_INDEX]) {
          this.setState({
            originals: {
              ...this.state.originals,
              [NEW_INDEX]: this.props.newItem
            }
          })
        }
        updateState && updateState({ newItem: value })
      } else {
        const items = [...this.props.items]
        items[index] = value
        if (!this.state.originals[index]) {
          this.setState({
            originals: {
              ...this.state.originals,
              [index]: this.props.items[index]
            }
          })
        }
        updateState && updateState({ items })
      }
    })
  }

  onEdit = index => {
    const { onEdit } = this.props

    Promise.resolve(onEdit && onEdit(index)).then(() => {
      this.setState({
        originals: omit(this.state.originals, index)
      })
    })
  }

  onReset = index => {
    const { onReset, updateState } = this.props

    Promise.resolve(onReset && onReset(index)).then(() => {
      if (index == null) {
        updateState &&
          updateState({
            newItem: this.state.originals[NEW_INDEX]
          })
        this.setState({
          originals: omit(this.state.originals, NEW_INDEX)
        })
      } else {
        const items = [...this.props.items]
        items[index] = this.state.originals[index]
        updateState && updateState({ items })
        this.setState({ originals: omit(this.state.originals, index) })
      }
    })
  }

  onDelete = index => {
    const { items, onDelete, updateState } = this.props

    Promise.resolve(onDelete && onDelete(items[index], index)).then(() => {
      updateState && updateState({ items: items.slice(0, index).concat(items.slice(index + 1)) })
    })
  }

  isDirty = index => this.state.originals[index == null ? NEW_INDEX : index] !== undefined

  renderItemForm = (value, index, values) => {
    const { renderItem, shouldShowItem } = this.props

    if (shouldShowItem && !shouldShowItem(value, index)) {
      return null
    }

    return (
      <Fragment key={index != null ? index : 'new'}>
        {renderItem(value, index, {
          values,
          isDirty: this.isDirty(index),
          onCreate: this.onCreate,
          onEdit: this.onEdit,
          onReset: this.onReset,
          onDelete: this.onDelete,
          onChange: this.onChange
        })}
      </Fragment>
    )
  }

  render() {
    const { newItem, items, renderPagination } = this.props

    return (
      <Fragment>
        {this.renderItemForm(newItem, null, null)}
        {renderPagination && renderPagination()}
        {items && items.map(this.renderItemForm)}
        {renderPagination && renderPagination()}
      </Fragment>
    )
  }
}
