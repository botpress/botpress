import { Button, Dialog, FormGroup, HTMLSelect, InputGroup, Label } from '@blueprintjs/core'
import { ActionServer } from 'common/typings'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'

import { Action } from '../diagram/nodes_v2/ActionNode'

import { ActionParameters } from './ActionParameters'

export interface Parameter {
  key: string
  value: string
}

interface ActionDialogProps {
  actionName: string
  actionServerId: string
  actionParameters: Parameter[]
  actionServers: ActionServer[]
  isOpen: boolean
  onClose: () => void
  onSave: (action: Action) => void
}

const ActionDialog: FC<ActionDialogProps> = props => {
  const { actionParameters, actionServers, isOpen, onClose, onSave } = props
  const [name, setName] = useState(props.actionName)
  const [actionServerId, setActionServerId] = useState(props.actionServerId || actionServers[0].id)
  const [parameters, setParameters] = useState(actionParameters)

  const valid = name && actionServerId

  return (
    <Dialog isOpen={isOpen} title="Edit Action" icon="offline" onClose={() => onClose()}>
      <Label>
        Action Server
        <HTMLSelect value={actionServerId} onChange={e => setActionServerId(e.target.value)}>
          {actionServers.map(actionServer => (
            <option key={actionServer.id} value={actionServer.id}>
              {actionServer.id} ({actionServer.baseUrl})
            </option>
          ))}
        </HTMLSelect>
      </Label>

      <FormGroup
        helperText="This is the action that will be executed on the chosen Action Server"
        label="Action Name"
        labelFor="action-name"
        labelInfo="(required)"
      >
        <InputGroup
          id="action-name"
          value={name}
          placeholder="Your action's name"
          onChange={event => {
            setName(event.target.value.replace(/[^a-z0-9-_]/gi, '_'))
          }}
        />
      </FormGroup>

      <FormGroup
        helperText="These parameters will be passed to the executed action"
        label="Action Parameters"
        labelFor="action-parameters"
      >
        <ActionParameters
          parameters={parameters}
          onAdd={() => {
            setParameters([...parameters, { key: '', value: '' }])
          }}
          onUpdate={parameters => {
            setParameters([...parameters])
          }}
        />
      </FormGroup>
      <Button
        disabled={!valid}
        onClick={() => {
          const parametersObject = parameters.reduce((previous, parameter) => {
            if (parameter.key && parameter.value) {
              previous[parameter.key] = parameter.value
            }
            return previous
          }, {})
          onSave({ actionServerId, name, parameters: parametersObject })
        }}
      >
        Save
      </Button>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  actionServers: state.actionServers
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(ActionDialog)
