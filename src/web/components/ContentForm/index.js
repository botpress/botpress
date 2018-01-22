import React from 'react'
import Form from 'react-jsonschema-form'
import BaseInput from 'react-jsonschema-form/lib/components/widgets/BaseInput'

import RefWidget from './RefWidget'

const CustomBaseInput = props => {
  if (props.schema.type === 'string' && props.schema.$subtype === 'ref') {
    return <RefWidget {...props} />
  }
  return <BaseInput {...props} />
}

const widgets = {
  BaseInput: CustomBaseInput
}

const ContentForm = props => <Form {...props} widgets={widgets} />

export default ContentForm
