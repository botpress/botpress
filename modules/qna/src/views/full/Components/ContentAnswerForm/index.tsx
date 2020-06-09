import { Tab, Tabs } from '@blueprintjs/core'
import { FormData } from 'botpress/common/typings'
import { ContentForms, Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment, useEffect, useReducer, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  bp: any
  deleteContent: () => void
  editingContent: number
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
        contentTypes: data.map(type => ({
          value: type.id,
          label: lang.tr(type.id === 'builtin_single-choice' ? 'module.builtin.types.suggestions.title' : type.title)
        })),
        contentTypesFields: data.reduce((acc, type) => ({ ...acc, [type.id]: type.schema.newJson }), {})
      }
    default:
      throw new Error(`That action type isn't supported.`)
  }
}

const ContentAnswerForm: FC<Props> = ({ editingContent, bp, close, formData, onUpdate, deleteContent }) => {
  const [state, dispatch] = useReducer(fetchReducer, {
    contentTypes: [],
    contentTypesFields: {}
  })
  const contentType = useRef(formData?.contentType || 'builtin_image')
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)
  const shownCategories = ['builtin_image', 'builtin_carousel', 'builtin_card', 'builtin_single-choice']
  const { contentTypes, contentTypesFields } = state

  useEffect(() => {
    bp.axios.get('/content/types').then(({ data }) => {
      dispatch({ type: 'fetchSuccess', data: data.filter(type => shownCategories.includes(type.id)) })
    })
  }, [])

  useEffect(() => {
    contentType.current = formData?.contentType || 'builtin_image'
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
    onUpdate({ ...ContentForms.getEmptyFormData(value), contentType: value, id: formData?.id })
  }

  const contentFields = contentTypesFields?.[contentType.current]

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose close={() => close(editingContent)}>
      <Fragment key={`${contentType.current}-${editingContent}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title="Content" />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('studio.content.contentType')}</span>
          {contentTypes.length && (
            <Dropdown
              filterable={false}
              className={style.formSelect}
              items={contentTypes}
              defaultItem={contentType.current}
              rightIcon="chevron-down"
              onChange={option => {
                handleContentTypeChange(option.value)
              }}
            />
          )}
        </div>
        {contentFields && (
          <ContentForms.Form
            fields={contentFields.fields}
            advancedSettings={contentFields.advancedSettings}
            bp={bp}
            formData={formData}
            contentType={contentType.current}
            onUpdate={data => onUpdate({ ...data, contentType: contentType.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default ContentAnswerForm
