import React from 'react'
import style from './style.scss'
import colors from '../colors.scss'
import classnames from 'classnames'

export default class SlotItem extends React.Component {
  onDeleteClicked = e => {
    e.preventDefault()

    const { onDelete, slot } = this.props
    if (confirm('Are you sure you want to delete this slot and all associated tagging from all utterances?')) {
      onDelete && onDelete(slot)
    }
  }

  onEditClicked = e => {
    e.preventDefault()

    const { onEdit, slot } = this.props
    onEdit && onEdit(slot)
  }

  render() {
    const { slot } = this.props
    const className = classnames(style.entityLabel, colors['label-colors-' + slot.color])
    return (
      <li className={style.entityItem}>
        <span className={className}>{slot.name}</span>
        <span className={style.type}>{slot.type}</span>
        <a href onClick={this.onDeleteClicked}>
          Delete
        </a>
        <a href onClick={this.onEditClicked}>
          Edit
        </a>
      </li>
    )
  }
}
