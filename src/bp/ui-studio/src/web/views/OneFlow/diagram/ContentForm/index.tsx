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
}

const fetchReducer = (state, action) => {
  switch (action.type) {
    case 'fetchSuccess':
      const { data } = action
      return {
        ...state,
        contentTypes: data.map(type => ({ value: type.schema.newJson.renderType, label: lang.tr(type.title) })),
        contentTypesFields: data.reduce(
          (acc, type) => ({ ...acc, [type.schema.newJson.renderType]: type.schema.newJson }),
          {}
        )
      }
    default:
      throw new Error(`That action type isn't supported.`)
  }
}

const ContentForm: FC<Props> = ({ customKey, editingContent, close, formData, onUpdate, deleteContent }) => {
  const [state, dispatch] = useReducer(fetchReducer, {
    contentTypes: [],
    contentTypesFields: {}
  })
  const contentType = useRef(formData?.contentType || 'text')
  const [isConfirming, setIsConfirming] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const { contentTypes, contentTypesFields } = state

  useEffect(() => {
    axios
      .get(`${window.BOT_API_PATH}/content/types`)
      .then(({ data }) => {
        dispatch({
          type: 'fetchSuccess',
          data: data.filter(type => type.schema.newJson?.displayedIn.includes('sayNode'))
        })
      })
      .catch(() => {})
  }, [])

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
              items={contentTypes}
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
