import { Checkbox } from '@blueprintjs/core'
import { FormMoreInfo } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useReducer } from 'react'

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

const printLabel = (field, data, currentLang?) => {
  if (field.label?.startsWith('fields::') && field.fields?.length) {
    const labelField = field.fields?.find(subField => subField.key === field.label.replace('fields::', ''))
    const fieldData = labelField.translated ? data[labelField.key]?.[currentLang] : data[labelField.key]

    return fieldData || lang(labelField.label)
  }

  return lang(field.label)
}

const printMoreInfo = (moreInfo: FormMoreInfo, isCheckbox = false): JSX.Element | undefined => {
  if (!moreInfo) {
    return
  }

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
    const { field, parent, currentLang } = action.data
    const newData = createEmptyDataFromSchema([...(field.fields || [])], currentLang)

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
    const { field, type, parent, onUpdate, lang } = action.data
    let { value } = action.data

    if (type === 'number') {
      value = Number(value)
    }

    if (parent) {
      const { key, index } = parent
      const getArray = [key, index, field]

      if (parent.parent) {
        // Needs recursion if we end up having more than one level of groups
        getArray.unshift(parent.parent.key, parent.parent.index)
      }

      if (lang) {
        value = { ..._.get(state, getArray), [lang]: value }
      }

      _.set(state, getArray, value)

      onUpdate?.(state)
      return {
        ...state
      }
    }

    if (lang) {
      value = { ...state[field], [lang]: value }
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
  currentLang,
  axios,
  mediaPath,
  overrideFields,
  formData,
  fields,
  advancedSettings,
  onUpdate
}) => {
  const newFormData = createEmptyDataFromSchema([...(fields || []), ...(advancedSettings || [])], currentLang)
  const [state, dispatch] = useReducer(formReducer, formData || newFormData)

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
    let currentValue = data[field.key] ?? newFormData[field.key]
    currentValue = field.translated ? currentValue?.[currentLang!] : currentValue

    switch (field.type) {
      case 'hidden':
        return null
      case 'group':
        return (
          <Fragment key={field.key}>
            {currentValue?.map((fieldData, index) => (
              <GroupItemWrapper
                key={`${field.key}${index}`}
                contextMenu={
                  (!field.group?.minimum || currentValue?.length > field.group?.minimum) && field.group?.contextMenu
                }
                onDelete={() =>
                  dispatch({
                    type: 'deleteGroupItem',
                    data: { deleteIndex: index, onUpdate, field: field.key, parent }
                  })
                }
                label={printLabel(field, fieldData, currentLang)}
              >
                {field.fields.map(groupField => printField(groupField, fieldData, { key: field.key, index, parent }))}
              </GroupItemWrapper>
            ))}
            <AddButton
              text={lang(field.group?.addLabel)}
              onClick={() =>
                dispatch({
                  type: 'add',
                  data: {
                    field: field.key,
                    parent,
                    currentLang
                  }
                })
              }
            />
          </Fragment>
        )
      case 'select':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, currentLang)}>
            {printMoreInfo(field.moreInfo)}
            <Select
              axios={axios}
              parent={parent}
              printField={printField}
              data={data}
              field={field}
              placeholder={lang(field.placeholder)}
              onChange={value =>
                dispatch({
                  type: 'updateField',
                  data: { field: field.key, lang: field.translated && currentLang, parent, value, onUpdate }
                })
              }
            />
          </FieldWrapper>
        )
      case 'text_array':
        return (
          <Fragment key={field.key}>
            <TextFieldsArray
              getPlaceholder={index => getArrayPlaceholder(index, field.placeholder)}
              moreInfo={printMoreInfo(field.moreInfo)}
              onChange={value => {
                dispatch({
                  type: 'updateField',
                  data: { field: field.key, lang: field.translated && currentLang, parent, value, onUpdate }
                })
              }}
              items={currentValue || ['']}
              label={printLabel(field, currentValue, currentLang)}
              addBtnLabel={lang(field.group?.addLabel)}
            />
          </Fragment>
        )
      case 'textarea':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, currentLang)}>
            {printMoreInfo(field.moreInfo)}
            <TextArea
              field={field}
              placeholder={lang(field.placeholder)}
              onBlur={value => {
                dispatch({
                  type: 'updateField',
                  data: { field: field.key, lang: field.translated && currentLang, parent, value, onUpdate }
                })
              }}
              value={currentValue}
            />
          </FieldWrapper>
        )
      case 'upload':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, currentLang)}>
            {printMoreInfo(field.moreInfo)}
            <Upload
              axios={axios}
              customPath={mediaPath}
              placeholder={lang(field.placeholder)}
              onChange={value =>
                dispatch({
                  type: 'updateField',
                  data: { field: field.key, lang: field.translated && currentLang, parent, value, onUpdate }
                })
              }
              value={currentValue}
            />
          </FieldWrapper>
        )
      case 'checkbox':
        return (
          <div key={field.key} className={style.checkboxWrapper}>
            <Checkbox
              checked={currentValue}
              key={field.key}
              label={printLabel(field, currentValue, currentLang)}
              onChange={e =>
                dispatch({
                  type: 'updateField',
                  data: {
                    field: field.key,
                    lang: field.translated && currentLang,
                    value: e.currentTarget.checked,
                    onUpdate
                  }
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
              label: printLabel(field, currentValue, currentLang),
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
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, currentLang)}>
            {printMoreInfo(field.moreInfo)}
            <Text
              placeholder={lang(field.placeholder)}
              field={field}
              onBlur={value => {
                dispatch({
                  type: 'updateField',
                  data: {
                    field: field.key,
                    type: field.type,
                    lang: field.translated && currentLang,
                    parent,
                    value,
                    onUpdate
                  }
                })
              }}
              value={currentValue}
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
