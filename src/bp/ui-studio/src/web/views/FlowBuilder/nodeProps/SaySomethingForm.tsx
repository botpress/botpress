import { Button as BPButton, Icon, Position, Toaster } from '@blueprintjs/core'
import classnames from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useReducer, useState } from 'react'
import TextareaAutosize from 'react-autosize-textarea'

import Button from '../../../components/Button'
import MoreOptions from '../../../components/MoreOptions'
import MoreOptionsStyles from '../../../components/MoreOptions/style.scss'
import withLanguage from '../../../components/Util/withLanguage'
import { getFormData, isFormEmpty } from '../../../util/NodeFormData'
import EditableInput from '../common/EditableInput'

import style from './style.scss'

interface Props {
  buffer: any
  categories: any
  contentLang: string
  defaultLanguage: string
  contentItem: any
  copyFlowNode: any
  fetchContentCategories: any
  fetchContentItem: any
  flow: any
  itemId: string
  node: any
  pasteFlowNode: any
  readOnly: boolean
  requestEditSkill: any
  subflows: any
  updateFlow: any
  updateNode: any
  user: any
}

const SaySomethingForm: FC<Props> = props => {
  const formReducer = (state, action) => {
    if (action.type === 'resetData') {
      return {
        ...state,
        error: null,
        contentType: '',
        text: '',
        variations: ['']
      }
    } else if (action.type === 'newData') {
      const { text, variations, contentType } = action.data
      return {
        error: null,
        contentType,
        text,
        variations
      }
    } else if (action.type === 'addVariation') {
      const newVariations = state.variations || []

      return {
        ...state,
        variations: [...newVariations, '']
      }
    } else if (action.type === 'updateContentType') {
      const { value, initial } = action.data
      const contentType = { contentType: value }

      if (!initial) {
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

  const [formState, dispatchForm] = useReducer(formReducer, {
    contentType: '',
    text: '',
    variations: [''],
    error: null
  })
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    dispatchForm({ type: 'resetData' })
    props.fetchContentItem(props.itemId).then(useContentData)
    props.fetchContentCategories()
  }, [props.itemId])

  const useContentData = () => {
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

  const handleKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
      e.target.select()
    }
  }

  const updateVariations = (value, index) => {
    const newVariations = formState.variations

    newVariations[index] = value

    dispatchForm({ type: 'updateData', data: { value: newVariations, field: 'variations' } })
  }

  const { node, readOnly, categories } = props
  const { contentType, text, variations } = formState

  return (
    <Fragment>
      <div className={style.formHeader}>
        <h4>Say Something</h4>
        <MoreOptions show={showOptions} onToggle={setShowOptions}>
          <li>
            <Button className={MoreOptionsStyles.moreMenuItem} onClick={onCopy.bind(this)}>
              <Icon icon="duplicate" iconSize={20} /> Copy
            </Button>
          </li>
          <li>
            <Button className={classnames(MoreOptionsStyles.moreMenuItem, MoreOptionsStyles.delete)}>
              <Icon icon="trash" iconSize={20} /> Delete
            </Button>
          </li>
        </MoreOptions>
      </div>
      <form className={style.sidePanelForm}>
        <label className={style.fieldWrapper}>
          <span className={style.formLabel}>Node name</span>
          <EditableInput
            readOnly={readOnly}
            value={node.name}
            className={style.textInput}
            onChanged={renameNode}
            transform={transformText}
          />
        </label>
        <label className={style.fieldWrapper}>
          <span className={style.formLabel}>Content type</span>
          <div className={style.formSelect}>
            <select value={contentType} onChange={e => handleContentTypeChange(e.currentTarget.value)}>
              <option value={null}>Select</option>
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
        <label className={style.fieldWrapper}>
          <span className={style.formLabel}>Message*</span>
          <TextareaAutosize
            className={style.textarea}
            onKeyDown={handleKeyDown}
            value={text}
            rows={1}
            maxRows={4}
            onChange={e => dispatchForm({ type: 'updateData', data: { field: 'text', value: e.currentTarget.value } })}
          ></TextareaAutosize>
        </label>
        <div className={style.fieldWrapper}>
          <span className={style.formLabel}>Alternates</span>
          {variations &&
            variations.map((variantion, index) => (
              <TextareaAutosize
                key={index}
                rows={1}
                maxRows={4}
                onKeyDown={handleKeyDown}
                className={classnames(style.textarea, style.multipleInputs)}
                value={variantion}
                onChange={e => updateVariations(e.currentTarget.value, index)}
              ></TextareaAutosize>
            ))}
          <BPButton
            onClick={() => dispatchForm({ type: 'addVariation' })}
            className={style.addContentBtn}
            icon="plus"
            large={true}
          >
            Add Alternates
          </BPButton>
        </div>
      </form>
    </Fragment>
  )
}

export default withLanguage(SaySomethingForm)
