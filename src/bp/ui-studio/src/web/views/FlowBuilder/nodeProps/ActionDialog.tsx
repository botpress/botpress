import { Button, ControlGroup, Dialog, FormGroup, HTMLSelect, InputGroup, Label } from '@blueprintjs/core'
import { ActionServer } from 'common/typings'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'

interface ActionDialogProps {
  actionServers: ActionServer[]
  isOpen: boolean
  onClose: () => void
  onSave: (action: string) => void
}

const ActionDialog: FC<ActionDialogProps> = props => {
  const { actionServers, isOpen, onClose, onSave } = props
  const [actionName, setActionName] = useState('')

  return (
    <Dialog isOpen={isOpen} title="Edit Action" icon="offline" onClose={() => onClose()}>
      <Label>
        Action Server
        <HTMLSelect>
          {actionServers.map(actionServer => (
            <option key={actionServer.baseUrl}>{actionServer.baseUrl}</option>
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
          value={actionName}
          placeholder="Your action's name"
          onChange={event => {
            setActionName(event.target.value.replace(/[^a-z0-9-_]/gi, '_'))
          }}
        />
      </FormGroup>

      <FormGroup
        helperText="These parameters will be passed to the executed action"
        label="Action Parameters"
        labelFor="action-parameters"
      >
        <ControlGroup id="action-parameters">
          <InputGroup id="action-parameters" placeholder="Name" />
          <InputGroup id="action-parameters" placeholder="Value" />
          <Button icon="remove" />
        </ControlGroup>
      </FormGroup>
      <Button onClick={() => onSave(`someAction ${JSON.stringify({ a: 1 })} https://localhost:4000`)}>Save</Button>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  actionServers: state.actionServers
})

const mapDispatchToProps = {}

export default connect(mapStateToProps, mapDispatchToProps)(ActionDialog)
