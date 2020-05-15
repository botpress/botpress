import { Tab, Tabs } from '@blueprintjs/core'
import { Dropdown, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useState } from 'react'

import style from './style.scss'

interface Props {
  deleteContent: () => void
  close: () => void
}

const ContentAnswerForm: FC<Props> = ({ close, deleteContent }) => {
  const [contentType, setContentType] = useState('image')
  const [showOptions, setShowOptions] = useState(false)
  const moreOptionsItems: MoreOptionsItems[] = [
    {
      icon: 'trash',
      label: lang.tr('module.qna.contentForm.deleteContent'),
      action: deleteContent,
      type: 'delete'
    }
  ]

  const handleContentTypeChange = value => {
    setContentType(value)
  }

  const contentTypes = [
    { value: 'image', label: 'Image' },
    { value: 'card', label: 'Card' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'suggestion', label: 'Suggestion' }
  ]

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={false} close={close}>
      <div className={style.formHeader}>
        <Tabs id="contentFormTabs">
          <Tab id="content" title="Content" />
        </Tabs>
        <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
      </div>
      <div className={cx(style.fieldWrapper, style.contentTypeField)}>
        <span className={style.formLabel}>{lang.tr('studio.content.contentType')}</span>
        {contentTypes && (
          <Dropdown
            filterable={false}
            className={style.formSelect}
            items={contentTypes}
            defaultItem={contentType}
            rightIcon="chevron-down"
            onChange={option => {
              handleContentTypeChange(option.value)
            }}
          />
        )}
      </div>

      {/*currentContentType && (
        <ContentForm
          schema={currentContentType?.schema.json}
          uiSchema={currentContentType?.schema.ui}
          formData={currentFlowNode?.content?.formData}
          customKey={currentFlowNode?.name}
          isEditing={true}
          onChange={handleEdit}
        >
          <br />
        </ContentForm>
      )*/}
    </RightSidebar>
  )
}

export default ContentAnswerForm
