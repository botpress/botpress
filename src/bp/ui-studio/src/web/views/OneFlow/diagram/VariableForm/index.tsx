import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { Condition, FormData, PromptNode } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  deleteVariable: () => void
  variables: any[]
  customKey: string
  contentLang: string
  close: () => void
  onUpdate: (data: any) => void
  formData: PromptNode
}

const VariableForm: FC<Props> = ({ customKey, variables, contentLang, close, formData, onUpdate, deleteVariable }) => {
  const variableType = useRef(formData?.type)
  const [isConfirming, setIsConfirming] = useState(false)
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

  const options = variables.map(x => ({ label: x.id, value: x.id }))
  const selectedVariableType = variables.find(x => x.id === variableType.current)
  const selectedOption = options.find(x => x.value === variableType.current)

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={!isConfirming} close={close}>
      <Fragment key={`${variableType.current}-${customKey}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('variable')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('type')}</span>
          {!!variables.length && (
            <Dropdown
              filterable
              className={style.formSelect}
              items={options}
              defaultItem={selectedOption}
              rightIcon="chevron-down"
              onChange={option => {
                handleTypeChange(option.value)
              }}
            />
          )}
        </div>
        {selectedVariableType && (
          <Contents.Form
            currentLang={contentLang}
            axios={axios}
            fields={selectedVariableType.config?.fields || []}
            advancedSettings={selectedVariableType.config?.advancedSettings || []}
            formData={formData?.params || {}}
            onUpdate={data => onUpdate({ params: { ...data }, type: variableType.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default VariableForm
