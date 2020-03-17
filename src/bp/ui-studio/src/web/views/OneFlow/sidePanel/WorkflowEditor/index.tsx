import { Button, FormGroup, InputGroup, Intent, TextArea } from '@blueprintjs/core'
import { Flow } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { createFlow, renameFlow, updateFlow } from '~/actions'
import { BaseDialog, DialogBody, DialogFooter } from '~/components/Shared/Interface'
import { sanitizeName } from '~/util'

interface OwnProps {
  isOpen: boolean
  selectedWorkflow?: string
  readOnly: boolean
  canRename: boolean
  selectedTopic?: string
  toggle: () => void
}

interface StateProps {
  flows: Flow[]
}

interface DispatchProps {
  updateFlow: (params: any) => void
  renameFlow: (flow: { targetFlow: string; name: string }) => void
  createFlow: (name: string) => void
}

type Props = StateProps & DispatchProps & OwnProps

const WorkflowEditor: FC<Props> = props => {
  const [name, setName] = useState<string>('')
  const [label, setLabel] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  useEffect(() => {
    const originalFlow = props.flows.find(x => x.name === props.selectedWorkflow)
    if (originalFlow) {
      const { name, label, description } = originalFlow

      setName(name.replace(/\.flow\.json$/i, ''))
      setLabel(label || '')
      setDescription(description || '')
    } else {
      setName(props.selectedTopic ? props.selectedTopic + '/' : '')
      setLabel('')
      setDescription('')
    }
  }, [props.isOpen])

  const submit = async () => {
    const fullName = `${name}.flow.json`

    if (isCreate) {
      props.createFlow(fullName)
    } else {
      const originalFlow = props.flows.find(x => x.name === props.selectedWorkflow)

      // TODO: fix flow edition
      if (originalFlow.name !== fullName) {
        props.renameFlow({ targetFlow: originalFlow.name, name: fullName })
      }
      props.updateFlow({ name: fullName, description, label })
    }

    closeModal()
  }

  const closeModal = () => {
    setName('')
    setLabel('')
    setDescription('')
    props.toggle()
  }

  const isCreate = !props.selectedWorkflow

  let dialog: { icon: any; title: string } = { icon: 'add', title: 'Create Workflow' }
  if (!isCreate) {
    dialog = { icon: 'edit', title: `Edit Workflow - ${props.selectedWorkflow}` }
  }

  return (
    <BaseDialog isOpen={props.isOpen} onClose={closeModal} onSubmit={submit} {...dialog}>
      <DialogBody>
        <div>
          <FormGroup label="Name" helperText="The name is used internally">
            <InputGroup
              id="input-flow-name"
              tabIndex={1}
              required
              value={name || ''}
              onChange={e => setName(sanitizeName(e.currentTarget.value))}
              autoFocus
            />
          </FormGroup>

          <FormGroup
            label="Label"
            helperText="The label is a friendly name that can replace the name in the topic list"
          >
            <InputGroup
              id="input-flow-label"
              tabIndex={2}
              value={label || ''}
              onChange={e => setLabel(e.currentTarget.value)}
            />
          </FormGroup>

          <FormGroup label="Description">
            <TextArea
              id="input-flow-description"
              rows={3}
              tabIndex={3}
              value={description || ''}
              fill
              onChange={e => setDescription(e.currentTarget.value)}
            />
          </FormGroup>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button type="submit" id="btn-submit" tabIndex={4} text="Save changes" intent={Intent.PRIMARY} />
      </DialogFooter>
    </BaseDialog>
  )
}

const mapStateToProps = state => ({
  flows: _.values(state.flows.flowsByName)
})

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, { updateFlow, renameFlow, createFlow })(
  WorkflowEditor
)
