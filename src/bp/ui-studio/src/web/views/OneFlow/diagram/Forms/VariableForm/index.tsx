import axios from 'axios'
import { FormData, FormField } from 'botpress/sdk'
import {
  Contents,
  Dropdown,
  lang,
  MainContent,
  MoreOptions,
  MoreOptionsItems,
  sharedStyle,
  Tabs
} from 'botpress/shared'
import cx from 'classnames'
import { FlowView, Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

interface Props {
  deleteVariable: () => void
  variables: Variables
  defaultLang: string
  contentLang: string
  customKey?: number
  close: () => void
  onUpdate: (data: any) => void
  formData: FormData
  currentFlow: FlowView
}

const VariableForm: FC<Props> = ({
  variables,
  defaultLang,
  contentLang,
  close,
  formData,
  onUpdate,
  deleteVariable,
  currentFlow,
  customKey
}) => {
  const getVisibility = () => {
    if (formData?.params?.isInput) {
      return 'input'
    } else if (formData?.params?.isOutput) {
      return 'output'
    } else {
      return 'private'
    }
  }

  const variableType = useRef(formData?.type)
  const variableVisibility = useRef(getVisibility())
  const [showOptions, setShowOptions] = useState(false)
  const [uniqueKey, setUniqueKey] = useState(_.uniqueId())

  useEffect(() => {
    variableType.current = formData?.type
    setUniqueKey(_.uniqueId())
  }, [customKey])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deleteVariable'),
      action: deleteVariable,
      type: 'delete'
    }
  ]

  const handleTypeChange = value => {
    variableType.current = value
    onUpdate({ type: value, params: _.pick(formData.params, ['name', 'description', 'isInput', 'isOutput']) })
  }

  const selectedVariableType = variables.primitive.find(x => x.id === variableType.current)

  const options = variables.display.map(x => ({ label: lang.tr(x.label), icon: x.icon, value: x }))
  const selectedOption = options.find(
    ({ value }) =>
      value.type === variableType.current && (!formData.params?.subType || value.subType === formData.params?.subType)
  )

  const visibilityOptions = [
    { label: lang.tr('private'), value: 'private' },
    { label: lang.tr('input'), value: 'input' },
    { label: lang.tr('output'), value: 'output' }
  ]
  const selectedVisibility = visibilityOptions.find(({ value }) => value === variableVisibility.current)

  const { advancedSettings, fields, inputType, canAddOptions } = selectedVariableType?.config ?? {}

  const advanced: FormField[] = [...(advancedSettings || [])]

  if (currentFlow.type === 'reusable') {
    advanced.push(
      {
        type: 'text',
        key: 'label',
        placeholder: 'optional',
        label: 'label'
      },
      {
        type: 'text',
        key: 'placeholder',
        placeholder: 'optional',
        label: 'placeholder'
      }
    )

    if (canAddOptions) {
      advanced.push({
        type: 'text_array',
        key: 'elements',
        label: 'Available Elements',
        group: {
          minimum: 0
        }
      })
    }
  }

  return (
    <MainContent.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose={true} close={() => close()}>
      <Fragment key={`${variableType.current}-${uniqueKey}`}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('variable') }]} />
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        {currentFlow.type === 'reusable' && (
          <div className={sharedStyle.fieldWrapper}>
            <span className={sharedStyle.formLabel}>{lang.tr('variable.variableVisibility')}</span>
            {!!variables.primitive.length && (
              <Dropdown
                filterable={false}
                className={sharedStyle.formSelect}
                items={visibilityOptions}
                defaultItem={selectedVisibility}
                placeholder={lang.tr('variable.visibilityPlaceholder')}
                rightIcon="chevron-down"
                onChange={({ value }) => {
                  const newVisibility = { isInput: false, isOutput: false }
                  variableVisibility.current = value

                  if (value === 'input') {
                    newVisibility.isInput = true
                  } else if (value === 'output') {
                    newVisibility.isOutput = true
                  }

                  onUpdate({ ...formData, params: { ...formData.params, ...newVisibility } })
                }}
              />
            )}
          </div>
        )}
        <div className={cx(sharedStyle.fieldWrapper, sharedStyle.typeField)}>
          <span className={sharedStyle.formLabel}>{lang.tr('type')}</span>
          {!!variables.primitive.length && (
            <Dropdown
              filterable={false}
              className={sharedStyle.formSelect}
              items={options}
              defaultItem={selectedOption && { label: selectedOption.label, value: selectedOption.value }}
              placeholder={lang.tr('variable.pickType')}
              rightIcon="chevron-down"
              onChange={({ value }) => {
                handleTypeChange(value.type)

                if (value.subType) {
                  onUpdate({ ...formData, params: { ...formData.params, subType: value.subType } })
                }
              }}
            />
          )}
        </div>
        {selectedVariableType && (
          <Contents.Form
            currentLang={contentLang}
            defaultLang={defaultLang}
            axios={axios}
            fields={fields}
            advancedSettings={advanced}
            formData={formData?.params || {}}
            onUpdate={data => onUpdate({ params: { ...data }, type: variableType.current })}
          />
        )}
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default VariableForm
