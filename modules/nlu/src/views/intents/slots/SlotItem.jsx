import React from 'react'
import style from './style.scss'
import colors from '../colors.scss'
import classnames from 'classnames'

export default class SlotItem extends React.Component {
  handleDeleteClicked = e => {
    e.preventDefault()

    if (confirm('Are you sure you want to delete this slot and all associated tagging from all utterances?')) {
      this.props.onDelete && this.props.onDelete(this.props.slot)
    }
  }

  handleEditClicked = e => {
    e.preventDefault()
    this.props.onEdit && this.props.onEdit(this.props.slot)
  }

  render() {
    const { slot } = this.props
    const className = classnames(style.entityLabel, colors['label-colors-' + slot.color])
    return (
      <li className={style.entityItem}>
        <span className={className}>{slot.name}</span>
        <span className={style.type}>{slot.type}</span>
        <a href onClick={this.handleDeleteClicked}>
          Delete
        </a>
        <a href onClick={this.handleEditClicked}>
          Edit
        </a>
      </li>
    )
  }
}
