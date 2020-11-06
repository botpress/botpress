import { Button, Collapse, Icon } from '@blueprintjs/core'
import { Control, ControlForm, ControlType } from 'common/controls'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import sharedStyle from '../../../ui-shared-lite/style.scss'
import Checkbox from '../../../ui-shared-lite/Checkbox'
import { lang } from '../translations'

import style from './style.scss'
import { FormProps } from './typings'
import { createEmptyDataFromSchema } from './utils/fields'
import { formReducer, printMoreInfo } from './utils/form.utils'
import parentStyle from './FormFields/style.scss'
import AddButton from './FormFields/AddButton'
import FieldWrapper from './FormFields/FieldWrapper'
import GroupItemWrapper from './FormFields/GroupItemWrapper'
import MultiSelect from './FormFields/MultiSelect'
import Select from './FormFields/Select'
import SharedSwitch from './FormFields/Switch'
import Text from './FormFields/Text'
import TextArea from './FormFields/TextArea'
import TextFieldsArray from './FormFields/TextFieldsArray'
import Upload from './FormFields/Upload'
import SingleControl from './SingleControl'

export type ControlWithKey = ({ key: string } & Control)[]

const focusFirstElement = parent => {
  const firstFocusableElement = parent?.querySelector(
    `input, select, textarea, [contenteditable], button:not(.${style.labelBtn}):not(.${parentStyle.groupLabel}):not(.more-options-btn)`
  ) as HTMLElement

  if (firstFocusableElement) {
    firstFocusableElement.focus()
  }
}

const printLabel = (field: Control, data, parent, currentLang?) => {
  if (field.title?.startsWith('fields::') && field.title?.length) {
    const labelField = field.fields?.find(subField => subField.key === field.title?.replace('fields::', ''))
    const fieldData = labelField.translated ? data[labelField.key]?.[currentLang] : data[labelField.key]

    return fieldData || ' '
  }

  return field.onClick ? (
    <Button className={style.labelBtn} small minimal onClick={() => field.onClick(field, parent)}>
      {lang(field.title)}
    </Button>
  ) : (
    <Fragment>
      {lang(field.title)} {printMoreInfo(field.moreInfo)}
    </Fragment>
  )
}

const getRefValue = (value, currentLang, defaultLang) => {
  if (currentLang !== defaultLang || !value[defaultLang]) {
    const refLang = Object.keys(value).find(key => key !== currentLang && value[key])

    return refLang && value[refLang]
  }

  return value[defaultLang]
}

const fieldsToList = (fields: ControlForm): ControlWithKey => {
  return Object.keys(fields).map(key => ({ key, ...fields[key] }))
}

