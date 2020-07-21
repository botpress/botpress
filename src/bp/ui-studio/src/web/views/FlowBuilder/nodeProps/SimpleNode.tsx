import { FormGroup, InputGroup } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { Component, Fragment } from 'react'
import { Panel } from 'react-bootstrap'

import EditableInput from '../common/EditableInput'

import style from './style.scss'

export const SimpleNode = props => {
  const renameNode = text => {
    if (text) {
      const alreadyExists = props.flow.nodes.find(x => x.name === text)
      if (!alreadyExists) {
        props.updateNode({ name: text })
      }
    }
  }

  const changeFriendlyName = text => {
    props.updateNode({ friendlyName: text || '' })
    props.refreshCallerFlows()
  }

  const { node, readOnly } = props

  return (
    <div className={style.node}>
      <Panel>
        <EditableInput
          readOnly={readOnly}
          value={node.name}
          className={style.name}
          onChanged={renameNode}
          transform={text => text.replace(/[^a-z0-9-_\.]/gi, '_')}
        />
      </Panel>

      {node.type !== 'sub-workflow' && (
        <FormGroup label="Friendly Name">
          <InputGroup value={node.friendlyName || ''} onChange={e => changeFriendlyName(e.currentTarget.value)} />
        </FormGroup>
      )}
    </div>
  )
}
