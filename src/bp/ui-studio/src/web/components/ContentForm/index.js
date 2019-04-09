import React from 'react'
import Form from 'react-jsonschema-form'
import BaseInput from 'react-jsonschema-form/lib/components/widgets/BaseInput'

import RefWidget from './RefWidget'
import UploadWidget from './UploadWidget'
import FlowPickWidget from './FlowPickWidget'

import TextMl from './i18n/Text'
import ArrayMl from './i18n/Array'
import withLanguage from '../Util/withLanguage'

const CustomBaseInput = props => {
  const { type, $subtype } = props.schema
  if (type === 'string') {
    if ($subtype === 'ref') {
      return <RefWidget {...props} />
    } else if ($subtype === 'media') {
      return <UploadWidget {...props} />
    } else if ($subtype === 'flow') {
      return <FlowPickWidget {...props} />
    }
  }
  return <BaseInput {...props} />
}

const widgets = {
  BaseInput: CustomBaseInput
}

const fields = { i18n_field: TextMl, i18n_array: ArrayMl }

class ContentForm extends React.Component {
  state = {}

  handleOnChange = event => {
    const newFields = {}
    Object.keys(event.formData)
      .filter(x => !x.includes('$'))
      .forEach(key => (newFields[key + '$' + this.props.contentLang] = event.formData[key]))

    this.props.onChange({
      ...event,
      formData: {
        ...this.props.formData,
        ...newFields
      }
    })
  }

  render() {
    const defaultFormData = this.props.schema.type === 'array' ? [] : {}

    let formData = this.props.formData
    if (this.props.formData) {
      const newFields = {}
      Object.keys(this.props.formData)
        .filter(x => x.includes('$' + this.props.contentLang))
        .forEach(key => (newFields[key.replace('$' + this.props.contentLang, '')] = this.props.formData[key]))

      formData = newFields
    }

    const context = {
      ...this.props.formData,
      activeLang: this.props.contentLang,
      defaultLang: this.props.defaultLanguage
    }

    return (
      <Form
        {...this.props}
        formData={formData || defaultFormData}
        formContext={context}
        safeRenderCompletion={true}
        widgets={widgets}
        fields={fields}
        onChange={this.handleOnChange}
      />
    )
  }
}

export default withLanguage(ContentForm)
