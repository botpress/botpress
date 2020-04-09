import { Button, Callout, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

interface Props {
  isOpen: boolean
  toggle: () => void
  onSubmit: (sanitizedName: string, rawName: string) => void
  title: string
  originalName?: string
  intents?: NLU.IntentDefinition[]
}

const sanitizeName = (text: string) =>
  text
    .replace(/\s|\t|\n/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '')

const NameModal: FC<Props> = props => {
  const [name, setName] = useState('')

  useEffect(() => {
    props.originalName ? setName(props.originalName) : setName('')
  }, [props.isOpen])

  const submit = async e => {
    e.preventDefault()
    props.onSubmit(sanitizeName(name), name)
    closeModal()
  }

  const closeModal = () => {
    setName('')
    props.toggle()
  }

  const alreadyExists = !!(props.intents || []).find(x => x.name === sanitizeName(name))

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={closeModal}
      transitionDuration={0}
      icon="add"
      title={<span style={{ textTransform: 'capitalize' }}>{props.title}</span>}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={lang.tr('name')}>
            <InputGroup
              id="input-intent-name"
              tabIndex={1}
              placeholder={lang.tr('module.nlu.intents.namePlaceholder')}
              required={true}
              value={name}
              onChange={e => setName(e.currentTarget.value)}
              autoFocus={true}
            />
          </FormGroup>

          {alreadyExists && <Callout intent={Intent.WARNING}>{lang.tr('module.nlu.intents.nameDupe')}</Callout>}
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
