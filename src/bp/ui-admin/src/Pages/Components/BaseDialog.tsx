import { Classes, Dialog, IDialogProps } from '@blueprintjs/core'
import React, { FC } from 'react'

type Props = {
  onSubmit?: (event: any) => void
} & Partial<IDialogProps>

export const BaseDialog: FC<Props> = props => {
  return (
    <Dialog transitionDuration={0} canOutsideClickClose={false} enforceFocus={false} {...props}>
      {props.onSubmit ? <form onSubmit={props.onSubmit}>{props.children}</form> : props.children}
    </Dialog>
  )
}

export const DialogBody = ({ children }) => {
  return <div className={Classes.DIALOG_BODY}>{children}</div>
}

export const DialogFooter = ({ children }) => {
  return (
    <div className={Classes.DIALOG_FOOTER}>
      <div className={Classes.DIALOG_FOOTER_ACTIONS}>{children}</div>
    </div>
  )
}

export const BPDialog = {
  Container: BaseDialog,
  Body: DialogBody,
  Footer: DialogFooter
}
