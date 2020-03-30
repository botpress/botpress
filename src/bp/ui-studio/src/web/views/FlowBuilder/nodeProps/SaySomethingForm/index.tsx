import { Button as BPButton, Checkbox } from '@blueprintjs/core'
import { Dropdown, MoreOptions, MoreOptionsItems, style as sharedStyle } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useState } from 'react'
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
import { getCurrentFlow, getCurrentFlowNode } from '~/reducers'
import { getFormData, isFormEmpty } from '~/util/NodeFormData'
import EditableInput from '~/views/FlowBuilder/common/EditableInput'

import style from '../style.scss'

import SaySomethingTextForm from './TextForm'

const { MoreOptionsStyles } = sharedStyle

interface OwnProps {
  onDeleteSelectedElements: () => void
  readOnly: boolean
  subflows: any
  formData: any
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

const defaultFormState: FormState = {
  contentType: 'builtin_text',
  error: null
}

const SaySomethingForm: FC<Props> = props => {
  const formReducer = (state: FormState, action): FormState => {
    if (action.type === 'resetData') {
      return {
        ...state,
        error: null,
        contentType: 'builtin_text'
      }
    } else if (action.type === 'newData') {
      const { contentType } = action.data

      return {
        error: null,
        contentType: contentType || 'builtin_text'
      }
    } else if (action.type === 'updateContentType') {
      const { value, initial } = action.data
      const contentType = { contentType: value || 'builtin_text' }

      if (!initial || !state.contentType) {
        props.updateNode(contentType)
      }

      return {
        ...state,
        ...contentType
      }
    } else {
      throw new Error(`That action type isn't supported.`)
    }
  }

  const [formState, dispatchForm] = useReducer(formReducer, defaultFormState)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    handleContentTypeChange(currentFlowNode?.contentType, true)
    if (!props.categories?.length) {
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
    toastInfo('Copied to buffer')
  }

  const handleContentTypeChange = (value, initial = false) => {
    dispatchForm({ type: 'updateContentType', data: { value, initial } })
  }

  const { currentFlowNode, readOnly, categories } = props
  const { contentType } = formState

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      icon: 'duplicate',
      label: 'Copy',
      action: onCopy.bind(this)
    },
    {
      icon: 'trash',
      label: 'Delete',
      action: props?.onDeleteSelectedElements,
      className: MoreOptionsStyles.delete
    }
  ]

  const getCurrentCategory = () => {
    if (!contentType || !categories) {
      return
    }

    const {
      schema: {
        json: { description, ...json },
        ...schema
      },
      ...category
    } = categories?.find(cat => cat.id === contentType)

    // just a way to remove the description since we don't want it in the sidebar form, but still want it in the CMS
    return { ...category, schema: { json, ...schema } }
  }

  const currentCategory = getCurrentCategory()

  const handleEdit = event => {
    if (!_.isEqual(event.formData, props.formData)) {
      props.updateNode({
        formData: event.formData
      })
    }
  }
  const handleSave = event => {
    console.log('save', event.formData)
  }

  return (
    <Fragment>
      <div className={style.formHeader}>
        <h4>Say Something</h4>
        <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
      </div>
      <div className={style.sidePanelForm}>
        <label className={style.fieldWrapper}>
          <span className={style.formLabel}>Node Name</span>
          <EditableInput
            readOnly={readOnly}
            value={currentFlowNode.name}
            className={style.textInput}
            onChanged={renameNode}
            transform={transformText}
          />
        </label>
        <div className={style.fieldWrapper}>
          <span className={style.formLabel}>Content Type</span>
          {categories && (
            <Dropdown
              className={style.formSelect}
              items={categories.map(cat => ({ value: cat.id, label: cat.title }))}
              defaultItem={contentType}
              rightIcon="caret-down"
              onChange={option => {
                handleContentTypeChange(option.value)
              }}
            />
          )}
        </div>

        {currentCategory && (
          <ContentForm
            schema={currentCategory?.schema.json}
            uiSchema={currentCategory?.schema.ui}
            formData={currentFlowNode.formData}
            isEditing={true}
            onChange={handleEdit}
            onSubmit={handleSave}
          />
        )}
        {/*
          {contentType && contentType === 'builtin_text' && (
            <SaySomethingTextForm formState={formState} dispatchForm={dispatchForm} />
          )}
        <BPButton
          minimal
          rightIcon={showAdvancedSettings ? 'chevron-up' : 'chevron-down'}
          className={style.advancedSettingsBtn}
          onClick={() => {
            setShowAdvancedSettings(!showAdvancedSettings)
          }}
        >
          Advanced Settings
        </BPButton>
        {showAdvancedSettings && (
          <Fragment>
            <Checkbox
              inline
              className={style.checkboxLabel}
              name="markdown"
              checked={markdown || true}
              onChange={() => dispatchForm({ type: 'updateData', data: { field: 'markdown', value: !markdown } })}
            >
              Use Markdown
              <a href="https://snarky.surge.sh/" target="_blank">
                Learn more
              </a>
            </Checkbox>

            <Checkbox
              inline
              className={style.checkboxLabel}
              label="Display Typing Indicators"
              name="typing"
              checked={typing || true}
              onChange={() => dispatchForm({ type: 'updateData', data: { field: 'typing', value: !typing } })}
            />
          </Fragment>
        )*/}
      </div>
    </Fragment>
  )
}

const mapStateToProps = state => ({
  currentFlow: getCurrentFlow(state),
  currentFlowNode: getCurrentFlowNode(state) as any,
  user: state.user,
  categories: state.content.categories
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
