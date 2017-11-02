import React, { Component } from 'react'
import classnames from 'classnames'
import { Popover, OverlayTrigger } from 'react-bootstrap'

const style = require('./style.scss')

export default class ActionItem extends Component {
  renderAction() {
    const action = this.props.text
    const actionName = action.function || action

    const popoverHoverFocus = (
      <Popover id="popover-action" title={`⚡ ${actionName}`}>
        Call of this function
      </Popover>
    )

    return (
      <OverlayTrigger trigger="hover" placement="top" delayShow={500} overlay={popoverHoverFocus}>
        <div className={classnames(this.props.className, style['fn'], style['action-item'])}>
          <span className={style.icon}>⚡</span>
          <span className={style.name}>{actionName}</span>
          {this.props.children}
        </div>
      </OverlayTrigger>
    )
  }

  render() {
    const isAction = typeof action !== 'string' || !action.startsWith('@')
    const action = this.props.text

    if (isAction) {
      return this.renderAction()
    }

    return (
      <div className={classnames(this.props.className, style['action-item'], style['msg'])}>
        <span className={style.icon}>💬</span>
        <span className={style.name}>{action}</span>
        {this.props.children}
      </div>
    )
  }
}
