import { Button, Callout, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  // Used for actions rename and duplicate
  originalName?: string
  action: 'create' | 'rename' | 'duplicate'
  intentNames: string[]
  isOpen: boolean
  toggle: () => void
  onCreateIntent: (name: string) => void
  onDuplicateIntent: (intent: { intentNameToDuplicate: string; name: string }) => void
  onRenameIntent: (intent: { targetIntent: string; name: string }) => void
}

export const sanitizeName = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s|\t|\n/g, '-')
    .replace(/[^a-z0-9-_.]/g, '')

const IntentNameModal: FC<Props> = props => {
  const [name, setName] = useState()

  useEffect(() => {
    props.action === 'rename' ? setName(props.originalName) : setName('')
  }, [props.isOpen])

  const submit = async e => {
    e.preventDefault()

    if (props.action === 'create') {
      props.onCreateIntent(name)
    } else if (props.action === 'duplicate') {
      props.onDuplicateIntent({ intentNameToDuplicate: props.originalName, name: name })
    } else if (props.action === 'rename') {
      props.onRenameIntent({ targetIntent: props.originalName, name: name })
    }

    closeModal()
  }

  const closeModal = () => {
    setName('')
    props.toggle()
  }

  const isIdentical = props.action === 'rename' && props.originalName === name
  const alreadyExists = !isIdentical && _.some(props.intentNames, n => n.toLowerCase() === name.toLowerCase())

  let dialog: { icon: any; title: string } = { icon: 'add', title: 'Create Intent' }
  if (props.action === 'duplicate') {
    dialog = { icon: 'duplicate', title: 'Duplicate Intent' }
  } else if (props.action === 'rename') {
    dialog = { icon: 'edit', title: 'Rename Intent' }
  }

  return (
    <Dialog isOpen={props.isOpen} onClose={closeModal} transitionDuration={0} {...dialog}>
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Intent Name" helperText={`It can only contain letters, numbers, underscores and hyphens.`}>
            <InputGroup
              id="input-intent-name"
              tabIndex={1}
              placeholder="Choose a name for your intent"
              required={true}
              value={name}
              onChange={e => setName(sanitizeName(e.currentTarget.value))}
              autoFocus={true}
            />
          </FormGroup>

          {alreadyExists && (
            <Callout title="Name already in use" intent={Intent.DANGER}>
              An intent with that name already exists. Please choose another one.
            </Callout>
          )}
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type="submit" id="btn-submit" text="Submit" onClick={submit} disabled={!name || alreadyExists} />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default IntentNameModal
