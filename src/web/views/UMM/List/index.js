import React, { Component } from 'react'
import classnames from 'classnames'

import { FormGroup, FormControl } from 'react-bootstrap'

const style = require('./style.scss')

export default class ListView extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const classNames = classnames({
      'bp-list': true,
      [style.list]: true
    })

    return <div className={classNames} />
  }
}
