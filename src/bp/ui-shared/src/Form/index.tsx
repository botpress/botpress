import { Button } from '@blueprintjs/core'
import React, { FC, Fragment, useEffect, useReducer, useRef } from 'react'

import Checkbox from '../../../ui-shared-lite/Checkbox'
import sharedStyle from '../../../ui-shared-lite/style.scss'
import { lang } from '../translations'

import AddButton from './FormFields/AddButton'
import FieldWrapper from './FormFields/FieldWrapper'
import GroupItemWrapper from './FormFields/GroupItemWrapper'
import MultiSelect from './FormFields/MultiSelect'
import Select from './FormFields/Select'
import parentStyle from './FormFields/style.scss'
import Text from './FormFields/Text'
import TextArea from './FormFields/TextArea'
import TextFieldsArray from './FormFields/TextFieldsArray'
import Upload from './FormFields/Upload'
import style from './style.scss'
import { FormProps } from './typings'
import { createEmptyDataFromSchema } from './utils/fields'
import { formReducer, printMoreInfo } from './utils/form.utils'

const Form: FC<FormProps> = ({
  defaultLang,
  currentLang,
  axios,
  mediaPath,
  overrideFields,
  formData,
  fields,
  advancedSettings,
  onUpdate,
  getCustomPlaceholder,
  invalidFields,
  events,
  fieldsError
}) => {
  const newFormData = createEmptyDataFromSchema([...(fields || []), ...(advancedSettings || [])], currentLang)
  const [state, dispatch] = useReducer(formReducer, formData || newFormData)
  const fieldWrapperRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<{ [key: string]: HTMLDivElement }>({})
  const isFirst = useRef(true)
  const moveFocusTo = useRef<string>()

  useEffect(() => {
    if (isFirst.current) {
      focusFirstElement(fieldWrapperRef.current)
      isFirst.current = false
    }
  }, [fieldWrapperRef.current])

  useEffect(() => {
    if (moveFocusTo.current) {
      const nodeWrappers = groupRef.current[moveFocusTo.current].querySelectorAll(
        `:scope > .${sharedStyle.fieldWrapper}`
      )

      focusFirstElement(nodeWrappers[nodeWrappers.length - 1])
      moveFocusTo.current = undefined
    }
  }, [formData])

  const focusFirstElement = parent => {
    const firstFocusableElement = parent?.querySelector(
      `input, select, textarea, [contenteditable], button:not(.${style.labelBtn}):not(.${parentStyle.groupLabel}):not(.more-options-btn)`
    ) as HTMLElement

    if (firstFocusableElement) {
      firstFocusableElement.focus()
    }
  }

  const printError = key => {
    if (!fieldsError?.[key]) {
      return null
    }

    return <span className={sharedStyle.error}>{fieldsError[key]}</span>
  }

  const printLabel = (field, data, parent, currentLang?) => {
    if (field.label?.startsWith('fields::') && field.fields?.length) {
      const labelField = field.fields?.find(subField => subField.key === field.label.replace('fields::', ''))
      const fieldData = labelField.translated ? data[labelField.key]?.[currentLang] : data[labelField.key]

      return fieldData || ' '
    }

    return field.onClick ? (
      <Button className={style.labelBtn} small minimal onClick={() => field.onClick(field, parent)}>
        {lang(field.label)}
      </Button>
    ) : (
      lang(field.label)
    )
  }

  const getArrayPlaceholder = (index, field) => {
    const { placeholder, customPlaceholder, key } = field
    if (customPlaceholder && getCustomPlaceholder) {
      return getCustomPlaceholder(key, index)
    }

    return index === 0 && placeholder ? lang(placeholder) : ''
  }

  const getRefValue = (value, currentLang, defaultLang) => {
    if (currentLang !== defaultLang || !value[defaultLang]) {
      const refLang = Object.keys(value).find(key => key !== currentLang && value[key])

      return refLang && value[refLang]
    }

    return value[defaultLang]
  }

  const printField = (field, data, parent?) => {
    let currentValue = data[field.key] ?? newFormData[field.key]
    let refValue

    if (field.translated) {
      refValue = getRefValue(currentValue || {}, currentLang, defaultLang)
      currentValue = currentValue?.[currentLang!]
    }
    const invalid = invalidFields?.find(x => x.field === field.key)

    switch (field.type) {
      case 'hidden':
        return null
      case 'group':
        return (
          <Fragment key={field.key}>
            <div
              className={style.formGroup}
              ref={ref => {
                groupRef.current[field.key] = ref!
              }}
            >
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
                  label={printLabel(field, fieldData, parent, currentLang)}
                >
                  {field.fields?.map(groupField =>
                    printField(groupField, fieldData, { key: field.key, index, parent })
                  )}
                </GroupItemWrapper>
              ))}
            </div>
            {(!defaultLang || defaultLang === currentLang) && (
              <AddButton
                text={lang(field.group?.addLabel)}
                onClick={() => {
                  moveFocusTo.current = field.key
                  dispatch({
                    type: 'add',
                    data: {
                      field,
                      parent,
                      currentLang,
                      onUpdate
                    }
                  })
                }}
              />
            )}
          </Fragment>
        )
      case 'select':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
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
            {printMoreInfo(field.moreInfo)}
            {printError(field.key)}
          </FieldWrapper>
        )
      case 'multi-select':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            <MultiSelect
              value={currentValue}
              options={field.options}
              placeholder={field.placeholder}
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
            {printMoreInfo(field.moreInfo)}
            {printError(field.key)}
          </FieldWrapper>
        )
      case 'text_array':
        return (
          <TextFieldsArray
            key={field.key}
            getPlaceholder={index => getArrayPlaceholder(index, field)}
            moreInfo={printMoreInfo(field.moreInfo)}
            validation={field.validation}
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
            refValue={refValue}
            items={currentValue || ['']}
            label={printLabel(field, currentValue, parent, currentLang)}
            addBtnLabel={lang(field.group?.addLabel)}
            addBtnLabelTooltip={lang(field.group?.addLabelTooltip)}
          />
        )

      case 'textarea':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            <TextArea
              placeholder={lang(field.placeholder)}
              field={field}
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
              refValue={refValue}
              value={currentValue}
            />
            {printMoreInfo(field.moreInfo)}
            {printError(field.key)}
          </FieldWrapper>
        )
      case 'upload':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            {printMoreInfo(field.moreInfo)}
            <Upload
              axios={axios}
              customPath={mediaPath}
              placeholder={lang(field.placeholder)}
              type="image"
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
            {printError(field.key)}
          </FieldWrapper>
        )
      case 'checkbox':
        return (
          <Checkbox
            key={field.key}
            checked={currentValue}
            fieldKey={field.key}
            label={printLabel(field, currentValue, parent, currentLang)}
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
          >
            <Fragment>
              {field.moreInfo && printMoreInfo(field.moreInfo, true)}
              {printError(field.key)}
            </Fragment>
          </Checkbox>
        )
      case 'overridable':
        return (
          <Fragment key={field.key}>
            {overrideFields?.[field.overrideKey]?.({
              field,
              data,
              refValue,
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
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            <Text
              placeholder={lang(field.placeholder)}
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
              field={field}
              refValue={refValue}
              value={currentValue}
            />
            {printMoreInfo(field.moreInfo)}
            {printError(field.key)}
          </FieldWrapper>
        )
    }
  }

  return (
    <Fragment>
      <div ref={fieldWrapperRef}>{fields?.map(field => printField(field, state))}</div>
      {!!advancedSettings?.length && (
        <GroupItemWrapper defaultCollapsed borderTop={!!fields.length} label={lang('advancedSettings')}>
          {advancedSettings.map(field => printField(field, state))}
        </GroupItemWrapper>
      )}
    </Fragment>
  )
}

export default Form

export { Form, createEmptyDataFromSchema }
