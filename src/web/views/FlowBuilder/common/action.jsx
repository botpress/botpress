import React, { Component } from 'react'
import classnames from 'classnames'

const style = require('./style.scss')

export default class ActionItem extends Component {
  render() {
    const action = this.props.text
    const cls = action.startsWith('@') ? style.msg : style.fn
    const prefix = action.startsWith('@') ? (
      <span className={style.icon}>💬</span>
    ) : (
      <span className={style.icon}>⚡</span>
    )
    return (
      <div className={classnames(this.props.className, style['action-item'], cls)}>
        {prefix}
        <span className={style.name}>{action}</span>
        {this.props.children}
      </div>
    )
  }
}
