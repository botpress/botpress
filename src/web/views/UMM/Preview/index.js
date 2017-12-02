import React, { Component } from 'react'
import classnames from 'classnames'

const style = require('./style.scss')

export default class PreviewList extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const classNames = classnames({
      [style.preview]: true,
      'bp-umm-preview': true
    })

    return <div className={classNames} />
  }
}
