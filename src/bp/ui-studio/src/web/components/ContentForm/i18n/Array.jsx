import React from 'react'
import ArrayField from 'react-jsonschema-form/lib/components/fields/ArrayField'
import I18nManager from './I18nManager'

export default class ArrayMl extends I18nManager {
  render() {
    return this.renderWrapped(
      <ArrayField {...this.props} formData={this.props.formData} onChange={this.handleOnChange} />
    )
  }
}
