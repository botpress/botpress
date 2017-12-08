import React, { Component } from 'react'
import classnames from 'classnames'

import { SplitButton, MenuItem } from 'react-bootstrap'

const style = require('./style.scss')

const ActionsView = () => {
  const classNames = classnames(style.actions, 'bp-umm-actions')

  return (
    <div className={classNames}>
      <SplitButton bsStyle="default" title="Messenger" key={0} id="messenger-selector">
        <MenuItem eventKey="1">Messenger</MenuItem>
        <MenuItem eventKey="2">Another action</MenuItem>
        <MenuItem eventKey="3">Something else here</MenuItem>
      </SplitButton>
    </div>
  )
}

export default ActionsView
