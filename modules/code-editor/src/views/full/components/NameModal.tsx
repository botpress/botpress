import { Button, Callout, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { EditableFile, FilesDS } from '../../../backend/typings'

interface Props {
  isOpen: boolean
  toggle: () => void
  createFile: (newName: string) => void
  renameFile: (file: EditableFile, newName: string) => void
  files?: FilesDS
  selectedFile?: EditableFile
}

const sanitizeName = (text: string) =>
  text
    .replace(/\s/g, '-')
    .replace(/[^a-zA-Z0-9\/_.-]/g, '')
    .replace(/\/\//, '/')

const NameModal: FC<Props> = props => {
  const [name, setName] = useState('')

  useEffect(() => {
    props.selectedFile ? setName(props.selectedFile.location) : setName('')
  }, [props.isOpen])

  const submit = async e => {
    e.preventDefault()
    if (props.selectedFile) {
      props.renameFile(props.selectedFile, name)
    } else {
      props.createFile(name)
    }

    closeModal()
  }

  const closeModal = () => {
    setName('')
    props.toggle()
  }

  if (!props.files) {
    return null
  }

  const alreadyExists = !!(props.files['raw'] || []).find(x => x.location === sanitizeName(name))

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={closeModal}
      transitionDuration={0}
      icon={props.selectedFile ? 'edit' : 'add'}
      title={props.selectedFile ? 'Rename or move file' : 'Create new file'}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="File Name (including any directory)">
            <InputGroup
              id="input-name"
              tabIndex={1}
              placeholder="Choose a name for the file"
              value={name}
              onChange={e => setName(sanitizeName(e.currentTarget.value))}
              required
              autoFocus
            />
          </FormGroup>

          {alreadyExists && (
            <Callout intent={Intent.WARNING}>
              A file with that name already exists. Please choose another one or delete it before.
            </Callout>
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
              disabled={!name || alreadyExists}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}

export default NameModal
