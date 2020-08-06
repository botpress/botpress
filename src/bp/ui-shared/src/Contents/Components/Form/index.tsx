import { Button, Checkbox, Position, Tooltip } from '@blueprintjs/core'
import { FormMoreInfo } from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import { lang } from '../../../translations'
import SuperInput from '../../../FormFields/SuperInput'
import superInputStyle from '../../../FormFields/SuperInput/style.scss'
import SuperInputArray from '../../../FormFields/SuperInputArray'
import TextFieldsArray from '../../../FormFields/TextFieldsArray'
import { createEmptyDataFromSchema } from '../../utils/fields'
import { formReducer, getSuperInputsFromData, printMoreInfo } from '../../utils/form.utils'
import parentStyle from '../style.scss'
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
  onUpdate,
  onUpdateVariables,
  variables,
  superInputOptions,
  events
}) => {
  const newFormData = createEmptyDataFromSchema([...(fields || []), ...(advancedSettings || [])], currentLang)
  const [state, dispatch] = useReducer(formReducer, formData || newFormData)
  const [superInput, setSuperInput] = useState<any>(getSuperInputsFromData(formData))
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
        `:scope > .${parentStyle.fieldWrapper}`
      )

      focusFirstElement(nodeWrappers[nodeWrappers.length - 1])
      moveFocusTo.current = undefined
    }
  }, [formData])

  const focusFirstElement = parent => {
    const firstFocusableElement = parent?.querySelector(
      `input, select, textarea, [contenteditable], button:not(.${style.superInputBtn}):not(.${superInputStyle.btn}):not(.${superInputStyle.tagBtn}):not(.${parentStyle.groupLabel}):not(.more-options-btn)`
    ) as HTMLElement

    if (firstFocusableElement) {
      firstFocusableElement.focus()
    }
  }

  const printLabel = (field, data, parent, currentLang?) => {
    if (field.label?.startsWith('fields::') && field.fields?.length) {
      const labelField = field.fields?.find(subField => subField.key === field.label.replace('fields::', ''))
      const fieldData = labelField.translated ? data[labelField.key]?.[currentLang] : data[labelField.key]

      return fieldData || lang(labelField.label)
    }

    return field.superInput && !['text', 'text_array'].includes(field.type) ? (
      <Tooltip
        content={lang(
          isSuperInput(field, parent) ? 'superInput.convertToRegularInput' : 'superInput.convertToSmartInput'
        )}
        position={Position.TOP}
      >
        <Button className={style.superInputBtn} small minimal onClick={() => toggleSuperInput(field, parent)}>
          {lang(field.label)}
        </Button>
      </Tooltip>
    ) : (
      lang(field.label)
    )
  }

  const isSuperInput = (field, parent) => {
    let pathKey = field.key

    if (parent) {
      const { key, index } = parent
      pathKey = `${key}${index}${pathKey}`

      if (parent.parent) {
        // Needs recursion if we end up having more than one level of groups
        pathKey = `${parent.parent.key}${parent.parent.index}${pathKey}`
      }
    }

    return superInput[pathKey]
  }

  const toggleSuperInput = (field, parent) => {
    let pathKey = field.key

    if (parent) {
      const { key, index } = parent
      pathKey = `${key}${index}${pathKey}`

      if (parent.parent) {
        // Needs recursion if we end up having more than one level of groups
        pathKey = `${parent.parent.key}${parent.parent.index}${pathKey}`
      }
    }

    setSuperInput({ ...superInput, [pathKey]: !superInput[pathKey] })
  }

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

  const showSuperInput = (field, parent) => {
    return (
      !superInputOptions?.enabled &&
      field.superInput &&
      (['text', 'text_array'].includes(field.type) || isSuperInput(field, parent))
    )
  }

  const getVariableType = type => {
    // Can add more if needed, but for now types text, text_array and select will just show all the variables
    switch (type) {
      case 'checkbox':
        return 'boolean'
      case 'number':
        return 'number'
      default:
        return undefined
    }
  }

  const renderSuperInput = (field, data, update) => {
    return (
      <SuperInput
        defaultVariableType={getVariableType(field.type)}
        variableTypes={field.variableTypes}
        placeholder={lang(field.placeholder)}
        variables={variables || []}
        events={events || []}
        canPickEvents={!superInputOptions?.variablesOnly}
        canPickVariables={!superInputOptions?.eventsOnly}
        addVariable={onUpdateVariables}
        multiple={field.type === 'text'}
        onBlur={value => {
          update(value)
        }}
        value={data}
      />
    )
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
            <div
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
          </Fragment>
        )
      case 'select':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)}>
            {printMoreInfo(field.moreInfo)}
            {showSuperInput(field, parent) ? (
              renderSuperInput(field, currentValue, value => {
                dispatch({ type: 'updateField', data: { field: field.key, onUpdate, parent, value } })
              })
            ) : (
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
            )}
          </FieldWrapper>
        )
      case 'text_array':
        return (
          <Fragment key={field.key}>
            {showSuperInput(field, parent) ? (
              <SuperInputArray
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
                variableTypes={field.variableTypes}
                canPickEvents={!superInputOptions?.variablesOnly}
                canPickVariables={!superInputOptions?.eventsOnly}
                variables={variables || []}
                events={events || []}
                onUpdateVariables={onUpdateVariables}
                items={currentValue || ['']}
                label={printLabel(field, currentValue, parent, currentLang)}
                addBtnLabel={lang(field.group?.addLabel)}
              />
            ) : (
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
                label={printLabel(field, currentValue, parent, currentLang)}
                addBtnLabel={lang(field.group?.addLabel)}
              />
            )}
          </Fragment>
        )
      case 'textarea':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)}>
            {printMoreInfo(field.moreInfo)}
            {showSuperInput(field, parent) ? (
              renderSuperInput(field, currentValue, value => {
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
              })
            ) : (
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
                value={currentValue}
              />
            )}
          </FieldWrapper>
        )
      case 'upload':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)}>
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
        return showSuperInput(field, parent) ? (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent)}>
            {printMoreInfo(field.moreInfo)}
            {renderSuperInput(field, currentValue, value => {
              dispatch({ type: 'updateField', data: { field: field.key, parent, value, onUpdate } })
            })}
          </FieldWrapper>
        ) : (
          <div key={field.key} className={cx(style.checkboxWrapper, 'checkbox-wrapper')}>
            <Checkbox
              checked={currentValue}
              key={field.key}
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
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)}>
            {printMoreInfo(field.moreInfo)}
            {showSuperInput(field, parent) ? (
              renderSuperInput(field, currentValue, value => {
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
              })
            ) : (
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
                value={currentValue}
              />
            )}
          </FieldWrapper>
        )
    }
  }

  return (
    <Fragment>
      <div ref={fieldWrapperRef}>{fields?.map(field => printField(field, state))}</div>
      {!!advancedSettings?.length && (
        <GroupItemWrapper defaultCollapsed label={lang('advancedSettings')}>
          {advancedSettings.map(field => printField(field, state))}
        </GroupItemWrapper>
      )}
    </Fragment>
  )
}

export default Form
