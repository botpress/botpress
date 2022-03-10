import { Button, Classes, Dialog, FormGroup, InputGroup, Radio, RadioGroup, TextArea } from '@blueprintjs/core'
import { toast } from 'botpress/shared'
import React, { FC, Fragment, useState } from 'react'
import api from '~/app/api'

export const sanitizeText = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9_-]/g, '')

interface Props {
  refreshWorkspaces: () => void
}

const CreateWorkspaceModal: FC<Props> = props => {
  const [isOpen, setOpen] = useState(false)
  const [generateId, setGenerateId] = useState(true)
  const [step, setStep] = useState(1)
  const [id, setId] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [audience, setAudience] = useState('internal')
  const [pipelineId, setPipelineId] = useState('none')
  const [botPrefix, setBotPrefix] = useState('')

  const submit = async () => {
    const workspace = { id, name, audience, description, pipelineId, botPrefix }

    try {
      await api.getSecured().post('/admin/workspace/workspaces', workspace)
      props.refreshWorkspaces()

      toast.success('Workspace created successfully')
      closeModal()
    } catch (err) {
      toast.failure(err.message)
    }
  }

  const closeModal = () => {
    setId('')
    setName('')
    setDescription('')
    setAudience('external')
    setPipelineId('none')
    setBotPrefix('')
    setOpen(false)
    setGenerateId(true)
  }

  const updateName = e => {
    setName(e.target.value)
    generateId && setId(sanitizeText(e.target.value))
  }

  const updateId = e => {
    setGenerateId(false)
    setId(sanitizeText(e.target.value))
  }

  return (
    <div>
      <Dialog isOpen={isOpen} icon="add" onClose={closeModal} transitionDuration={0} title={'Create workspace'}>
        <div className={Classes.DIALOG_BODY}>
          {step === 1 && (
            <Fragment>
              <FormGroup label={<span>Workspace Name</span>} labelFor="input-workspaceName" labelInfo="*">
                <InputGroup
                  id="input-workspaceName"
                  placeholder="The name of your workspace"
                  value={name}
                  onChange={updateName}
                  tabIndex={1}
                  autoFocus={true}
                />
              </FormGroup>

              <FormGroup
                label={<span>Workspace ID</span>}
                labelFor="input-workspaceId"
                labelInfo="*"
                helperText="This ID cannot be changed afterwards."
              >
                <InputGroup
                  id="input-workspaceId"
                  placeholder="The ID of your workspace"
                  value={id}
                  onChange={updateId}
                  tabIndex={2}
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
                  tabIndex={3}
                />
              </FormGroup>

              <FormGroup label={<span>Description</span>} labelFor="input-description">
                <TextArea
                  id="input-description"
                  placeholder="What is this workspace being used for? (optional)"
                  value={description}
                  onChange={e => setDescription(e.currentTarget.value)}
                  fill={true}
                  rows={3}
                  tabIndex={4}
                  maxLength={500}
                />
              </FormGroup>
            </Fragment>
          )}

          {step === 2 && (
            <Fragment>
              <RadioGroup
                label="Who will interact with bots of this workspace? "
                onChange={e => setAudience(e.currentTarget.value)}
                selectedValue={audience}
              >
                <Radio id="radio-insert" label="External users" value="external" />
                <Radio id="radio-internal" label="Internal users" value="internal" />
              </RadioGroup>
            </Fragment>
          )}

          {step === 3 && (
            <Fragment>
              <RadioGroup
                label="Which pipeline would you like to use for this workspace?"
                onChange={e => setPipelineId(e.currentTarget.value)}
                selectedValue={pipelineId}
              >
                <Radio id="radio-no-pipeline" label="No pipeline [production]" value="none" />
                <Radio id="radio-bp-pipeline" label="Botpress default [dev, staging, production]" value="botpress" />
              </RadioGroup>
            </Fragment>
          )}
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            {step > 1 && <Button id="btn-prev" text="Previous" onClick={() => setStep(step - 1)} />}
            {step < 3 && <Button id="btn-next" text="Next" onClick={() => setStep(step + 1)} />}
            {step === 3 && <Button id="btn-submit-create-workspace" text="Submit" onClick={submit} />}
          </div>
        </div>
      </Dialog>

      <Button id="btn-create" text="Create workspace" icon="add" onClick={() => setOpen(true)} />
    </div>
  )
}

export default CreateWorkspaceModal
