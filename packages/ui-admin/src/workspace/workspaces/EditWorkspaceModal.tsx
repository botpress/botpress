import { Button, Classes, Dialog, FormGroup, InputGroup, TextArea } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import { Workspace } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import api from '~/app/api'

interface Props {
  workspace: Workspace
  isOpen: boolean
  toggle: () => void
  refreshWorkspaces: () => void
}

const EditWorkspaceModal: FC<Props> = props => {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [botPrefix, setBotPrefix] = useState<string | undefined>('')

  useEffect(() => {
    if (props.workspace) {
      const { name, description, botPrefix } = props.workspace

      setName(name)
      setDescription(description || '')
      setBotPrefix(botPrefix)
    }
  }, [props.workspace, props.isOpen])

  const submit = async () => {
    try {
      await api.getSecured().post(`/admin/workspace/workspaces/${props.workspace.id}`, { name, description, botPrefix })
      props.refreshWorkspaces()

      toast.success('Workspace saved successfully')
      closeModal()
    } catch (err) {
      toast.failure(err.message)
    }
  }

  const closeModal = () => {
    setName('')
    setDescription('')
    props.toggle()
  }

  return (
    <Dialog isOpen={props.isOpen} icon="edit" onClose={closeModal} transitionDuration={0} title={'Edit Workspace'}>
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label={<span>Workspace Name</span>} labelFor="input-name" labelInfo="*">
          <InputGroup
            id="input-name"
            placeholder="The name of your workspace"
            value={name}
            onChange={e => setName(e.currentTarget.value)}
            tabIndex={1}
            autoFocus={true}
          />
        </FormGroup>

        <FormGroup
          label={<span>Bot Prefix</span>}
          labelFor="input-botPrefix"
          labelInfo="*"
          helperText="Bots in this workspace must start with this prefix, followed by __"
        >
          <InputGroup
            id="input-botPrefix"
            placeholder=""
            value={botPrefix}
            onChange={e => setBotPrefix(e.target.value)}
            tabIndex={2}
          />
        </FormGroup>

        <FormGroup label={<span>Description</span>} labelFor="input-description">
          <TextArea
            id="input-description"
            placeholder="What is this workspace being used for? (optional)"
            value={description}
            onChange={e => setDescription(e.currentTarget.value)}
            rows={3}
            fill={true}
            tabIndex={3}
            maxLength={500}
          />
        </FormGroup>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button id="btn-submit-edit-workspace" text="Save" tabIndex={3} onClick={submit} />
        </div>
      </div>
    </Dialog>
  )
}

export default EditWorkspaceModal
