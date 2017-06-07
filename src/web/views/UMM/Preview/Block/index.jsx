import React, { Component } from 'react'
import classnames from 'classnames'

import Outgoing from './Outgoing'
import InjectedModuleView from '~/components/PluginInjectionSite/module'

const style = require('./style.scss')

export default class Block extends Component {
  constructor(props) {
    super(props)
  }

  renderOutgoing({ platform, type, text, raw }, key) {
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
        {this.props.data.map(this.renderOutgoing)}
      </div>
  }
}
