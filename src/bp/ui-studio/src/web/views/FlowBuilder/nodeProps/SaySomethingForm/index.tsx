import { Button as BPButton, Checkbox, Position, Toaster } from '@blueprintjs/core'
import { MoreOptions, MoreOptionsItems, style as sharedStyle } from 'botpress/shared'
import classnames from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useState } from 'react'

import withLanguage from '../../../../components/Util/withLanguage'
import { getFormData, isFormEmpty } from '../../../../util/NodeFormData'
import EditableInput from '../../common/EditableInput'
import style from '../style.scss'

import SaySomethingFormImage from './ImageForm'
import SaySomethingFormText from './TextForm'

const { MoreOptionsStyles } = sharedStyle

interface Props {
  buffer: any
  categories: any
  contentLang: string
  defaultLanguage: string
  copyFlowNode: any
  onDeleteSelectedElements: () => void
  fetchContentCategories: any
  flow: any
  node: any
  pasteFlowNode: any
  readOnly: boolean
  requestEditSkill: any
  subflows: any
  updateFlow: any
  updateNode: any
  user: any
}

export interface FormState {
  contentType: string
  title?: string
  image?: string
  text?: string
  variations?: string[]
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
        ...defaultFormState
      }
    } else if (action.type === 'newData') {
      const { text, variations, contentType, markdown, typing, image, title } = action.data

      return {
        error: null,
        contentType: contentType || 'builtin_text',
        image,
        title,
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
          [`typing$${props.contentLang}`]: state.typing,
          [`image$${props.contentLang}`]: state.image,
          [`title$${props.contentLang}`]: state.title,
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
  }, [props.node.id])

  const extractDataFromNode = () => {
    const { node, contentLang, defaultLanguage } = props
    const data = getFormData(node, contentLang, defaultLanguage)

    if (!isFormEmpty(data)) {
      dispatchForm({ type: 'newData', data: { ...data, contentType: node?.contentType } })
    } else {
      handleContentTypeChange(node?.contentType, true)
    }
  }

  const renameNode = text => {
    if (text) {
      const alreadyExists = props.flow.nodes.find(x => x.name === text)

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
    Toaster.create({
      className: 'recipe-toaster',
      position: Position.TOP_RIGHT
    }).show({ message: 'Copied to buffer' })
  }

  const handleContentTypeChange = (value, initial = false) => {
    dispatchForm({ type: 'updateContentType', data: { value, initial } })
  }

  const { node, readOnly, categories } = props
  const { contentType, markdown, typing } = formState

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      icon: 'duplicate',
      iconSize: 20,
      label: 'Copy',
      action: onCopy.bind(this)
    },
    {
      icon: 'trash',
      iconSize: 20,
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
            value={node.name}
            className={style.textInput}
            onChanged={renameNode}
            transform={transformText}
          />
        </label>
        <label className={style.fieldWrapper}>
          <span className={style.formLabel}>Content Type</span>
          <div className={style.formSelect}>
            <select value={contentType} onChange={e => handleContentTypeChange(e.currentTarget.value)}>
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
            </select>
          </div>
        </label>
        {contentType && contentType === 'builtin_text' && (
          <SaySomethingFormText formState={formState} dispatchForm={dispatchForm} />
        )}
        {contentType && contentType === 'builtin_image' && (
          <SaySomethingFormImage formState={formState} dispatchForm={dispatchForm} />
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

export default withLanguage(SaySomethingForm)
