import React, { Component } from 'react'
import classnames from 'classnames'

import { SplitButton, MenuItem } from 'react-bootstrap'

const style = require('./style.scss')

export default class ActionsView extends Component {
  constructor(props) {
    super(props)
  }

  renderSelectors() {
    return (
      <SplitButton bsStyle="default" title="Messenger" key={0} id="messenger-selector">
        <MenuItem eventKey="1">Messenger</MenuItem>
        <MenuItem eventKey="2">Another action</MenuItem>
        <MenuItem eventKey="3">Something else here</MenuItem>
      </SplitButton>
    )
  }

  render() {
    const classNames = classnames({
      [style.actions]: true,
      'bp-umm-actions': true
    })

    return <div className={classNames}>{this.renderSelectors()}</div>
  }
}
