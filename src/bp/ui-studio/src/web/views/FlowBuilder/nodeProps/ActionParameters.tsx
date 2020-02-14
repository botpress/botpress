import { Button, ControlGroup, InputGroup } from '@blueprintjs/core'
import React, { FC } from 'react'

import { Parameter } from './ActionDialog'

interface ActionParameterProps {
  parameter: Parameter
  onUpdate: (parameter: Parameter) => void
  onRemove: (parameter: Parameter) => void
}

export const ActionParameter: FC<ActionParameterProps> = props => {
  const { parameter, onUpdate, onRemove } = props

  const id = `action-parameters-${parameter.key}`

  return (
    <ControlGroup id={id}>
      <InputGroup
        id={id}
        placeholder="Name"
        value={parameter.key}
        onChange={e => {
          const copy = { ...parameter }
          copy.key = e.target.value
          onUpdate(copy)
        }}
      />
      <InputGroup
        id={id}
        placeholder="Value"
        value={parameter.value}
        onChange={e => {
          const copy = { ...parameter }
          copy.value = e.target.value
          onUpdate(copy)
        }}
      />
      <Button onClick={e => onRemove(parameter)} icon="remove" />
    </ControlGroup>
  )
}

interface ActionParametersProps {
  parameters: Parameter[]
  onAdd: () => void
  onUpdate: (parameters: Parameter[]) => void
}

export const ActionParameters: FC<ActionParametersProps> = props => {
  const { parameters, onAdd, onUpdate } = props

  // if (parameters.length === 0) {
  //   return (
  //     <React.Fragment>
  //       {/* <ControlGroup id={`action-parameters-0`}>
  //         <InputGroup id={`action-parameters-0`} placeholder="Name" />
  //         <InputGroup id={`action-parameters-0`} placeholder="Value" />
  //       </ControlGroup> */}
  //       <NonIdealState title="No Parameters" />
  //       <Button onClick={e => onAdd()}>Add Parameter</Button>
  //     </React.Fragment>
  //   )
  // }

  return (
    <React.Fragment>
      {parameters.map((parameter, idx) => {
        return (
          <ActionParameter
            key={idx}
            parameter={parameter}
            onUpdate={parameter => {
              const copy = [...parameters]
              copy[idx] = parameter
              onUpdate(copy)
            }}
            onRemove={parameter => {
              const copy = [...parameters]
              copy.splice(idx, 1)
              onUpdate(copy)
            }}
          />
        )
      })}
      <Button onClick={e => onAdd()}>Add Parameter</Button>
    </React.Fragment>
  )
}
