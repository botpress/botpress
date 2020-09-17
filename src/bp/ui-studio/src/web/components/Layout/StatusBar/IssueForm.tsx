import { AnchorButton, Button, Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import sdk from 'botpress/sdk'
import { Contents, lang, MoreOptions, MoreOptionsItems, RightSidebar, sharedStyle } from 'botpress/shared'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from './style.scss'

interface Props {
  formData: sdk.FormData
  close: () => void
  onUpdate: (data: { [key: string]: any }) => void
}

const IssueForm: FC<Props> = ({ formData, close, onUpdate }) => {
  const handleSubmit = () => {
    window.open(
      `https://github.com/botpress/botpress/issues/new?labels=bug&title=${formData.title}&body=${formData.body}`,
      '_blank',
      'noopener,noreferrer'
    )
    onUpdate({ title: '', body: '' })
    close()
  }

  return (
    <RightSidebar className={sharedStyle.wrapper} canOutsideClickClose close={close}>
      <div className={sharedStyle.formHeader}>
        <Tabs id="contentFormTabs">
          <Tab id="content" title={lang.tr('bug')} />
        </Tabs>
      </div>

      <Contents.Form
        axios={axios}
        fields={[
          {
            key: 'title',
            type: 'text',
            label: 'title',
            required: true,
            placeholder: 'issue.whatIsTheIssue'
          },
          {
            key: 'body',
            type: 'textarea',
            label: 'issue.stepsToReproduce',
            required: true
          }
        ]}
        advancedSettings={[]}
        formData={formData}
        onUpdate={onUpdate}
      />
      <button className={style.submitBtn} onClick={handleSubmit}>
        {lang.tr('issue.previewOnGithub')}
      </button>
    </RightSidebar>
  )
}

export default IssueForm
