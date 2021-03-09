import { ContentElement } from 'botpress/sdk'
import { Dialog, lang } from 'botpress/shared'
import { FlowView, NodeView } from 'common/typings'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import { Panel, Button } from 'react-bootstrap'
import ContentPickerWidget from '~/components/Content/Select/Widget'
import EditableInput from '../common/EditableInput'
import style from './style.scss'

interface CommentModelFormProps {
  itemId?: string
  onChange: (itemId: string) => void
}

const CommentModelForm: React.FunctionComponent<CommentModelFormProps> = props => {
  const handleChange = (item: ContentElement) => {
    props.onChange(item.id)
  }

  return (
    <div>
      <h5>{lang.tr('studio.flow.node.comment')}:</h5>
      <div className={style.section}>
        <ContentPickerWidget
          itemId={props.itemId}
          onChange={handleChange}
          contentType={'builtin_comment'}
          placeholder={lang.tr('studio.flow.node.commentToDisplay')}
        />
      </div>
    </div>
  )
}

interface CommentModalProps {
  itemId?: string
  updateNode: (...args: any[]) => void
  onClose: () => void
  show: boolean
}

const CommentModal: React.FunctionComponent<CommentModalProps> = props => {
  const [itemId, setItemId] = useState<string | undefined>(undefined)

  useEffect(() => {
    setItemId(props.itemId)
  }, [])

  useEffect(() => {
    setItemId(props.itemId)
  }, [props.itemId])

  const onSubmit = () => {
    props.updateNode({ onEnter: [itemId] })
    props.onClose()
  }

  const onChange = (itemId: string) => {
    setItemId(itemId)
  }

  return (
    <Dialog.Wrapper
      title={itemId ? lang.tr('studio.flow.node.editComment') : lang.tr('studio.flow.node.addComment')}
      isOpen={props.show}
      onClose={props.onClose}
      onSubmit={onSubmit}
    >
      <Dialog.Body>
        <div>
          <CommentModelForm itemId={itemId} onChange={onChange} />
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button id="btn-cancel-action" onClick={props.onClose}>
          {lang.tr('cancel')}
        </Button>
        <Button id="btn-submit-action" type="submit" bsStyle="primary">
          {lang.tr('save')}
          (Alt+Enter)
        </Button>
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

interface CommentNodePropertiesPanelProps {
  readOnly: boolean
  flow: FlowView
  subflows: any[]
  node: NodeView
  updateNode: (...args: any[]) => void
}

const CommentNodePropertiesPanel: React.FunctionComponent<CommentNodePropertiesPanelProps> = props => {
  const [show, setShow] = useState<boolean>(false)

  const { node, readOnly } = props

  const renameNode = (text: string) => {
    if (text) {
      const alreadyExists = props.flow.nodes.find(x => x.name === text)
      if (!alreadyExists) {
        props.updateNode({ name: text })
      }
    }
  }

  const editComment = () => {
    setShow(true)
  }

  const transformText = (text: string) => {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
  }

  const onClose = () => {
    setShow(false)
  }

  const itemId = node.onEnter[0] as string

  return (
    <div className={style.node}>
      <Panel>
        <EditableInput
          readOnly={readOnly}
          value={node.name}
          className={style.name}
          onChanged={renameNode}
          transform={transformText}
        />
        <Button onClick={editComment}>
          {itemId ? lang.tr('studio.flow.node.editComment') : lang.tr('studio.flow.node.addComment')}
        </Button>
      </Panel>
      <CommentModal show={show} itemId={itemId} onClose={onClose} updateNode={props.updateNode} />
    </div>
  )
}

export default CommentNodePropertiesPanel
