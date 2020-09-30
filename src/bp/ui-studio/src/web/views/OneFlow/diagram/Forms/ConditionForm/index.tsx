import { Button, Tooltip } from '@blueprintjs/core'
import axios from 'axios'
import { BotEvent, Condition, FlowVariable, FormData } from 'botpress/sdk'
import {
  Contents,
  Dropdown,
  Icons,
  lang,
  MainContent,
  MoreOptions,
  MoreOptionsItems,
  sharedStyle,
  Tabs
} from 'botpress/shared'
import cx from 'classnames'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'
import storage from '~/util/storage'

interface Props {
  deleteCondition: () => void
  conditions: Condition[]
  editingCondition: number
  topicName?: string
  customKey: string
  contentLang: string
  defaultLang: string
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  onUpdateVariables: (variable: FlowVariable) => void
  formData: { id: string; params: FormData }
  variables: Variables
  events: BotEvent[]
}

interface ConditionUsage {
  [id: string]: number
}

const CONDITIONS_USAGE_KEY = 'bp::conditionUsage'

const getConditionUsage = (): ConditionUsage => {
  try {
    return JSON.parse(storage.get(CONDITIONS_USAGE_KEY) || '{}')
  } catch (err) {
    return {}
  }
}

const ConditionForm: FC<Props> = ({
  customKey,
  conditions,
  defaultLang,
  contentLang,
  editingCondition,
  close,
  formData,
  topicName,
  onUpdate,
  deleteCondition,
  onUpdateVariables,
  variables,
  events
}) => {
  const [maximized, setMaximized] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const condition = useRef(formData?.id)
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const [conditionUsage, setConditionUsage] = useState<ConditionUsage>(getConditionUsage())

  useEffect(() => {
    return () => document.documentElement.style.setProperty('--right-sidebar-width', '240px')
  }, [])

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
    if (!['user_intent_is', 'raw_js'].includes(value)) {
      document.documentElement.style.setProperty('--right-sidebar-width', '240px')
    }
    condition.current = value
    onUpdate({
      id: value
    })

    try {
      const newConditions = { ...conditionUsage, [value]: (conditionUsage[value] ?? 0) + 1 }
      setConditionUsage(newConditions)
      storage.set(CONDITIONS_USAGE_KEY, JSON.stringify(newConditions))
    } catch (err) {}
  }

  const optionsVariablePlaceholder = {
    firstSentence: '',
    channelName: `[${lang.tr('channel').toLowerCase()}]`,
    language: `[${lang.tr('language').toLowerCase()}]`,
    topicName: `[${lang.tr('topic').toLowerCase()}]`
  }

  const options = conditions
    .filter(x => !x.hidden || (x.hidden && x.id === condition.current))
    .map(type => ({
      value: type.id,
      label: lang.tr(type.label, optionsVariablePlaceholder)
    }))

  const selectedCondition = conditions.find(cond => cond.id === condition.current)
  const selectedOption = options.find(cond => cond.value === condition.current)

  const getCustomPlaceholder = (field, index) => {
    if (field === 'utterances') {
      switch (index) {
        case 0:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.empty')
        case 1:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.one')
        case 2:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.two')
        case 3:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.morePlural', { count: 6 })
        case 4:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.morePlural', { count: 5 })
        case 5:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.morePlural', { count: 4 })
        case 6:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.morePlural', { count: 3 })
        case 7:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.morePlural', { count: 2 })
        case 8:
          return lang.tr('module.nlu.conditions.fields.placeholder.intents.moreSingular')
      }
    }

    return ''
  }

  const toggleSize = () => {
    document.documentElement.style.setProperty('--right-sidebar-width', maximized ? '240px' : '580px')
    setMaximized(!maximized)
  }

  return (
    <MainContent.RightSidebar
      className={sharedStyle.wrapper}
      canOutsideClickClose={!isConfirming}
      close={() => close(editingCondition)}
    >
      <Fragment key={`${condition.current}-${contentLang}-${customKey || editingCondition}`}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('studio.flow.nodeType.trigger') }]} />
          <div>
            <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
            {['user_intent_is', 'raw_js'].includes(selectedOption?.value) && (
              <Tooltip content={lang.tr(maximized ? 'minimizeInspector' : 'maximizeInspector')}>
                <Button
                  className={sharedStyle.expandBtn}
                  small
                  minimal
                  icon={maximized ? <Icons.Minimize /> : 'fullscreen'}
                  onClick={toggleSize}
                />
              </Tooltip>
            )}
          </div>
        </div>
        <div
          className={cx(sharedStyle.fieldWrapper, sharedStyle.typeField, {
            [sharedStyle.noBorder]:
              !selectedCondition || (!selectedCondition.fields?.length && !selectedCondition.advancedSettings?.length)
          })}
        >
          <span className={sharedStyle.formLabel}>{lang.tr('studio.condition.label')}</span>
          {!!conditions.length && (
            <Dropdown
              filterable
              className={sharedStyle.formSelect}
              placeholder={lang.tr('studio.condition.pickCondition')}
              items={_.orderBy(options, 'label')}
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
            defaultLang={defaultLang}
            getCustomPlaceholder={getCustomPlaceholder}
            variables={variables}
            events={events}
            fields={selectedCondition.fields}
            advancedSettings={selectedCondition.advancedSettings}
            formData={formData.params}
            onUpdate={data => onUpdate({ params: { ...data }, id: condition.current })}
            onUpdateVariables={onUpdateVariables}
          />
        )}
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default ConditionForm
