import { Button, Callout, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useState } from 'react'

interface Props {
  isOpen: boolean
  toggle: () => void
  onCreate: (name: string) => void
  intents?: NLU.IntentDefinition[]
}

export const sanitizeName = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s|\t|\n/g, '-')
    .replace(/[^a-z0-9-_.]/g, '')

const NameModal: FC<Props> = props => {
  const [name, setName] = useState()

  const submit = async e => {
    e.preventDefault()
    props.onCreate(name)
    closeModal()
  }

  const closeModal = () => {
    setName('')
    props.toggle()
  }

  const alreadyExists = !!(props.intents || []).find(x => x.name === name)

  return (
    <Dialog isOpen={props.isOpen} onClose={closeModal} transitionDuration={0} icon="add" title="Create Intent">
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Intent Name" helperText={`It can only contain letters, numbers, underscores and hyphens`}>
            <InputGroup
              id="input-name"
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

export default NameModal
