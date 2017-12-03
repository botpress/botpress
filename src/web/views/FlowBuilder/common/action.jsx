import React, { Component } from 'react'
import classnames from 'classnames'
import { Popover, OverlayTrigger } from 'react-bootstrap'
import _ from 'lodash'

const style = require('./style.scss')

export default class ActionItem extends Component {
  renderAction() {
    const action = this.props.text.trim()

    let actionName = action
    let parameters = {}

    if (action.indexOf(' ') >= 0) {
      const tokens = action.split(' ')
      actionName = _.head(tokens) + ' (args)'
      parameters = JSON.parse(_.tail(tokens).join(' '))
    }

    const callPreview = JSON.stringify(parameters, null, 2)

    const popoverHoverFocus = (
      <Popover id="popover-action" title={`⚡ ${actionName}`}>
        Called with these arguments:
        <pre>{callPreview}</pre>
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
    const action = this.props.text
    const isAction = typeof action !== 'string' || !action.startsWith('@')

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
