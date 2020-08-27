import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { FlowVariable, PromptNode } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import { Prompts, Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  deletePrompt: () => void
  prompts: Prompts
  variables: Variables
  customKey: string
  defaultLanguage: string
  contentLang: string
  close: () => void
  onUpdate: (data: any) => void
  formData: PromptNode
  onUpdateVariables: (variable: FlowVariable) => void
}

const PromptForm: FC<Props> = ({
  customKey,
  prompts,
  defaultLanguage,
  contentLang,
  close,
  formData,
  onUpdate,
  deletePrompt,
  onUpdateVariables,
  variables
}) => {
  const promptType = useRef(formData?.type)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    promptType.current = formData?.type
    setForceUpdate(!forceUpdate)
  }, [customKey])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deletePrompt'),
      action: deletePrompt,
      type: 'delete'
    }
  ]

  const handleTypeChange = value => {
    promptType.current = value
    onUpdate({
      type: value,
      params: {}
    })
  }

  const selectedPromptType = prompts.primitive.find(x => x.id === promptType.current)

  const options = prompts.display.map(x => ({ label: lang.tr(x.label), icon: x.icon, value: x }))
  const selectedOption = options.find(
    ({ value }) =>
      value.type === promptType.current && (!formData.params.subType || value.subType === formData.params.subType)
  )

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={!isConfirming} close={close}>
      <Fragment key={`${promptType.current}-${contentLang}-${customKey}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.prompt')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('studio.prompt.label')}</span>
          {!!prompts.primitive.length && (
            <Dropdown
              filterable
              className={style.formSelect}
              placeholder={lang.tr('studio.prompt.pickType')}
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
        {selectedPromptType && (
          <div className={cx(style.fieldWrapper, style.contentTypeField)}>
            <Contents.Form
              currentLang={contentLang}
              defaultLanguage={defaultLanguage}
              axios={axios}
              onUpdateVariables={onUpdateVariables}
              variables={variables}
              fields={selectedPromptType.config?.fields || []}
              advancedSettings={selectedPromptType.config?.advancedSettings || []}
              formData={formData?.params || {}}
              onUpdate={data => onUpdate({ params: { ...data }, type: promptType.current })}
            />
          </div>
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default PromptForm
