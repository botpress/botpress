import React, { Component } from 'react'
import classnames from 'classnames'

import Outgoing from './Outgoing'

const style = require('./style.scss')

export default class Block extends Component {
  constructor(props) {
    super(props)
  }

  renderOutgoing(data, key) {
    return <Outgoing data={data} key={key} />
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
