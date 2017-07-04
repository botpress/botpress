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
      'bp-save-button': true,
      [style.changedButton]: this.props.changed,
      'bp-changed-button': this.props.changed
    })

    return <Button className={classNames}
        onClick={this.props.save}>
          Save
      </Button>
  }

  renderPlatformSelect(value, key) {
    return <option key={key} value={value}>
        {value}
      </option>
  }

  renderPlatformSelectors() {
    return <FormGroup>
      <FormControl 
        componentClass="select"
        value={this.props.selected}
        onChange={this.props.update}>
        {this.props.platforms.map(this.renderPlatformSelect)}
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
