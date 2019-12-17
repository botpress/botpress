import { Button, Callout, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  // Used for actions rename and duplicate
  originalName?: string
  action: 'create' | 'rename' | 'duplicate'
  flowsNames: any
  isOpen: boolean
  toggle: () => void
  onCreateFlow: (flowName: string) => void
  onDuplicateFlow: (flow: { flowNameToDuplicate: string; name: string }) => void
  onRenameFlow: (flow: { targetFlow: string; name: string }) => void
}

export const sanitizeName = (text: string) =>
  text
    .replace(/\s/g, '-')
    .replace(/[^a-zA-Z0-9\/_-]/g, '')
    .replace(/\/\//, '/')

const FlowNameModal: FC<Props> = props => {
  const [name, setName] = useState()

  useEffect(() => {
    props.action === 'rename' ? setName(props.originalName.replace(/\.flow\.json$/i, '')) : setName('')
  }, [props.isOpen])

  const submit = async e => {
    e.preventDefault()

    if (props.action === 'create') {
      props.onCreateFlow(name)
    } else if (props.action === 'duplicate') {
      props.onDuplicateFlow({ flowNameToDuplicate: props.originalName, name: `${name}.flow.json` })
    } else if (props.action === 'rename') {
      props.onRenameFlow({ targetFlow: props.originalName, name: `${name}.flow.json` })
    }

    closeModal()
  }

  const closeModal = () => {
    setName('')
    props.toggle()
  }

  const isIdentical = props.action === 'rename' && props.originalName === `${name}.flow.json`
  const alreadyExists =
    !isIdentical && _.some(props.flowsNames, n => n.toLowerCase() === `${name}.flow.json`.toLowerCase())

  let dialog: { icon: any; title: string } = { icon: 'add', title: 'Create Flow' }
  if (props.action === 'duplicate') {
    dialog = { icon: 'duplicate', title: 'Duplicate Flow' }
  } else if (props.action === 'rename') {
    dialog = { icon: 'edit', title: 'Rename Flow' }
  }

  return (
    <Dialog isOpen={props.isOpen} onClose={closeModal} transitionDuration={0} {...dialog}>
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup
            label="Flow Name"
            helperText={`It can only contain letters, numbers, underscores and hyphens. You can also use slashes to create folders (ex: myfolder/mynewflow)`}
          >
            <InputGroup
              id="input-flow-name"
              tabIndex={1}
              placeholder="Choose a name for your flow"
              required={true}
              value={name}
              onChange={e => setName(sanitizeName(e.currentTarget.value))}
              autoFocus={true}
            />
          </FormGroup>

          {alreadyExists && (
            <Callout title="Name already in use" intent={Intent.DANGER}>
              A flow with that name already exists. Please choose another one.
            </Callout>
          )}
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              type="submit"
              id="btn-submit"
              text="Submit"
              onClick={submit}
              disabled={!name || isIdentical || alreadyExists}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default FlowNameModal
