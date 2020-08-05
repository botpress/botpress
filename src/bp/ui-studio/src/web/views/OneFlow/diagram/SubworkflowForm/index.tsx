import { FormGroup, InputGroup } from '@blueprintjs/core'
import { FlowNode } from 'botpress/sdk'
import { RightSidebar } from 'botpress/shared'
import { FlowView } from 'common/typings'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  close: () => void
  node: FlowNode
  diagramEngine: any
  flows: FlowView[]
}

const SubworkflowForm: FC<Props> = ({ close, node, diagramEngine, flows }) => {
  const setParam = (type: 'in' | 'out', param, value) => {
    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({
      subflow: {
        ...node.subflow,
        [type]: {
          ...node.subflow?.[type],
          [param]: {
            source: 'variable',
            value
          }
        }
      }
    })
  }

  const renderParams = (type, params) => {
    return (
      <div>
        {params.map((input, i) => (
          <FormGroup key={i} label={input.name}>
            <InputGroup
              value={node.subflow?.[type]?.[input.name]?.value || ''}
              onChange={e => setParam(type, input.name, e.currentTarget.value)}
            />
          </FormGroup>
        ))}
      </div>
    )
  }

  const subflow = flows.find(x => x.name === node?.flow)

  if (!subflow?.variables) {
    return <div></div>
  }

  const inputs = subflow.variables.filter(v => v.isInput)
  const outputs = subflow.variables.filter(v => v.isOutput)

  return (
    <RightSidebar className={style.wrapper} close={() => close()}>
      <div>
        <p>Inputs</p>
        {renderParams('in', inputs)}
        <p>Outputs</p>
        {renderParams('out', outputs)}
      </div>
    </RightSidebar>
  )
}

export default SubworkflowForm
