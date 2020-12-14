import { FlowNode } from 'botpress/sdk'
import { Form, lang, MainLayout, MoreOptions, MoreOptionsItems, sharedStyle, Tabs } from 'botpress/shared'
import { ControlType } from 'common/controls'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'
import SmartInput from '~/components/SmartInput'

interface Props {
  deleteContent: () => void
  editingContent: number
  customKey: string
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  formData: any
  contentTypes: any
  defaultLang: string
  contentLang: string
  node: FlowNode
}

const ContentForm: FC<Props> = ({
  contentTypes,
  customKey,
  editingContent,
  defaultLang,
  close,
  formData,
  onUpdate,
  deleteContent,
  node,
  contentLang
}) => {
  const [canOutsideClickClose, setCanOutsideClickClose] = useState(true)
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
    const { fields } = contentTypesFields?.[value] || {}
    contentType.current = value
    onUpdate({
      content: {
        ...Form.createEmptyDataFromSchema(fields, contentLang),
        contentType: value,
        id: formData?.id
      }
    })
  }

  const contentFields = contentTypesFields?.[contentType.current]
  const { fields } = contentFields || {}

  const prepareUpdate = data => {
    onUpdate({ content: { ...data, contentType: contentType.current } })
  }

  return (
    <MainLayout.RightSidePanel
      className={sharedStyle.wrapper}
      canOutsideClickClose={canOutsideClickClose}
      close={() => close(editingContent)}
    >
      <Fragment key={`${contentType.current}-${contentLang}-${customKey || editingContent}`}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('studio.flow.nodeType.say') }]} />
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>

        <Form.SingleControl
          control={{
            type: ControlType.Enum,
            title: 'Content Type',
            options: _.sortBy(contentTypes, 'schema.newJson.order').map(type => ({
              value: type.id,
              label: lang.tr(type.title)
            })),
            defaultValue: contentType.current
          }}
          value={contentType.current}
          onChange={value => handleContentTypeChange(value)}
        />

        {!!contentFields && (
          <Form.Form
            currentLang={contentLang}
            defaultLang={defaultLang}
            mediaPath={`${window.BOT_API_PATH}/media`}
            fields={fields}
            formData={formData}
            overrideFields={{
              smartInput: props => <SmartInput {...props} onChange={value => props.onChange(value)} />
            }}
            onUpdate={data => prepareUpdate({ ...data, contentType: contentType.current })}
          />
        )}
      </Fragment>
    </MainLayout.RightSidePanel>
  )
}

export default ContentForm
