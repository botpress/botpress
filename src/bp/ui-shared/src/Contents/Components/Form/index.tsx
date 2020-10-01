import { Button } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import sharedStyle from '../../../../../ui-shared-lite/style.scss'
import Checkbox from '../../../../../ui-shared-lite/Checkbox'
import ToolTip from '../../../../../ui-shared-lite/ToolTip'
import { lang } from '../../../translations'
import FieldWrapper from '../../../FormFields/FieldWrapper'
import MultiSelect from '../../../FormFields/MultiSelect'
import Select from '../../../FormFields/Select'
import SuperInput from '../../../FormFields/SuperInput'
import superInputStyle from '../../../FormFields/SuperInput/style.scss'
import SuperInputArray from '../../../FormFields/SuperInputArray'
import TagInputList from '../../../FormFields/TagInputList'
import TextFieldsArray from '../../../FormFields/TextFieldsArray'
import VariablePicker from '../../../FormFields/VariablePicker'
import { createEmptyDataFromSchema } from '../../utils/fields'
import { formReducer, getSuperInputsFromData, printMoreInfo } from '../../utils/form.utils'
import parentStyle from '../style.scss'
import AddButton from '../Fields/AddButton'
import Text from '../Fields/Text'
import TextArea from '../Fields/TextArea'
import Upload from '../Fields/Upload'
import GroupItemWrapper from '../GroupItemWrapper'

import style from './style.scss'
import { FormProps } from './typings'

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
  onUpdateVariables,
  getCustomPlaceholder,
  variables,
  invalidFields,
  superInputOptions,
  events,
  fieldsError
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
        `:scope > .${sharedStyle.fieldWrapper}`
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

    return field.superInput && (!['text', 'text_array'].includes(field.type) || field.superInputOptions?.toggleable) ? (
      <ToolTip
        content={lang(
          isSuperInput(field, parent) ? 'superInput.convertToRegularInput' : 'superInput.convertToSmartInput'
        )}
      >
        <Button className={style.superInputBtn} small minimal onClick={() => toggleSuperInput(field, parent)}>
          {lang(field.label)}
        </Button>
      </ToolTip>
    ) : field.onClick ? (
      <Button className={style.superInputBtn} small minimal onClick={() => field.onClick(field, parent)}>
        {lang(field.label)}
      </Button>
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

  const getArrayPlaceholder = (index, field) => {
    const { placeholder, customPlaceholder, key } = field
    if (customPlaceholder && getCustomPlaceholder) {
      return getCustomPlaceholder(key, index)
    }

    return index === 0 && placeholder ? lang(placeholder) : ''
  }

  const showSuperInput = (field, parent) => {
    return (
      !superInputOptions?.enabled &&
      field.superInput &&
      ((['text', 'text_array'].includes(field.type) && !field.superInputOptions?.toggleable) ||
        isSuperInput(field, parent))
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

  const renderSuperInput = (field, data, update, refValue?) => {
    return (
      <SuperInput
        defaultVariableType={getVariableType(field.type)}
        variableTypes={field.variableTypes}
        placeholder={lang(field.placeholder)}
        variables={variables}
        events={events || []}
        canPickEvents={superInputOptions?.variablesOnly !== true && field.superInputOptions?.canPickEvents !== false}
        canPickVariables={superInputOptions?.eventsOnly !== true && field.superInputOptions?.canPickVariables !== false}
        addVariable={onUpdateVariables}
        multiple={field.type === 'text' && !field.superInputOptions?.simple}
        onBlur={value => {
          update(value)
        }}
        refValue={refValue}
        value={data}
      />
    )
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
        const minimum = field.group.minimum ?? 1
        return (
          <Fragment key={field.key}>
            {showSuperInput(field, parent) ? (
              <SuperInputArray
                getPlaceholder={index => getArrayPlaceholder(index, field)}
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
                canPickEvents={
                  superInputOptions?.variablesOnly !== true && field.superInputOptions?.canPickEvents !== false
                }
                canPickVariables={
                  superInputOptions?.eventsOnly !== true && field.superInputOptions?.canPickVariables !== false
                }
                variables={variables}
                events={events || []}
                onUpdateVariables={onUpdateVariables}
                refValue={refValue}
                items={currentValue || ['']}
                label={printLabel(field, currentValue, parent, currentLang)}
                addBtnLabel={lang(field.group?.addLabel)}
                addBtnLabelTooltip={lang(field.group?.addLabelTooltip)}
              />
            ) : (
              <TextFieldsArray
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
                items={currentValue?.length ? currentValue : minimum ? [''] : []}
                minimum={minimum}
                label={printLabel(field, currentValue, parent, currentLang)}
                addBtnLabel={lang(field.group?.addLabel)}
                addBtnLabelTooltip={lang(field.group?.addLabelTooltip)}
              />
            )}
          </Fragment>
        )

      case 'tag-input':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            <TagInputList
              validation={field.validation}
              placeholder={lang(field.placeholder)}
              emptyPlaceholder={lang(field.emptyPlaceholder)}
              items={currentValue || ['']}
              canAdd={!defaultLang || defaultLang === currentLang}
              addBtnLabel={lang(field.group?.addLabel)}
              addBtnLabelTooltip={lang(field.group?.addLabelTooltip)}
              refValue={refValue}
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
            />
            {printError(field.key)}
          </FieldWrapper>
        )

      case 'textarea':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            {showSuperInput(field, parent) ? (
              renderSuperInput(
                field,
                currentValue,
                value => {
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
                },
                refValue
              )
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
                refValue={refValue}
                value={currentValue}
              />
            )}
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
        return showSuperInput(field, parent) ? (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent)}>
            {renderSuperInput(field, currentValue, value => {
              dispatch({ type: 'updateField', data: { field: field.key, parent, value, onUpdate } })
            })}
            {printMoreInfo(field.moreInfo)}
            {printError(field.key)}
          </FieldWrapper>
        ) : (
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
      case 'variable':
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)}>
            <VariablePicker
              data={data}
              variables={variables!}
              variableTypes={field.variableTypes}
              defaultVariableType={field.defaultVariableType}
              variableSubType={formData?.subType}
              field={field}
              addVariable={onUpdateVariables!}
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
      default:
        return (
          <FieldWrapper key={field.key} label={printLabel(field, currentValue, parent, currentLang)} invalid={invalid}>
            {showSuperInput(field, parent) ? (
              renderSuperInput(
                field,
                currentValue,
                value => {
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
                },
                refValue
              )
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
                refValue={refValue}
                value={currentValue}
              />
            )}
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
