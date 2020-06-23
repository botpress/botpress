import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { Condition, FormData } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'
import CodeEditor from './CodeEditor'
import IntentEditor from './IntentEditor'

interface Props {
  deleteCondition: () => void
  conditions: Condition[]
  editingCondition: number
  customKey: string
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  formData: FormData
}

const ConditionForm: FC<Props> = ({
  customKey,
  conditions,
  editingCondition,
  close,
  formData,
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

  const options = conditions.map(type => ({ value: type.id, label: lang.tr(type.label) }))
  const selectedCondition = conditions.find(cond => cond.id === condition.current)
  const selectedOption = options.find(cond => cond.value === condition.current)

  const handleEmptyData = renderType => {
    return Contents.getEmptyFormData(renderType)
  }

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
        {selectedCondition?.params && (
          <Contents.Form
            bp={{ axios }}
            overrideFields={{
              intent: props => <IntentEditor {...props} />
            }}
            fields={selectedCondition.params.fields || []}
            advancedSettings={selectedCondition.params.advancedSettings || []}
            formData={formData}
            getEmptyData={handleEmptyData}
            onUpdate={data => onUpdate({ ...data, id: condition.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default ConditionForm
