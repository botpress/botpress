import React, { Component } from 'react'
import classnames from 'classnames'

import { Button, FormGroup, FormControl } from 'react-bootstrap'

const style = require('./style.scss')

const SaveButton = () => {
  const classNames = classnames('bp-button', style.saveButton, 'bp-save-button')

  return <Button className={classNames}>Save</Button>
}

const PlatformSelectors = () => (
  <FormGroup>
    <FormControl componentClass="select" placeholder="select">
      <option value="select">select</option>
      <option value="other">...</option>
    </FormControl>
  </FormGroup>
)

const PlatformView = () => {
  const classNames = classnames(style.platform, 'bp-umm-platform')

  return (
    <div className={classNames}>
      <PlatformSelectors />
      <SaveButton />
    </div>
  )
}

export default PlatformView
