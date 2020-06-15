import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { ContentForms, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import { FormData } from 'common/typings'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  deleteContent: () => void
  editingContent: number
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  formData: FormData
  contentTypes: any
}

const ContentForm: FC<Props> = ({ contentTypes, editingContent, close, formData, onUpdate, deleteContent }) => {
  const contentType = useRef(formData?.contentType || 'builtin_text')
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const contentTypesFields = contentTypes.reduce((acc, type) => ({ ...acc, [type.id]: type.schema.newJson }), {})

  useEffect(() => {
    contentType.current = formData?.contentType || 'builtin_text'
    setForceUpdate(!forceUpdate)
  }, [editingContent])

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
    setForceUpdate(!forceUpdate)
    onUpdate({ ...ContentForms.getEmptyFormData(value), contentType: value, id: formData?.id })
  }

  const contentFields = contentTypesFields?.[contentType.current]

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose close={() => close(editingContent)}>
      <Fragment key={`${contentType.current}-${editingContent}`}>
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
              onChange={option => {
                handleContentTypeChange(option.value)
              }}
            />
          )}
        </div>
        {!!contentFields && (
          <ContentForms.Form
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
