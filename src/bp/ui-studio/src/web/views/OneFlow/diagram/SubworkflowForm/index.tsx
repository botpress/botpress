import axios from 'axios'
import { FlowNode, FormField } from 'botpress/sdk'
import { Contents, lang, MainContent, RightSidebar } from 'botpress/shared'
import { FlowView } from 'common/typings'
import React, { FC, useState } from 'react'

import style from './style.scss'

interface Props {
  close: () => void
  node: FlowNode
  diagramEngine: any
  flows: FlowView[]
  type: 'in' | 'out'
}

const SubworkflowForm: FC<Props> = ({ type, close, node, diagramEngine, flows }) => {
  if (!node) {
    return null
  }

  const formatInitialData = () => {
    const formData: any = {}

    for (const [key, value] of Object.entries(node?.subflow?.in || {})) {
      formData[key] = `${value.source === 'hardcoded' ? '' : '$'}${value.value}`
    }
    for (const [key, value] of Object.entries(node.subflow?.out || {})) {
      formData[key] = `$${value}`
    }

    return formData
  }

  const [formData, setFormData] = useState<FormData>(formatInitialData())

  const setParam = (param, value: string) => {
    setFormData({ ...formData, [param]: value })

    let serialized: any = value || ''
    let isVariable = false

    if (serialized.startsWith('$')) {
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

  const subflow = flows.find(x => x.name === node?.flow)
  const fields = (subflow?.variables || [])
    .filter(v => (type === 'in' ? v.params.isInput : v.params.isOutput))
    .map<FormField>(x => ({
      type: 'text',
      key: x.params.name,
      label: x.params.name,
      superInput: true
    }))

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={() => close()}>
      <MainContent.Header tabs={[{ id: '0', title: lang.tr(type === 'in' ? 'input' : 'output') }]} />
      <Contents.Form
        superInputOptions={{ variablesOnly: type === 'out' }}
        fields={fields}
        advancedSettings={[]}
        axios={axios}
        events={[]}
        formData={formData}
        onUpdate={data => fields.forEach(k => setParam(k.key, data[k.key]))}
      />
    </RightSidebar>
  )
}

export default SubworkflowForm
