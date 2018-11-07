import React, { Component } from 'react'
import { Popover, OverlayTrigger, Well } from 'react-bootstrap'

import classnames from 'classnames'
import Mustache from 'mustache'
import _ from 'lodash'

const style = require('./style.scss')

export default class ConditionItem extends Component {
  renderNormal(child) {
    return child
  }

  renderOverlay = child => {
    const popoverHoverFocus = (
      <Popover id="popover-action" title="⚡ Conditional transition">
        <Well>{this.props.condition.condition}</Well>
      </Popover>
    )

    return (
      <OverlayTrigger trigger={['hover', 'focus']} placement="top" delayShow={500} overlay={popoverHoverFocus}>
        {child}
      </OverlayTrigger>
    )
  }

  render() {
    const { position } = this.props

    const { condition, caption } = this.props.condition

    let raw = null
    const renderer = caption ? this.renderOverlay : this.renderNormal

    if (caption) {
      const vars = {}

      const stripDots = str => str.replace(/\./g, '--dot--')
      const restoreDots = str => str.replace(/--dot--/g, '.')

      const htmlTpl = caption.replace(/\[(.+)]/gi, x => {
        const name = stripDots(x.replace(/\[|]/g, ''))
        vars[name] = '<span class="val">' + _.escape(name) + '</span>'
        return '{{{' + name + '}}}'
      })

      const mustached = restoreDots(Mustache.render(htmlTpl, vars))
      raw = mustached
    } else {
      if ((condition && condition.length <= 0) || /^(yes|true)$/i.test(condition.toLowerCase())) {
        raw = position === 0 ? 'always' : 'otherwise'
      } else {
        raw = condition
      }
    }

    return renderer(
      <div className={classnames(this.props.className, style['action-item'], style['condition'])}>
        <span className={style.icon}>❓</span>
        <span className={style.name} dangerouslySetInnerHTML={{ __html: raw }} />
        {this.props.children}
      </div>
    )
  }
}
