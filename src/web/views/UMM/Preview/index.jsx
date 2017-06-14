import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

import Block from './Block'

const style = require('./style.scss')

export default class Preview extends Component {
  constructor(props) {
    super(props)
  }

  renderBlock(block, key) {
    if (_.size(block) === 0) {
      const data = [
        { type: key, unsupported: true }
      ]
      return <Block key={key} data={data} />
    }

    return <Block key={key} data={block} />
  }

  render() {
    const classNames = classnames({
      [style.preview]: true,
      'bp-umm-preview': true,
      [style.loading]: this.props.loading,
      'bp-umm-preview-loading': this.props.loading
    })

    return <div className={classNames}>
        {_.map(this.props.blocks, this.renderBlock)}
      </div>
  }
}
