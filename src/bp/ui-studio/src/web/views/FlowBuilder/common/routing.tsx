import classnames from 'classnames'
import _ from 'lodash'
import Mustache from 'mustache'
import React, { Component } from 'react'
import { OverlayTrigger, Popover, Well } from 'react-bootstrap'

import { ROUTER_CONDITON_REGEX } from '../utils/general.util'

const style = require('./style.scss')

interface Props {
  position: any
  condition: any
  className?: string
}

const availableProps = [
  { label: 'User Data', value: 'user' },
  { label: 'Current User Session', value: 'session' },
  { label: 'Temporary Dialog Context', value: 'temp' }
]

const parseCondition = condition => {
  condition = condition.trim()

  const extractProps = () => {
    const props = condition.match(ROUTER_CONDITON_REGEX)
    if (props && props.length > 3) {
      return { type: availableProps.find(x => x.value === props[1]), field: props[2], expression: props[3] }
    }
  }

  if (condition === 'true') {
    return { type: 'always' }
  } else if (condition.includes('event.nlu.intent.name')) {
    const intent = condition.match(/'(.*)'/)
    return { type: 'intent', value: intent && intent[1] }
  } else if (availableProps.some(props => condition.indexOf(`${props.value}.`) === 0)) {
    return { type: 'props', value: extractProps() }
  } else {
    return { type: 'raw' }
  }
}

const getLabel = parsedCondition => {
  const { type, value } = parsedCondition
  if (type === 'always') {
    return 'Always'
  } else if (type === 'intent') {
    return `Intent is ${value}`
  } else if (type === 'props') {
    return `Property ${value?.field} is ${value?.expression}`
  } else if (type === 'raw') {
    return value
  }
}

export default class RoutingItem extends Component<Props> {
  renderNormal(child) {
    return child
  }

  // TODO migrate styling to blueprint
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
        vars[name] = `<span class="val">${_.escape(name)}</span>`
        return `{{{${name}}}}`
      })

      const mustached = restoreDots(Mustache.render(htmlTpl, vars))
      raw = mustached
    } else {
      if ((condition && condition.length <= 0) || /^(yes|true)$/i.test(condition.toLowerCase())) {
        raw = position === 0 ? 'always' : 'otherwise'
      } else {
        const parsed = parseCondition(condition)

        raw = getLabel(parsed)
      }
    }

    return renderer(
      <div>
        <span className={style.name} dangerouslySetInnerHTML={{ __html: raw }} />
        {this.props.children}
      </div>
    )
  }
}
