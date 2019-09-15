import React from 'react'

import SmartInput from '~/components/SmartInput'

import I18nManager from './I18nManager'

export default class Text extends I18nManager {
  render() {
    return this.renderWrapped(
      <div style={{ width: '100%' }}>
        <strong>
          {this.props.schema.title} {this.props.required && '*'}
        </strong>
        <SmartInput
          singleLine={this.props.uiSchema.$subtype !== 'textarea'}
          value={this.props.formData}
          onChange={this.handleOnChange}
          placeholder={this.state.placeholder || ''}
        />
      </div>
    )
  }
}
