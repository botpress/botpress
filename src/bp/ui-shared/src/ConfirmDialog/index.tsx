import { Button, Classes, Intent } from '@blueprintjs/core'
import React, { FC } from 'react'
import ReactDOM from 'react-dom'

import { lang } from '../translations'
import { BaseDialog, DialogBody, DialogFooter } from '../BaseDialog'

import styles from './style.scss'
import { ConfirmDialogOptions, ConfirmDialogProps } from './typings'

const ConfirmDialogComponent: FC<ConfirmDialogProps> = props => {
  const onAccept = () => {
    removeDialog()
    props.accept?.()
    props.resolve(true)
  }

  const onDecline = () => {
    removeDialog()
    props.decline?.()
    props.resolve(false)
  }

  return (
    <BaseDialog
      title={props.title || lang('confirmPrompt')}
      icon="warning-sign"
      usePortal={false}
      isOpen
      onClose={onDecline}
    >
      <DialogBody>{props.message}</DialogBody>
      <DialogFooter>
        <Button
          id="confirm-dialog-decline"
          className={Classes.BUTTON}
          type="button"
          onClick={onDecline}
          text={props.declineLabel || lang('cancel')}
          tabIndex={2}
          intent={Intent.NONE}
        />
        <Button
          id="confirm-dialog-accept"
          className={Classes.BUTTON}
          type="button"
          onClick={onAccept}
          text={props.acceptLabel || lang('ok')}
          tabIndex={3}
          intent={Intent.PRIMARY}
        />
      </DialogFooter>
    </BaseDialog>
  )
}

const confirmDialog = (message: string, options: ConfirmDialogOptions): Promise<boolean> => {
  return new Promise((resolve, _reject) => {
    addDialog({ message, ...options }, resolve)
  })
}

export default confirmDialog

function addDialog(props, resolve) {
  const body = document.getElementsByTagName('body')[0]
  const div = document.createElement('div')

  div.setAttribute('id', 'confirmDialog-container')
  div.setAttribute('class', styles.ConfirmDialogContainer)
  body.appendChild(div)

  ReactDOM.render(<ConfirmDialogComponent {...props} resolve={resolve} />, div)
}

function removeDialog() {
  const div = document.getElementById('confirmDialog-container') as HTMLElement
  const body = document.getElementsByTagName('body')[0]

  body.removeChild(div)
}
