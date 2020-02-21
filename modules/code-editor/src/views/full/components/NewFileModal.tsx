import { Button, Callout, Checkbox, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { FileTypes } from '../../../backend/definitions'
import { FilesDS } from '../../../backend/typings'
import { BOT_SCOPED_HOOKS } from '../../../typings/hooks'
import { baseAction } from '../utils/templates'

interface Props {
  isOpen: boolean
  toggle: () => void
  openFile: (args: any) => void
  files?: FilesDS
  selectedType: string
  selectedHookType: string
  hasPermission(perm: string, isWrite?: boolean): boolean
}

const sanitizeName = (text: string) =>
  text
    .replace(/\s/g, '-')
    .replace(/[^a-zA-Z0-9\/_.-]/g, '')
    .replace(/\/\//, '/')

const NewFileModal: FC<Props> = props => {
  const [name, setName] = useState('')
  const [isScoped, setScoped] = useState(true)

  useEffect(() => {
    setName('')
  }, [props.isOpen])

  const submit = async e => {
    e.preventDefault()

    const finalName = name.endsWith('.js') || name.endsWith('.json') ? name : name + '.js'

    await props.openFile({
      name: finalName,
      location: finalName,
      content: props.selectedType === 'action' ? baseAction : ' ',
      type: props.selectedType,
      hookType: props.selectedHookType,
      botId: canBeBotScoped() && isScoped ? window.BOT_ID : undefined
    })

    closeModal()
  }

  const canBeBotScoped = () =>
    props.selectedType !== 'hook' ||
    (props.selectedType === 'hook' && BOT_SCOPED_HOOKS.includes(props.selectedHookType))

  const closeModal = () => {
    setName('')
    props.toggle()
  }

  if (!props.selectedType) {
    return null
  }

  const fileDefinition = FileTypes[props.selectedType]
  const canGlobalWrite = props.hasPermission(`global.${fileDefinition.permission}`, true)

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={closeModal}
      transitionDuration={0}
      icon="add"
      title={`Create a new ${props.selectedType}`}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="File name" helperText="No special characters allowed. Must end in .js">
            <InputGroup
              id="input-name"
              tabIndex={1}
              placeholder="my-file.js"
              value={name}
              onChange={e => setName(sanitizeName(e.currentTarget.value))}
              required
              autoFocus
            />
          </FormGroup>

          {fileDefinition.allowScoped && canBeBotScoped() && (
            <Checkbox
              label="Create for the current bot"
              checked={isScoped}
              disabled={!fileDefinition.allowGlobal || !canGlobalWrite}
              onChange={e => setScoped(e.currentTarget.checked)}
            />
          )}
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              type="submit"
              id="btn-submit"
              text="Submit"
              intent={Intent.PRIMARY}
              onClick={submit}
              disabled={!name}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default NewFileModal
