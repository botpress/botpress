import { Checkbox } from '@blueprintjs/core'
import { FormMoreInfo } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer } from 'react'

import { lang } from '../../../translations'
import TextFieldsArray from '../../../FormFields/TextFieldsArray'
import { createEmptyDataFromSchema } from '../../utils/fields'
import AddButton from '../Fields/AddButton'
import Select from '../Fields/Select'
import Text from '../Fields/Text'
import TextArea from '../Fields/TextArea'
import Upload from '../Fields/Upload'
import FieldWrapper from '../FieldWrapper'
import GroupItemWrapper from '../GroupItemWrapper'

import style from './style.scss'
import { FormProps } from './typings'

const printLabel = (field, data) => {
  if (field.label?.startsWith('fields::') && field.fields?.length) {
    const labelField = field.fields?.find(subField => subField.key === field.label.replace('fields::', ''))

    return data[labelField.key] || lang(labelField.label)
  }

  return lang(field.label)
}

const printMoreInfo = (moreInfo: FormMoreInfo, isCheckbox = false): JSX.Element => {
  const { url, label } = moreInfo
  if (url) {
    return (
      <a className={cx(style.moreInfo, { [style.isCheckbox]: isCheckbox })} href={url} target="_blank">
        {lang(label)}
      </a>
    )
  }

  return <p className={cx(style.moreInfo, { [style.isCheckbox]: isCheckbox })}>{lang(label)}</p>
}

const formReducer = (state, action) => {
  if (action.type === 'add') {
    const { field, renderType, parent, getEmptyData } = action.data
    const newData = getEmptyData?.(renderType, true)

    if (parent) {
      const { key, index } = parent
      const updatedItem = state[key]

      updatedItem[index][field] = [...(updatedItem[index][field] || []), newData]

      return {
        ...state,
        [key]: updatedItem
      }
    }

    return {
      ...state,
      [field]: [...(state[field] || []), newData]
    }
  } else if (action.type === 'deleteGroupItem') {
    const { deleteIndex, field, onUpdate, parent } = action.data

    if (parent) {
      const { key, index } = parent
      const updatedItem = state[key]

      updatedItem[index][field] = [...updatedItem[index][field].filter((item, index) => index !== deleteIndex)]

      return {
        ...state,
        [key]: updatedItem
      }
    }

    const newState = {
      ...state,
      [field]: [...state[field].filter((item, index) => index !== deleteIndex)]
    }
    onUpdate?.(newState)
    return newState
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

      onUpdate?.(state)
      return {
        ...state
      }
    }

    const newState = {
      ...state,
      [field]: value
    }

    onUpdate?.(newState)
    return { ...newState }
  } else if (action.type === 'updateOverridableField') {
    const { value, field, parent, onUpdate } = action.data
    if (parent) {
      const { index } = parent
      const getArray = [index, field]

      if (parent.parent) {
        // Needs recursion if we end up having more than one level of groups
        getArray.unshift(parent.parent.key, parent.parent.index)
      }

      _.set(state, getArray, value)

      onUpdate?.(state)
      return {
        ...state
      }
    }

    const newState = {
      ...state,
      ...value
    }

    onUpdate?.(newState)
    return { ...newState }
  } else if (action.type === 'setData') {
    return {
      ...state,
      ...action.data
    }
  } else {
    throw new Error(`That action type isn't supported.`)
  }
}

