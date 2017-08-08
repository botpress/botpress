import React, { Component } from 'react'
import classnames from 'classnames'

const style = require('./style.scss')

export default class ManageView extends Component {
  constructor(props) {
    super(props)
  }

  renderItems() {
    <div>{this.props.selected || 'All'}</div>
  }

  render() {
    const classNames = classnames({
      'bp-manage': true,
      [style.manage]: true
    })

    return <div className={classNames}>
      Manage
      {this.renderItems()}
    </div>
  }
}
