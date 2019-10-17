import { Classes, Dialog, IDialogProps } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

type Props = {
  onSubmit?: () => void
  size?: 'sm' | 'md' | 'lg'
} & Partial<IDialogProps>

export const BaseDialog: FC<Props> = props => {
  let width = 500
  if (props.size === 'md') {
    width = 700
  } else if (props.size === 'lg') {
    width = 900
  }

  const onSubmit = e => {
    e.preventDefault()
    props.onSubmit!()
  }

  return (
    <Dialog transitionDuration={0} canOutsideClickClose={false} enforceFocus={false} style={{ width }} {...props}>
      {props.onSubmit ? <form onSubmit={onSubmit}>{props.children}</form> : props.children}
    </Dialog>
  )
}

export const DialogBody = ({ children }) => {
  return <div className={cx(Classes.DIALOG_BODY, Classes.UI_TEXT)}>{children}</div>
}

export const DialogFooter = ({ children }) => {
  return (
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>{children}</div>
    </div>
  )
}
