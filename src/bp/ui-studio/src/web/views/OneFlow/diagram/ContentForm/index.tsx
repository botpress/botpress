import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import { FormData } from 'common/typings'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  deleteContent: () => void
  editingContent: number
  customKey: string
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  formData: FormData
  contentTypes: any
}

const ContentForm: FC<Props> = ({
  contentTypes,
  customKey,
  editingContent,
  close,
  formData,
  onUpdate,
  deleteContent
}) => {
  const [isConfirming, setIsConfirming] = useState(false)
  const contentType = useRef(formData?.contentType || 'text')
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const contentTypesFields = contentTypes.reduce((acc, type) => ({ ...acc, [type.id]: type.schema.newJson }), {})

  useEffect(() => {
    contentType.current = formData?.contentType || 'text'
    setForceUpdate(!forceUpdate)
  }, [editingContent, customKey])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      icon: 'trash',
      label: lang.tr('module.qna.contentForm.deleteContent'),
      action: deleteContent,
      type: 'delete'
    }
  ]

  const handleContentTypeChange = value => {
    contentType.current = value
    onUpdate({ ...Contents.getEmptyFormData(value), contentType: value, id: formData?.id })
  }

  const contentFields = contentTypesFields?.[contentType.current]

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={!isConfirming} close={() => close(editingContent)}>
      <Fragment key={`${contentType.current}-${customKey || editingContent}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title="Say" />
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
              confirmChange={{
                message: lang.tr('studio.content.confirmChangeContentType'),
                acceptLabel: lang.tr('change'),
                callback: setIsConfirming
              }}
              onChange={option => {
                handleContentTypeChange(option.value)
              }}
            />
          )}
        </div>
        {!!contentFields && (
          <Contents.Form
            bp={{ axios, mediaPath: `${window.BOT_API_PATH}/media` }}
            fields={contentFields.fields}
            advancedSettings={contentFields.advancedSettings}
            formData={formData}
            contentType={contentType.current}
            onUpdate={data => onUpdate({ ...data, contentType: contentType.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default ContentForm