const Form: FC<FormProps> = ({
  defaultLang,
  currentLang,
  axios,
  mediaPath,
  overrideFields,
  formData,
  fields,
  onUpdate,
  getCustomPlaceholder,
  invalidFields,
  events,
  fieldsError,
  onCodeEdit
}) => {
  const newFormData = createEmptyDataFromSchema(fieldsToList(fields), currentLang)
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

  const printError = key => {
    if (!fieldsError?.[key]) {
      return null
    }

    return <span className={sharedStyle.error}>{fieldsError[key]}</span>
  }

  const getArrayPlaceholder = (index, field) => {
    const { placeholder, customPlaceholder, key } = field
    if (customPlaceholder && getCustomPlaceholder) {
      return getCustomPlaceholder(key, index)
    }

    return index === 0 && placeholder ? lang(placeholder) : ''
  }

  const printField = (field: Control, key: string, data, parent?) => {
    let currentValue = data[key] ?? newFormData[key]
    let refValue

    if (field.translated) {
      refValue = getRefValue(currentValue || {}, currentLang, defaultLang)
      currentValue = currentValue?.[currentLang!]
    }
    const invalid = invalidFields?.find(x => x.field === key)

    const onValueChanged = (value, key: string, field: any) => {
      dispatch({
        type: 'updateField',
        data: {
          newFormData,
          field: key,
          lang: field.translated && currentLang,
          type: field.type,
          parent,
          value,
          onUpdate
        }
      })
    }

    switch (field.type) {
      case ControlType.Enum:
        return (
          <FieldWrapper key={key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            {!field.multiple ? (
              <Select
                axios={axios}
                parent={parent}
                printField={printField}
                data={data}
                field={field}
                placeholder={field.placeholder && lang(field.placeholder)}
                onChange={value => onValueChanged(value, key, field)}
              />
            ) : (
              <MultiSelect
                value={currentValue}
                options={field.options as any}
                placeholder={field.placeholder}
                onChange={value => onValueChanged(value, key, field)}
              />
            )}

            {printError(key)}
          </FieldWrapper>
        )

      case ControlType.Array:
        return (
          <FieldWrapper key={key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            <TextFieldsArray
              key={key}
              getPlaceholder={index => getArrayPlaceholder(index, field)}
              moreInfo={printMoreInfo(field.moreInfo)}
              validation={field.validation}
              onChange={value => onValueChanged(value, key, field)}
              refValue={refValue}
              items={currentValue || ['']}
              label={printLabel(field, currentValue, parent, currentLang)}
              addBtnLabel={lang(field.group?.addLabel)}
              addBtnLabelTooltip={lang(field.group?.addLabelTooltip)}
            />
          </FieldWrapper>
        )

      case ControlType.File:
        return (
          <FieldWrapper key={key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            {printMoreInfo(field.moreInfo)}
            <Upload
              axios={axios}
              customPath={mediaPath}
              placeholder={lang(field.placeholder)}
              onChange={value => onValueChanged(value, key, field)}
              value={currentValue}
            />
            {printError(key)}
          </FieldWrapper>
        )

      case ControlType.Boolean:
        return (
          <SharedSwitch
            key={key}
            checked={currentValue}
            fieldKey={key}
            label={printLabel(field, currentValue, parent, currentLang)}
            onChange={e => onValueChanged(e.currentTarget.checked, key, field)}
          >
            <Fragment>{printError(key)}</Fragment>
          </SharedSwitch>
        )

      case ControlType.Component:
        return (
          <FieldWrapper key={key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            {printMoreInfo(field.moreInfo)}
            <Fragment key={key}>
              {overrideFields?.[field.overrideKey!]?.({
                field,
                data,
                refValue,
                label: printLabel(field, currentValue, currentLang),
                onChange: value => {
                  dispatch({
                    type: 'updateOverridableField',
                    data: { newFormData, field: key, onUpdate, value }
                  })
                }
              })}
            </Fragment>
            {printError(key)}
          </FieldWrapper>
        )

      case ControlType.CodeEditor:
        return (
          <FieldWrapper key={key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            <Button
              onClick={() => onCodeEdit?.(currentValue, data => onUpdate({ [key]: data }, key), field.template)}
              text={lang('editCode')}
              fill
            />
            {printError(key)}
          </FieldWrapper>
        )

      case ControlType.Number:
      case ControlType.String:
      default:
        return (
          <FieldWrapper key={key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            {field.type === ControlType.Number || (field.type === ControlType.String && !field.multiline) ? (
              <Text
                placeholder={lang(field.placeholder)}
                onBlur={value => onValueChanged(value, key, field)}
                field={field as any}
                refValue={refValue}
                value={currentValue}
              />
            ) : (
              <TextArea
                placeholder={lang(field.placeholder)}
                field={field as any}
                onBlur={value => onValueChanged(value, key, field)}
                refValue={refValue}
                value={currentValue}
              />
            )}

            {printError(key)}
          </FieldWrapper>
        )
    }
  }

  const renderSection = (label: string | undefined, items, idx: number) => {
    if (!label) {
      return <div className={style.noSection}>{items.map(item => printField(item, item.key, state))}</div>
    }

    const [isOpen, setOpen] = useState(idx === 0 || label === 'basic')

    return (
      <div className={style.collapse}>
        <div className={style.group}>
          <div className={style.header} onClick={() => setOpen(!isOpen)}>
            {lang(label)}
            <Icon className={style.icon} icon={isOpen ? 'caret-up' : 'caret-down'} />
          </div>

          <Collapse isOpen={isOpen}>
            <div>{items.map(item => printField(item, item.key, state))}</div>
          </Collapse>
        </div>
      </div>
    )
  }

  const sections = _.uniq(Object.keys(fields).map(x => fields[x].section))

  return (
    <Fragment>
      {sections.map((section, idx: number) => {
        const items = fieldsToList(fields).filter(({ key }) => fields[key].section === section)

        return (
          <div key={section} ref={fieldWrapperRef}>
            {renderSection(section, items, idx)}
          </div>
        )
      })}
    </Fragment>
  )
}

export default { Form, createEmptyDataFromSchema, SingleControl }
