import { Button as BPButton, Checkbox } from '@blueprintjs/core'
import { Dropdown, MoreOptions, MoreOptionsItems, style as sharedStyle } from 'botpress/shared'
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
import withLanguage from '~/components/Util/withLanguage'
import { getFormData, isFormEmpty } from '~/util/NodeFormData'
import EditableInput from '~/views/FlowBuilder/common/EditableInput'

import { toastInfo } from '../../../../components/Shared/Utils'
import { getCurrentFlow, getCurrentFlowNode } from '../../../../reducers'
import style from '../style.scss'

import SaySomethingTextForm from './TextForm'

const { MoreOptionsStyles } = sharedStyle

interface OwnProps {
  onDeleteSelectedElements: () => void
  readOnly: boolean
  subflows: any
  updateNode: any
  contentLang: string
  defaultLanguage: string
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps
type Props = DispatchProps & StateProps & OwnProps

export interface FormState {
  contentType: string
  text: string
  variations: string[]
  markdown: boolean
  typing: boolean
  error: any
}

const defaultFormState: FormState = {
  contentType: 'builtin_text',
  text: '',
  variations: [''],
  markdown: true,
  typing: true,
  error: null
}

const SaySomethingForm: FC<Props> = props => {
  const formReducer = (state: FormState, action): FormState => {
    if (action.type === 'resetData') {
      return {
        ...state,
        error: null,
        contentType: 'builtin_text',
        text: '',
        markdown: true,
        typing: true,
        variations: ['']
      }
    } else if (action.type === 'newData') {
      const { text, variations, contentType, markdown, typing } = action.data

      return {
        error: null,
        contentType: contentType || 'builtin_text',
        text,
        variations,
        markdown,
        typing
      }
    } else if (action.type === 'addVariation') {
      const newVariations = state.variations || []

      return {
        ...state,
        variations: [...newVariations, '']
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
    } else if (action.type === 'updateData') {
      const { value, field } = action.data

      props.updateNode({
        formData: {
          [`text$${props.contentLang}`]: state.text,
          [`variations$${props.contentLang}`]: state.variations,
          [`markdown$${props.contentLang}`]: state.markdown,
          [`typing${props.contentLang}`]: state.typing,
          [`${field}$${props.contentLang}`]: value
        }
      })

      return {
        ...state,
        [field]: value
      }
    } else {
      throw new Error(`That action type isn't supported.`)
    }
  }

  const [formState, dispatchForm] = useReducer(formReducer, defaultFormState)
  const [showOptions, setShowOptions] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

  useEffect(() => {
    dispatchForm({ type: 'resetData' })
    extractDataFromNode()

    if (!props.categories?.length) {
      props.fetchContentCategories()
    }
  }, [props.currentFlowNode.id])

  const extractDataFromNode = () => {
    const { currentFlowNode, contentLang, defaultLanguage } = props
    const data = getFormData(currentFlowNode, contentLang, defaultLanguage)

    if (!isFormEmpty(data)) {
      dispatchForm({ type: 'newData', data: { ...data, contentType: currentFlowNode?.contentType } })
    } else {
      handleContentTypeChange(currentFlowNode?.contentType, true)
    }
  }

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
  const { contentType, markdown, typing } = formState

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

  return (
    <Fragment>
      <div className={style.formHeader}>
        <h4>Say Something</h4>
        <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
      </div>
      <form className={style.sidePanelForm}>
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
          {/*<select value={contentType} onChange={e => handleContentTypeChange(e.currentTarget.value)}>
            {categories &&
              categories
                .filter(cat => !cat.hidden)
                .map((category, i) => (
                  <option
                    key={i}
                    value={category.id}
                    className={classnames('list-group-item', 'list-group-item-action')}
                  >
                    {category.title}
                  </option>
                ))}
                </select>*/}
        </div>
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
              checked={markdown || false}
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
              checked={typing || false}
              onChange={() => dispatchForm({ type: 'updateData', data: { field: 'typing', value: !typing } })}
            />
          </Fragment>
        )}
      </form>
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
