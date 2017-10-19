import React, { Component } from 'react'
import classnames from 'classnames'

import {
  Button,
  FormGroup,
  FormControl
} from 'react-bootstrap'

const style = require('./style.scss')

export default class PlatformView extends Component {
  constructor(props) {
    super(props)
  }

  renderSaveButton() {
    const classNames = classnames({
      'bp-button': true,
      [style.saveButton]: true,
      'bp-save-button': true
    })

    return <Button className={classNames}>Save</Button>
  }

  renderPlatformSelectors() {
    return <FormGroup>
      <FormControl componentClass="select" placeholder="select">
        <option value="select">select</option>
        <option value="other">...</option>
      </FormControl>
    </FormGroup>
  }

  render() {
    const classNames = classnames({
      [style.platform]: true,
      'bp-umm-platform': true
    })

    return <div className={classNames}>
      {this.renderPlatformSelectors()}
      {this.renderSaveButton()}
    </div>
  }
}
