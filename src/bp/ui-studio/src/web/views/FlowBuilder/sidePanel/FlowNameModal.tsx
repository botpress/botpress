import { Button, Callout, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
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

  let dialog: { icon: any; title: string } = { icon: 'add', title: lang.tr('studio.flow.sidePanel.createFlow') }
  let submitText = lang.tr('create')
  if (props.action === 'duplicate') {
    dialog = { icon: 'duplicate', title: lang.tr('studio.flow.sidePanel.duplicateFlow') }
    submitText = lang.tr('duplicate')
  } else if (props.action === 'rename') {
    dialog = { icon: 'edit', title: lang.tr('studio.flow.sidePanel.renameFlow') }
    submitText = lang.tr('rename')
  }

  return (
    <Dialog isOpen={props.isOpen} onClose={closeModal} transitionDuration={0} {...dialog}>
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup
            label={lang.tr('studio.flow.sidePanel.flowName')}
            helperText={lang.tr('studio.flow.sidePanel.flowNameHelp')}
          >
            <InputGroup
              id="input-flow-name"
              tabIndex={1}
              placeholder={lang.tr('studio.flow.sidePanel.flowNamePlaceholder')}
              required
              value={name}
              onChange={e => setName(sanitizeName(e.currentTarget.value))}
              autoFocus
            />
          </FormGroup>

          {alreadyExists && (
            <Callout title={lang.tr('studio.flow.sidePanel.nameInUse')} intent={Intent.DANGER}>
              {lang.tr('studio.flow.sidePanel.nameInUseMessage')}
            </Callout>
          )}
        </div>

        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="btn-submit"
              type="submit"
              text={submitText}
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
