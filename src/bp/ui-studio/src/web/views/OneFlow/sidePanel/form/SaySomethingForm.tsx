import { Dropdown, lang, MoreOptions, MoreOptionsItems } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'
import { connect } from 'react-redux'
import {
  closeFlowNodeProps,
  copyFlowNode,
  fetchContentCategories,
  pasteFlowNode,
  refreshFlowsLinks,
  requestEditSkill,
  updateFlow
} from '~/actions'
import ContentForm from '~/components/ContentForm'
import { toastInfo } from '~/components/Shared/Utils'
import withLanguage from '~/components/Util/withLanguage'
import { getCurrentFlow, getCurrentFlowNode, RootReducer } from '~/reducers'
import EditableInput from '~/views/FlowBuilder/common/EditableInput'

import style from './style.scss'

interface OwnProps {
  onDeleteSelectedElements: () => void
  readOnly: boolean
  subflows: any
  formData: any
  contentType: string
  updateNode: any
  contentLang: string
  defaultLanguage: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

export interface FormState {
  contentType: string
  error: any
}

const shownCategories = ['builtin_text', 'builtin_image', 'builtin_carousel', 'builtin_card']

const SaySomethingForm: FC<Props> = props => {
  const [showOptions, setShowOptions] = useState(false)
  const { contentType, currentFlowNode, readOnly } = props
  const changedContentType = useRef(contentType)

  useEffect(() => {
    if (!props.contentTypes?.length) {
      props.fetchContentCategories()
    }
  }, [props.currentFlowNode.id])

  const renameNode = text => {
    if (text) {
      const alreadyExists = props.currentFlow.nodes.find(x => x.name === text)

      if (!alreadyExists) {
        props.updateNode({ name: text })
      }
    }
  }

  const transformText = text => {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
  }

  const onCopy = () => {
    props.copyFlowNode()
    setShowOptions(false)
    toastInfo(lang.tr('studio.flow.copiedToBuffer'))
  }

  const handleContentTypeChange = value => {
    changedContentType.current = value
    props.updateNode({ content: { contentType: value, formData: {} } })
  }

  const contentTypes = props.contentTypes?.filter(cat => shownCategories.includes(cat.id))

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      icon: 'duplicate',
      label: lang.tr('copy'),
      action: onCopy.bind(this)
    },
    {
      icon: 'trash',
      label: lang.tr('delete'),
      action: props?.onDeleteSelectedElements,
      type: 'delete'
    }
  ]

  const goThroughObjectAndLeaveOutKey = (properties: any, keyToRemove: string): any => {
    const returnObject = {}

    Object.keys(properties).forEach(key => {
      if (key !== keyToRemove) {
        returnObject[key] =
          Object.prototype.toString.call(properties[key]) === '[object Object]'
            ? goThroughObjectAndLeaveOutKey(properties[key], keyToRemove)
            : properties[key]
      }
    })

    return returnObject
  }

  const removeDescriptions = json => {
    const { properties, ...leftover } = json

    const newProperties = goThroughObjectAndLeaveOutKey(properties, 'description')

    return { properties: newProperties, ...leftover }
  }

  const getCurrentContentType = (contentType: string) => {
    if (!contentType || !contentTypes) {
      return
    }

    const {
      schema: {
        json: { description, title, ...json },
        ...schema
      },
      ...restContentType
    } = contentTypes?.find(cat => cat.id === contentType)

    // just a way to remove the descriptions since we don't want it in the sidebar form, but still want it in the CMS
    return { ...restContentType, schema: { json: removeDescriptions(json), ...schema } }
  }

  const currentContentType = getCurrentContentType(contentType || 'builtin_text')

  const handleEdit = event => {
    if (contentType === changedContentType.current && !_.isEqual(event.formData, props.formData)) {
      props.updateNode({
        content: {
          contentType: changedContentType.current || contentType,
          formData: event.formData
        }
      })
    }
  }

  return (
    <Fragment>
      <div className={style.formHeader}>
        <h4>{lang.tr('studio.flow.node.saySomething')}</h4>
        <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
      </div>
      <label className={style.fieldWrapper}>
        <span className={style.formLabel}>{lang.tr('studio.flow.node.nodeName')}</span>
        <EditableInput
          readOnly={readOnly}
          value={currentFlowNode.name}
          className={style.textInput}
          onChanged={renameNode}
          transform={transformText}
        />
      </label>
      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>{lang.tr('studio.content.contentType')}</span>
        {contentTypes && (
          <Dropdown
            filterable={false}
            className={style.formSelect}
            items={contentTypes.map(cat => ({ value: cat.id, label: lang.tr(cat.title) }))}
            defaultItem={contentType || 'builtin_text'}
            rightIcon="caret-down"
            onChange={option => {
              handleContentTypeChange(option.value)
            }}
          />
        )}
      </div>

      {currentContentType && (
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
      )}
    </Fragment>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state) as any,
  user: state.user,
  contentTypes: state.content.categories
})

const mapDispatchToProps = {
  updateFlow,
  requestEditSkill,
  fetchContentCategories,
  closeFlowNodeProps,
  refreshFlowsLinks,
  copyFlowNode,
  pasteFlowNode
}

export default connect(mapStateToProps, mapDispatchToProps)(withLanguage(SaySomethingForm))
