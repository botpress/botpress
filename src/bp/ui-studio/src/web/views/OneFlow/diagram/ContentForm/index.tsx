import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { FormData } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'
import TextField from './TextField'

interface Props {
  deleteContent: () => void
  editingContent: number
  customKey: string
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  formData: FormData
  contentTypes: any
  contentLang: string
}

const ContentForm: FC<Props> = ({
  contentTypes,
  customKey,
  editingContent,
  close,
  formData,
  onUpdate,
  deleteContent,
  contentLang
}) => {
  const [isConfirming, setIsConfirming] = useState(false)
  const contentType = useRef(formData?.contentType || 'builtin_text')
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const contentTypesFields = contentTypes.reduce((acc, type) => ({ ...acc, [type.id]: type.schema.newJson }), {})

  useEffect(() => {
    contentType.current = formData?.contentType || 'builtin_text'
    setForceUpdate(!forceUpdate)
  }, [editingContent, customKey])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deleteContent'),
      action: deleteContent,
      type: 'delete'
    }
  ]

  const handleContentTypeChange = value => {
    const { fields, advancedSettings } = contentTypesFields?.[value] || {}
    const schemaFields = [...(fields || []), ...(advancedSettings || [])]
    contentType.current = value
    onUpdate({
      ...Contents.createEmptyDataFromSchema(schemaFields, contentLang),
      contentType: value,
      id: formData?.id
    })
  }

  const contentFields = contentTypesFields?.[contentType.current]
  const { fields, advancedSettings } = contentFields || {}
  const schemaFields = [...(fields || []), ...(advancedSettings || [])]

  // TODO reimplement hasChanged, doesn't work properly atm
  const hasChanged = !(
    _.isEqual(formData, { contentType: contentType.current }) ||
    _.isEqual(formData, {
      ...Contents.createEmptyDataFromSchema(schemaFields, contentLang),
      contentType: contentType.current
    }) ||
    _.isEqual(formData, {
      ...Contents.createEmptyDataFromSchema(schemaFields, contentLang),
      contentType: contentType.current,
      id: formData?.id
    })
  )

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={!isConfirming} close={() => close(editingContent)}>
      <Fragment key={`${contentType.current}-${customKey || editingContent}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.say')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('studio.content.contentType')}</span>
          {!!contentTypes.length && (
            <Dropdown
              filterable={false}
              className={style.formSelect}
              items={contentTypes.map(type => ({ value: type.id, label: lang.tr(type.title) }))}
              defaultItem={contentType.current}
              rightIcon="chevron-down"
              confirmChange={
                hasChanged && {
                  message: lang.tr('studio.content.confirmChangeContentType'),
                  acceptLabel: lang.tr('change'),
                  callback: setIsConfirming
                }
              }
              onChange={option => {
                handleContentTypeChange(option.value)
              }}
            />
          )}
        </div>
        {!!contentFields && (
          <Contents.Form
            axios={axios}
            currentLang={contentLang}
            mediaPath={`${window.BOT_API_PATH}/media`}
            overrideFields={{
              textOverride: props => <TextField currentLang={contentLang} {...props} />
            }}
            fields={contentFields.fields}
            advancedSettings={contentFields.advancedSettings}
            formData={formData}
            onUpdate={data => onUpdate({ ...data, contentType: contentType.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default ContentForm
