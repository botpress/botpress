import { Icon } from '@blueprintjs/core'
import React, { FC, useState } from 'react'
import { Panel } from 'react-bootstrap'

import MoreOptions from '../../../components/MoreOptions'
import EditableInput from '../common/EditableInput'

import style from './style.scss'

interface Props {
  node: any
  readOnly: boolean
  updateNode: any
  flow: any
  subflows: any
  requestEditSkill: any
  copyFlowNodeElement: any
  pasteFlowNodeElement: any
  buffer: any
  updateFlow: any
  user: any
}

const SaySomethingForm: FC<Props> = props => {
  const [showOptions, setShowOptions] = useState(false)
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

  const { node, readOnly } = props

  return (
    <div className={style.node}>
      <div className={style.formHeader}>
        <h4>Say Something</h4>
        <MoreOptions show={showOptions} onToggle={setShowOptions}>
          <li>
            <button type="button">
              <Icon icon="duplicate" /> Copy
            </button>
          </li>
          <li>
            <button type="button">
              <Icon icon="trash" /> Delete
            </button>
          </li>
        </MoreOptions>
      </div>
      <Panel>
        <EditableInput
          readOnly={readOnly}
          value={node.name}
          className={style.name}
          onChanged={renameNode}
          transform={transformText}
        />
      </Panel>
    </div>
  )
}

export default SaySomethingForm
