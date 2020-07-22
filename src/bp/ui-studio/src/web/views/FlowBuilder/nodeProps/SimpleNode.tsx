import { FormGroup, InputGroup } from '@blueprintjs/core'
import { FlowView } from 'common/typings'
import React from 'react'
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

  const setParam = (type: 'in' | 'out', param, value) => {
    props.updateNode({
      subflow: {
        ...node.subflow,
        [type]: {
          ...node.sublofw?.[type],
          [param]: {
            source: 'variable',
            value
          }
        }
      }
    })
  }

  const getSubFlow = () => {
    const subflow = props.flows.find(x => x.name === node.flow) as FlowView
    const inputs = subflow.variables.filter(v => v.isInput)
    const outputs = subflow.variables.filter(v => v.isOutput)

    return (
      <div>
        <p>Inputs</p>
        {renderParams('in', inputs)}
        <p>Outputs</p>
        {renderParams('out', outputs)}
      </div>
    )
  }

  const renderParams = (type, params) => {
    return (
      <div>
        {params.map(input => (
          <FormGroup label={input.name}>
            <InputGroup
              value={node.subflow?.[type]?.[input.name]?.value || ''}
              onChange={e => setParam(type, input.name, e.currentTarget.value)}
            />
          </FormGroup>
        ))}
      </div>
    )
  }

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
      {node.type === 'sub-workflow' && getSubFlow()}
    </div>
  )
}
