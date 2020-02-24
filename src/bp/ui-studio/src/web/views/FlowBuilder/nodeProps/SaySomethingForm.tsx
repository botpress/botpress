import { Button as BPButton, Icon, Position, Toaster } from '@blueprintjs/core'
import classnames from 'classnames'
import React, { FC, Fragment, useEffect, useState } from 'react'
import TextareaAutosize from 'react-autosize-textarea'

import Button from '../../../components/Button'
import MoreOptions from '../../../components/MoreOptions'
import MoreOptionsStyles from '../../../components/MoreOptions/style.scss'
import EditableInput from '../common/EditableInput'

import style from './style.scss'

interface Props {
  buffer: any
  categories: any
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
  const [showOptions, setShowOptions] = useState(false)
  const [message, setMessage] = useState('')
  const [variantions, setVariantions] = useState([''])

  useEffect(() => {
    props.fetchContentItem(props.itemId).then(useContentData)
    props.fetchContentCategories()
  }, [])

  const useContentData = data => {
    console.log(props.contentItem)
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

  const addVariantion = () => {
    setVariantions(prevVariantions => [...prevVariantions, ''])
  }

  const updateVariantions = (value, index) => {
    setVariantions(prevState => {
      prevState[index] = value

      return [...prevState]
    })
  }

  const handleInputChange = () => {}

  const handleKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
      e.target.select()
    }
  }

  const { node, readOnly, categories } = props

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
            <select onChange={this.handleInputChange}>
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
            value={message}
            rows={1}
            maxRows={4}
            onChange={e => setMessage(e.currentTarget.value)}
          ></TextareaAutosize>
        </label>
        <div className={style.fieldWrapper}>
          <span className={style.formLabel}>Alternates</span>
          {variantions &&
            variantions.map((variantion, index) => (
              <TextareaAutosize
                key={index}
                rows={1}
                maxRows={4}
                onKeyDown={handleKeyDown}
                className={classnames(style.textarea, style.multipleInputs)}
                value={variantion}
                onChange={e => updateVariantions(e.currentTarget.value, index)}
              ></TextareaAutosize>
            ))}
          <BPButton onClick={addVariantion} className={style.addContentBtn} icon="plus" large={true}>
            Add Alternates
          </BPButton>
        </div>
      </form>
    </Fragment>
  )
}

export default SaySomethingForm
