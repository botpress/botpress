import React, { Component } from 'react'
import classnames from 'classnames'

const style = require('./style.scss')

export default class ConditionItem extends Component {
  render() {
    let action = this.props.text

    if (action.length <= 0 || /^yes|true$/i.test(action.toLowerCase())) {
      action = 'always / otherwise'
    }

    return (
      <div className={classnames(this.props.className, style['action-item'], style['condition'])}>
        <span className={style.icon}>❓</span>
        <span className={style.name}>{action}</span>
        {this.props.children}
      </div>
    )
  }
}
