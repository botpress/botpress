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
  action: Action
  actionServers: ActionServer[]
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onUpdate: (action: Action) => void
}

const ActionDialog: FC<ActionDialogProps> = props => {
  const { action, actionServers, isOpen, onClose, onSave, onUpdate } = props
  const [actionServerId, setActionServerId] = useState(action.actionServerId || actionServers[0].id)

  // const valid = action.name && actionServerId

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
          value={action.name}
          placeholder="Your action's name"
          onChange={event => {
            const newName = event.target.value.replace(/[^a-z0-9-_]/gi, '_')
            const copy = _.cloneDeep(action)
            copy.name = newName
            onUpdate(copy)
          }}
        />
      </FormGroup>

      <FormGroup
        helperText="These parameters will be passed to the executed action"
        label="Action Parameters"
        labelFor="action-parameters"
      >
        <ActionParameters
          parameters={Object.entries(action.parameters).map(([key, value]) => ({ key, value }))}
          onAdd={() => {
            const copy = _.cloneDeep(action)
            copy.parameters = _.merge(copy.parameters, { key: '', value: '' })
            onUpdate(copy)
          }}
          onUpdate={parameters => {
            const copy = _.cloneDeep(action)
            copy.parameters = parameters.reduce((previousValue, parameter) => {
              previousValue[parameter.key] = parameter.value
              return previousValue
            }, {})
            onUpdate(copy)
          }}
        />
      </FormGroup>
      <Button
        // disabled={!valid}
        onClick={() => {
          onSave()
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
