import { Checkbox } from '@blueprintjs/core'
import React, { FC, Fragment, useReducer } from 'react'

import { lang } from '../../../translations'
import TextFieldsArray from '../../../FormFields/TextFieldsArray'
import { createEmptyDataFromSchema } from '../../utils/fields'
import { formReducer, printLabel, printMoreInfo } from '../../utils/form.utils'
import AddButton from '../Fields/AddButton'
import Select from '../Fields/Select'
import Text from '../Fields/Text'
import TextArea from '../Fields/TextArea'
import Upload from '../Fields/Upload'
import FieldWrapper from '../FieldWrapper'
import GroupItemWrapper from '../GroupItemWrapper'

import style from './style.scss'
import { FormProps } from './typings'

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
                    field,
                    parent,
                    currentLang,
                    onUpdate
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
                  data: {
                    newFormData,
                    field: field.key,
                    lang: field.translated && currentLang,
                    parent,
                    value,
                    onUpdate
                  }
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
                  data: {
                    newFormData,
                    field: field.key,
                    lang: field.translated && currentLang,
                    parent,
                    value,
                    onUpdate
                  }
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
                  data: {
                    newFormData,
                    field: field.key,
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
                  data: {
                    newFormData,
                    field: field.key,
                    lang: field.translated && currentLang,
                    parent,
                    value,
                    onUpdate
                  }
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
                    newFormData,
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
                  data: { newFormData, field: field.key, onUpdate, value }
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
                    newFormData,
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
