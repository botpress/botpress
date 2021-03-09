import { lang } from 'botpress/shared'
import { FlowView, NodeView } from 'common/typings'
import React from 'react'

import { Panel, Button } from 'react-bootstrap'

import { AccessControl } from '~/components/Shared/Utils'
import EditableInput from '../common/EditableInput'
import ActionSection from './ActionSection'
import style from './style.scss'

interface CommentNodePropertiesPanelProps {
  readOnly: boolean
  flow: FlowView
  subflows: any[]
  node: NodeView
  updateNode: (...args: any[]) => void
  updateFlow: (flow: Partial<FlowView>) => void
}

const CommentNodePropertiesPanel: React.FunctionComponent<CommentNodePropertiesPanelProps> = props => {
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
    return
  }

  const transformText = (text: string) => {
    return text.replace(/[^a-z0-9-_\.]/gi, '_')
  }

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
        <div style={{ padding: '5px' }}>
          <ActionSection
            readOnly={readOnly}
            items={node.onEnter}
            header={lang.tr('studio.flow.node.editComment')}
            onItemsUpdated={items => props.updateNode({ onEnter: items })}
          />
        </div>
      </Panel>
    </div>
  )
}

export default CommentNodePropertiesPanel
