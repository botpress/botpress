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

  updateMultiLangProp = (field, value) => {
    this.setState({ [field]: value })
  }

  handleOnChange = event => {
    this.props.onChange({
      ...event,
      formData: {
        ...event.formData,
        ...this.state
      }
    })
  }

  render() {
    const defaultFormData = this.props.schema.type === 'array' ? [] : {}

    const context = {
      ...this.props.formData,
      updateProp: this.updateMultiLangProp,
      languages: this.props.languages,
      activeLang: this.props.contentLang,
      defaultLang: this.props.defaultLanguage
    }

    return (
      <Form
        {...this.props}
        formData={this.props.formData || defaultFormData}
        formContext={context}
        safeRenderCompletion={true}
        widgets={widgets}
        fields={fields}
        onChange={this.handleOnChange}
        changeContentLanguage={this.props.changeContentLanguage}
      />
    )
  }
}

export default withLanguage(ContentForm)
