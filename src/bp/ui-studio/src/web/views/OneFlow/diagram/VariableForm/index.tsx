import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { FormData } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import { FlowView, Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  deleteVariable: () => void
  variables: Variables
  customKey: string
  defaultLang: string
  contentLang: string
  close: () => void
  onUpdate: (data: any) => void
  formData: FormData
  currentFlow: FlowView
}

const VariableForm: FC<Props> = ({
  customKey,
  variables,
  defaultLang,
  contentLang,
  close,
  formData,
  onUpdate,
  deleteVariable,
  currentFlow
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
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    variableType.current = formData?.type
    setForceUpdate(!forceUpdate)
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

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={close}>
      <Fragment key={`${variableType.current}-${customKey}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('variable')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        {currentFlow.type === 'reusable' && (
          <div className={style.fieldWrapper}>
            <span className={style.formLabel}>{lang.tr('variable.variableVisibility')}</span>
            {!!variables.primitive.length && (
              <Dropdown
                filterable={false}
                className={style.formSelect}
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
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('type')}</span>
          {!!variables.primitive.length && (
            <Dropdown
              filterable
              className={style.formSelect}
              items={options}
              defaultItem={selectedOption}
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
            fields={selectedVariableType.config?.fields || []}
            advancedSettings={selectedVariableType.config?.advancedSettings}
            formData={formData?.params || {}}
            onUpdate={data => onUpdate({ params: { ...data }, type: variableType.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default VariableForm
