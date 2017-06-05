import React, { Component } from 'react'
import classnames from 'classnames'
import _ from 'lodash'

import {
  FormGroup,
  FormControl
 } from 'react-bootstrap'

const style = require('./style.scss')

export default class ListView extends Component {
  constructor(props) {
    super(props)
  }

  filteredBlocks() {
    const filteredBlocks = {}

    _.forEach(this.props.blocks, (value, key) => {
      if (_.includes(key, this.props.search)) {
        filteredBlocks[key] = value
      }
    }) 

    return filteredBlocks
  }

  renderBlockTitle(value, key) {
    const classNames = classnames({
      selected: this.props.selected && this.props.selected === key
    })

    return <li key={key}>
        <a className={classNames}
          onClick={() => this.props.update(key)}>
          {key}
        </a>
      </li>
  }

  render() {
    let blocks = this.props.blocks

    if (this.props.search && this.props.search !== '') {
      blocks = this.filteredBlocks()
    }

    const classNames = classnames({
      'bp-list': true,
      [style.list]: true
    })

    return <div className={classNames}>
      <ul>
        {_.map(blocks, ::this.renderBlockTitle)}
      </ul>
    </div>
  }
}
