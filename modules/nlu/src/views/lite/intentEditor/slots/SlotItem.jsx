import React from 'react'
import style from '../style.scss'
import { Tag } from '@blueprintjs/core'

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
    // TODO replace edit link with a simple click on the tag
    // TODO replace delete link with simple click on the remove tag
    const { slot } = this.props
    return (
      <li className={style.entityItem}>
        <Tag className={style[`label-colors-${slot.color}`]} round large>
          {slot.name}
        </Tag>
        <a onClick={this.handleDeleteClicked} className={style.link}>
          Delete
        </a>
        <a onClick={this.handleEditClicked} className={style.link}>
          Edit
        </a>
      </li>
    )
  }
}
