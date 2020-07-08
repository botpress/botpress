import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { Condition, FormData } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'
import IntentEditor from './IntentEditor'

interface Props {
  deleteCondition: () => void
  conditions: Condition[]
  editingCondition: number
  topicName?: string
  customKey: string
  contentLang: string
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  formData: { id: string; params: FormData }
}

const ConditionForm: FC<Props> = ({
  customKey,
  conditions,
  contentLang,
  editingCondition,
  close,
  formData,
  topicName,
  onUpdate,
  deleteCondition
}) => {
  const [isConfirming, setIsConfirming] = useState(false)
  const condition = useRef(formData?.id)
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    condition.current = formData?.id
    setForceUpdate(!forceUpdate)
  }, [editingCondition, customKey])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deleteCondition'),
      action: deleteCondition,
      type: 'delete'
    }
  ]

  const handleConditionChange = value => {
    condition.current = value
    onUpdate({
      id: value
    })
  }

  const optionsVariablePlaceholder = {
    intentName: `[${lang.tr('intent').toLowerCase()}]`,
    channelName: `[${lang.tr('channel').toLowerCase()}]`,
    language: `[${lang.tr('language').toLowerCase()}]`,
    topicName: `[${lang.tr('topic').toLowerCase()}]`
  }

  const options = conditions.map(type => ({ value: type.id, label: lang.tr(type.label, optionsVariablePlaceholder) }))
  const selectedCondition = conditions.find(cond => cond.id === condition.current)
  const selectedOption = options.find(cond => cond.value === condition.current)

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={!isConfirming} close={() => close(editingCondition)}>
      <Fragment key={`${condition.current}-${customKey || editingCondition}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.trigger')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('studio.condition.label')}</span>
          {!!conditions.length && (
            <Dropdown
              filterable
              className={style.formSelect}
              placeholder={lang.tr('studio.condition.pickCondition')}
              items={options}
              defaultItem={selectedOption}
              rightIcon="chevron-down"
              onChange={option => {
                handleConditionChange(option.value)
              }}
            />
          )}
        </div>
        {selectedCondition && (
          <Contents.Form
            axios={axios}
            currentLang={contentLang}
            overrideFields={{
              intent: props => (
                <IntentEditor
                  contentLang={contentLang}
                  topicName={topicName}
                  setKeepSidebarOpen={setIsConfirming}
                  {...props}
                />
              )
            }}
            fields={selectedCondition.fields || []}
            advancedSettings={selectedCondition.advancedSettings || []}
            formData={formData.params}
            onUpdate={data => onUpdate({ params: { ...data }, id: condition.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default ConditionForm
