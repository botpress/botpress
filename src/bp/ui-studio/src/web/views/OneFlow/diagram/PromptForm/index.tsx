import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { Condition, FormData, PromptNode } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  deletePrompt: () => void
  prompts: any[]
  customKey: string
  contentLang: string
  close: () => void
  onUpdate: (data: any) => void
  formData: PromptNode
}

const PromptForm: FC<Props> = ({ customKey, prompts, contentLang, close, formData, onUpdate, deletePrompt }) => {
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

  const options = prompts.map(x => ({ label: x.config.label, value: x.id }))
  const selectedPromptType = prompts.find(x => x.id === promptType.current)
  const selectedOption = options.find(x => x.value === promptType.current)

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={!isConfirming} close={close}>
      <Fragment key={`${promptType.current}-${customKey}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.prompt')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('studio.prompt.label')}</span>
          {!!prompts.length && (
            <Dropdown
              filterable
              className={style.formSelect}
              placeholder={lang.tr('studio.prompt.pickType')}
              items={options}
              defaultItem={selectedOption}
              rightIcon="chevron-down"
              onChange={option => {
                handleTypeChange(option.value)
              }}
            />
          )}
        </div>
        {selectedPromptType && (
          <Contents.Form
            currentLang={contentLang}
            axios={axios}
            fields={selectedPromptType.config?.fields || []}
            advancedSettings={selectedPromptType.config?.advancedSettings || []}
            formData={formData?.params || {}}
            onUpdate={data => onUpdate({ params: { ...data }, type: promptType.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default PromptForm
