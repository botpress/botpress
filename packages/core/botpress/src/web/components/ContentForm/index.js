import React from 'react'
import Form from 'react-jsonschema-form'
import BaseInput from 'react-jsonschema-form/lib/components/widgets/BaseInput'

import RefWidget from './RefWidget'
import UploadWidget from './UploadWidget'

const CustomBaseInput = props => {
  if (props.schema.type === 'string' && props.schema.$subtype === 'ref') {
    return <RefWidget {...props} />
  }
  if (props.schema.type === 'string' && props.schema.$subtype === 'media') {
    return <UploadWidget {...props} />
  }
  return <BaseInput {...props} />
}

const widgets = {
  BaseInput: CustomBaseInput
}

const ContentForm = props => {
  const defaultFormData = props.schema.type === 'array' ? [] : {}

  return <Form {...props} formData={props.formData || defaultFormData} safeRenderCompletion={true} widgets={widgets} />
}

export default ContentForm
