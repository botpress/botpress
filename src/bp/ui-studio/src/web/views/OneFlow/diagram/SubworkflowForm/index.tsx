import { FormGroup, InputGroup } from '@blueprintjs/core'
import axios from 'axios'
import { FlowNode, FlowVariable, FormField } from 'botpress/sdk'
import { Contents, RightSidebar } from 'botpress/shared'
import { FlowView } from 'common/typings'
import { string } from 'joi'
import React, { FC, useEffect, useState } from 'react'

import style from './style.scss'

interface Props {
  close: () => void
  node: FlowNode
  diagramEngine: any
  flows: FlowView[]
}

const SubworkflowForm: FC<Props> = ({ close, node, diagramEngine, flows }) => {
  if (!node?.subflow) {
    return null
  }

  const formatInitialData = () => {
    const formData: any = {}
    for (const [key, value] of Object.entries(node.subflow.in)) {
      formData[key] = `${value.source === 'hardcoded' ? '' : '$'}${value.value}`
    }
    for (const [key, value] of Object.entries(node.subflow.out)) {
      formData[key] = `$${value}`
    }
    ;``

    return formData
  }

  const [formData, setFormData] = useState<FormData>(formatInitialData())

  const setParam = (type: 'in' | 'out', param, value: string) => {
    setFormData({ ...formData, [param]: value })

    let serialized: any = value
    let isVariable = false

    if (serialized?.startsWith('$')) {
      serialized = serialized.substr(1, serialized.length - 1)
      isVariable = true
    }
    if (type === 'in') {
      serialized = {
        source: isVariable ? 'variable' : 'hardcoded',
        value: serialized
      }
    }

    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({
      subflow: {
        ...node.subflow,
        [type]: {
          ...node.subflow?.[type],
          [param]: serialized
        }
      }
    })
  }

  const renderParams = (type, params: FlowVariable[]) => {
    const fields = params.map<FormField>(x => ({
      type: 'text',
      key: x.name,
      label: x.name,
      superInput: true
    }))

    return (
      <Contents.Form
        fields={fields}
        advancedSettings={[]}
        axios={axios}
        events={[]}
        formData={formData}
        onUpdate={data => params.forEach(k => setParam(type, k.name, data[k.name]))}
      />
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
