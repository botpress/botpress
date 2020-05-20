import _ from 'lodash'
import React, { FC, Fragment, useReducer } from 'react'

import { contentTypesFields, getEmptyFormData } from '../../utils/fields'
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

interface State {}

const formReducer = (state: State, action): State => {
  if (action.type === 'add') {
    const { field, parent } = action.data
    const newData = getEmptyFormData(field, true)
    if (parent) {
      const { key, index } = parent
      const updatedItem = state[key]

      updatedItem[index][field] = [...updatedItem[index][field], newData]

      return {
        ...state,
        [key]: updatedItem
      }
    }

    return {
      ...state,
      [field]: [...state[field], newData]
    }
  } else if (action.type === 'deleteGroupItem') {
    const { deleteIndex, field, parent } = action.data
    if (parent) {
      const { key, index } = parent
      const updatedItem = state[key]

      updatedItem[index][field] = [...updatedItem[index][field].filter((item, index) => index !== deleteIndex)]

      return {
        ...state,
        [key]: updatedItem
      }
    }

    return {
      ...state,
      [field]: [...state[field].filter((item, index) => index !== deleteIndex)]
    }
  } else if (action.type === 'updateField') {
    const { value, field, parent, onUpdate } = action.data
    if (parent) {
      const { key, index } = parent
      const getArray = [key, index, field]

      if (parent.parent) {
        // Needs recursion if we end up having more than one level of groups
        getArray.unshift(parent.parent.key, parent.parent.index)
      }

      _.set(state, getArray, value)

      onUpdate(state)
      return {
        ...state
      }
    }

    const newState = {
      ...state,
      [field]: value
    }

    onUpdate(newState)
    return { ...newState }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const Form: FC<FormProps> = ({ formData, contentType, onUpdate }) => {
  const [state, dispatch] = useReducer(formReducer, _.cloneDeep(formData))

  const printField = (field, data, parent?) => {
    switch (field.type) {
      case 'group':
        return (
          <Fragment key={field.key}>
            {data[field.key]?.map((fieldData, index) => (
              <GroupItemWrapper
                key={`${field.key}${index}`}
                contextMenu={(!field.minimum || data[field.key]?.length > field.minimum) && field.contextMenu}
                onDelete={() =>
                  dispatch({ type: 'deleteGroupItem', data: { deleteIndex: index, field: field.key, parent } })
                }
                label={printLabel(field)}
              >
                {field.fields.map(groupField => printField(groupField, fieldData, { key: field.key, index, parent }))}
              </GroupItemWrapper>
            ))}
            <AddButton
              text={field.addLabel}
              onClick={() => dispatch({ type: 'add', data: { field: field.key, parent } })}
            />
          </Fragment>
        )
      case 'select':
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <Select
              options={field.options}
              value={data[field.key] || field.defaultValue || field.options[0]?.value}
              placeholder={field.placeholder}
              onChange={value => dispatch({ type: 'updateField', data: { field: field.key, onUpdate, parent, value } })}
            />
          </FieldWrapper>
        )
      case 'textarea':
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <TextArea
              placeholder={field.placeholder}
              onChange={value => dispatch({ type: 'updateField', data: { field: field.key, onUpdate, parent, value } })}
              value={data[field.key]}
            />
          </FieldWrapper>
        )
      case 'upload':
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <Upload
              placeholder={field.placeholder}
              onChange={value => dispatch({ type: 'updateField', data: { field: field.key, onUpdate, parent, value } })}
              value={data[field.key]}
            />
          </FieldWrapper>
        )
      default:
        return (
          <FieldWrapper key={field.key} label={printLabel(field)}>
            <Text
              placeholder={field.placeholder}
              onChange={value => dispatch({ type: 'updateField', data: { field: field.key, onUpdate, parent, value } })}
              type={field.type}
              value={data[field.key]}
            />
          </FieldWrapper>
        )
    }
  }

  return contentTypesFields[contentType].fields.map(field => printField(field, state))
}

export default Form
