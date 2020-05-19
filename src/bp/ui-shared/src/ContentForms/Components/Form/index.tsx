import React, { FC, Fragment } from 'react'

import { contentTypesFields } from '../../utils/fields'
import AddButton from '../Fields/AddButton'
import Select from '../Fields/Select'
import Text from '../Fields/Text'
import TextArea from '../Fields/TextArea'
import Upload from '../Fields/Upload'
import FieldWrapper from '../FieldWrapper'
import GroupItemWrapper from '../GroupItemWrapper'

import { FormProps } from './typings'

const printLabel = field => {
  if (field.label.startsWith('fields::') && field.fields?.length) {
    const labelField = field.fields?.find(subField => subField.key === field.label.replace('fields::', ''))

    return labelField.value || labelField.label
  }

  return field.label
}

const Form: FC<FormProps> = ({ formData, contentType, onUpdate }) => {
  const printField = (field, data) => {
    switch (field.type) {
      case 'group':
        return (
          <Fragment key={field.key}>
            {data[field.key]?.map((fieldData, index) => (
              <GroupItemWrapper
                key={`${field.key}${index}`}
                contextMenu={(!field.minimum || data[field.key]?.length > field.minimum) && field.contextMenu}
                label={printLabel(field)}
              >
                {field.fields.map(groupField => printField(groupField, fieldData))}
              </GroupItemWrapper>
            ))}
            <AddButton text={field.addLabel} onClick={() => console.log('add')} />
          </Fragment>
        )
      case 'select':
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <Select
              options={field.options}
              value={data[field.key] || field.defaultValue || field.options[0]?.value}
              placeholder={field.placeholder}
            />
          </FieldWrapper>
        )
      case 'textarea':
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <TextArea placeholder={field.placeholder} value={data[field.key]} />
          </FieldWrapper>
        )
      case 'upload':
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <Upload placeholder={field.placeholder} value={data[field.key]} />
          </FieldWrapper>
        )
      case 'text':
      case 'url':
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <Text placeholder={field.placeholder} type={field.type} value={data[field.key]} />
          </FieldWrapper>
        )
    }
  }

  return contentTypesFields[contentType].fields.map(field => printField(field, formData))
}

export default Form
