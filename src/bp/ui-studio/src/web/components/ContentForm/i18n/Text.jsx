import React from 'react'
import { FormControl } from 'react-bootstrap'

import I18nManager from './I18nManager'

export default class Text extends I18nManager {
  handleTextChanged = event => {
    this.handleOnChange(event.target.value)
  }

  render() {
    return this.renderWrapped(
      <div style={{ width: '100%' }}>
        <FormControl
          type="text"
          value={this.state.value}
          onChange={this.handleTextChanged}
          placeholder={this.state.placeholder || ''}
        />
      </div>
    )
  }
}