const Form: FC<FormProps> = ({
  axios,
  mediaPath,
  overrideFields,
  getEmptyData,
  formData,
  fields,
  advancedSettings,
  onUpdate
}) => {
  const newFormData = getEmptyData
    ? getEmptyData()
    : createEmptyDataFromSchema([...fields, ...(advancedSettings || [])])
  const [state, dispatch] = useReducer(formReducer, newFormData)

  useEffect(() => {
    dispatch({ type: 'setData', data: formData })
  }, [])

  const getArrayPlaceholder = (index, placeholder) => {
    if (Array.isArray(placeholder)) {
      if (index < placeholder.length) {
        return lang(placeholder[index], { count: index })
      } else {
        return ''
      }
    }

    return index === 0 && placeholder ? lang(placeholder) : ''
  }

  const printField = (field, data, parent?) => {
    switch (field.type) {
      case 'group':
        return (
          <Fragment key={field.key}>
            {data[field.key]?.map((fieldData, index) => (
              <GroupItemWrapper
                key={`${field.key}${index}`}
                contextMenu={
                  (!field.group?.minimum || data[field.key]?.length > field.group?.minimum) && field.group?.contextMenu
                }
                onDelete={() =>
                  dispatch({
                    type: 'deleteGroupItem',
                    data: { deleteIndex: index, onUpdate, field: field.key, parent }
                  })
                }
                label={printLabel(field, fieldData)}
              >
                {field.fields.map(groupField => printField(groupField, fieldData, { key: field.key, index, parent }))}
              </GroupItemWrapper>
            ))}
            <AddButton
              text={lang(field.group?.addLabel)}
              onClick={() =>
                dispatch({
                  type: 'add',
                  data: { field: field.key, renderType: field.renderType, parent, getEmptyData }
                })
              }
            />
          </Fragment>
        )
      case 'select':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, data[field.key])}>
            {field.moreInfo && printMoreInfo(field.moreInfo)}
            <Select
              axios={axios}
              parent={parent}
              printField={printField}
              data={data}
              field={field}
              placeholder={lang(field.placeholder)}
              onChange={value => dispatch({ type: 'updateField', data: { field: field.key, onUpdate, parent, value } })}
            />
          </FieldWrapper>
        )
      case 'text_array':
        return (
          <Fragment key={field.key}>
            <TextFieldsArray
              getPlaceholder={index => getArrayPlaceholder(index, field.placeholder)}
              moreInfo={field.moreInfo && printMoreInfo(field.moreInfo)}
              onChange={value => {
                dispatch({ type: 'updateField', data: { field: field.key, parent, value, onUpdate } })
              }}
              items={data[field.key] || ['']}
              label={printLabel(field, data[field.key])}
              addBtnLabel={lang(field.group?.addLabel)}
            />
          </Fragment>
        )
      case 'textarea':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, data[field.key])}>
            {field.moreInfo && printMoreInfo(field.moreInfo)}
            <TextArea
              placeholder={lang(field.placeholder)}
              onBlur={value => {
                dispatch({ type: 'updateField', data: { field: field.key, parent, value, onUpdate } })
              }}
              value={data[field.key]}
            />
          </FieldWrapper>
        )
      case 'upload':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, data[field.key])}>
            {field.moreInfo && printMoreInfo(field.moreInfo)}
            <Upload
              axios={axios}
              customPath={mediaPath}
              placeholder={lang(field.placeholder)}
              onChange={value => dispatch({ type: 'updateField', data: { field: field.key, onUpdate, parent, value } })}
              value={data[field.key]}
            />
          </FieldWrapper>
        )
      case 'checkbox':
        return (
          <div key={field.key} className={style.checkboxWrapper}>
            <Checkbox
              checked={data[field.key]}
              key={field.key}
              label={printLabel(field, data[field.key])}
              onChange={e =>
                dispatch({
                  type: 'updateField',
                  data: { field: field.key, onUpdate, value: e.currentTarget.checked }
                })
              }
            />
            {field.moreInfo && printMoreInfo(field.moreInfo, true)}
          </div>
        )
      case 'overridable':
        return (
          <Fragment key={field.key}>
            {overrideFields?.[field.overrideKey]?.({
              field,
              data,
              label: printLabel(field, data[field.key]),
              onChange: value => {
                dispatch({
                  type: 'updateOverridableField',
                  data: { field: field.key, onUpdate, value }
                })
              }
            })}
          </Fragment>
        )
      default:
        return (
          <FieldWrapper key={field.key} label={printLabel(field, data[field.key])}>
            {field.moreInfo && printMoreInfo(field.moreInfo)}
            <Text
              placeholder={lang(field.placeholder)}
              onBlur={value => {
                dispatch({ type: 'updateField', data: { field: field.key, parent, value, onUpdate } })
              }}
              type={field.type}
              value={data[field.key]}
            />
          </FieldWrapper>
        )
    }
  }

  return (
    <Fragment>
      {fields.map(field => printField(field, state))}
      {!!advancedSettings?.length && (
        <GroupItemWrapper defaultCollapsed label={lang('advancedSettings')}>
          {advancedSettings.map(field => printField(field, state))}
        </GroupItemWrapper>
      )}
    </Fragment>
  )
}

export default Form
