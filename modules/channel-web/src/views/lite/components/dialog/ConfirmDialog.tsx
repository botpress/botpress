import { Button, Classes, Icon, Intent, Dialog } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'
import ReactDOM from 'react-dom'

import style from "./ConfirmDialog.scss"

export interface ConfirmDialogOptions {
  title?: string
  accept?: () => void
  decline?: () => void
  acceptLabel?: string
  declineLabel?: string
  showDecline?: boolean
}

export interface ConfirmDialogProps extends ConfirmDialogOptions {
  message: string
  resolve: (ok: boolean) => void
}

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
    <Dialog
      className={style.dialog}
      transitionDuration={0}
      canOutsideClickClose={false}
      usePortal={false}
      enforceFocus={false}
      style={{ width: 360 }}
      isOpen
      onClose={onDecline}
    >
      <div className={cx(Classes.DIALOG_BODY, Classes.UI_TEXT, style.dialogBody)}>
        <Icon icon='warning-sign' iconSize={32} className={style.icon} />
        <div>
          {props.message}
        </div>
      </div>
      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          {props.showDecline && (
            <Button
              id='confirm-dialog-decline'
              className={Classes.BUTTON}
              type='button'
              onClick={onDecline}
              text={props.declineLabel} //|| lang('cancel')}
              tabIndex={2}
              intent={Intent.NONE}
            />
          )}
          <Button
            id='confirm-dialog-accept'
            className={Classes.BUTTON}
            type='button'
            autoFocus
            onClick={onAccept}
            text={props.acceptLabel} //|| lang('ok')}
            tabIndex={3}
            intent={Intent.WARNING}
          />
        </div>
      </div>
    </Dialog>
  )
}

const defaultConfirmOptions: ConfirmDialogOptions = {
  title: '',
  accept: () => {},
  acceptLabel: 'Confirm',
  decline: () => {},
  declineLabel: 'Decline',
  showDecline: true
}

const confirmDialog = (message: string, options: ConfirmDialogOptions): Promise<boolean> => {
  return new Promise((resolve, _reject) => {
    addDialog({ message, ...defaultConfirmOptions, ...options }, resolve)
  })
}

export default confirmDialog

function addDialog(props, resolve) {
  const body = document.getElementsByTagName('body')[0]
  const div = document.createElement('div')

  div.setAttribute('id', 'confirmDialog-container')
  div.setAttribute('class', style.ConfirmDialogContainer)
  body.appendChild(div)

  ReactDOM.render(<ConfirmDialogComponent {...props} resolve={resolve} />, div)
}

function removeDialog() {
  const div = document.getElementById('confirmDialog-container') as HTMLElement
  const body = document.getElementsByTagName('body')[0]

  body.removeChild(div)
}
