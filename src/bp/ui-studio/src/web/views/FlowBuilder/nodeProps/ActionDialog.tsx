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

  return (
    <Dialog isOpen={isOpen} title="Edit Action" icon="offline" onClose={() => onClose()}>
      <Label>
        Action Server
        <HTMLSelect
          value={action.actionServerId}
          onChange={e => {
            e.preventDefault()
            const copy = _.cloneDeep(action)
            copy.actionServerId = e.currentTarget.value
            onUpdate(copy)
          }}
        >
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
          onChange={e => {
            const newName = e.target.value.replace(/[^a-z0-9-_]/gi, '_')
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
          onUpdate={parameters => {
            const paramsObj = parameters.reduce((previousValue, param) => {
              previousValue[param.key] = param.value
              return previousValue
            }, {})

            onUpdate({ ...action, parameters: paramsObj })
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
