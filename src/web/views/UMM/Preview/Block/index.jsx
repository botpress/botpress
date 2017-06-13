import React, { Component } from 'react'
import {
  Tooltip,
  OverlayTrigger,
  Glyphicon
} from 'react-bootstrap'

import classnames from 'classnames'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

const style = require('./style.scss')

export default class Block extends Component {
  constructor(props) {
    super(props)
  }

  renderWaiting(wait, key) {
    const classNames = classnames({
      [style.waiting]: true,
      'bp-umm-waiting': true
    })

    const tooltip = <Tooltip id="tooltip">
      Waiting <strong>{wait}</strong> seconds after sending...
    </Tooltip>

    return <div className={classNames} key={key}>
      <OverlayTrigger placement="top" overlay={tooltip}>
        <Glyphicon glyph='time' />
      </OverlayTrigger>
    </div>
  }

  renderOutgoing(data, key) {
    let { platform, type, text, wait, raw } = data

    if (type === 'wait') {
      return this.renderWaiting(wait, key)
    }

    if (platform === 'facebook') {
      platform = 'messenger'
    }

    const moduleName = 'botpress-' + platform

    return (
      <InjectedModuleView
        key={key}
        moduleName={moduleName}
        viewName={'UMMOutgoing'}
        type={type}
        text={text}
        raw={raw}
        onNotFound={null} />
    ) 
  }

  render() {
    const classNames = classnames({
      [style.block]: true,
      'bp-umm-block': true
    })

    return <div className={classNames}>
        {this.props.data.map(::this.renderOutgoing)}
      </div>
  }
}
