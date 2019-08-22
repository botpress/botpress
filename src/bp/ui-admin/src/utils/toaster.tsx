import { Intent, Position, Toaster } from '@blueprintjs/core'
import _ from 'lodash'
import React from 'react'

export const toastSuccess = message =>
  Toaster.create({ className: 'recipe-toaster', position: Position.TOP_RIGHT }).show({
    message,
    intent: Intent.SUCCESS,
    timeout: 1000
  })

export const toastFailure = message =>
  Toaster.create({ className: 'recipe-toaster', position: Position.TOP_RIGHT }).show({
    message,
    intent: Intent.DANGER,
    timeout: 3000
  })

export const toastError = error => {
  const errorCode = _.get(error, 'response.data.errorCode') || _.get(error, 'errorCode')
  const details = _.get(error, 'response.data.message') || _.get(error, 'message')
  const docs = _.get(error, 'response.data.docs') || _.get(error, 'docs')

  let message = (
    <span>
      {errorCode && <span>[{errorCode}]</span>} {details}{' '}
      {docs && (
        <a href={docs} target="_blank">
          More informations
        </a>
      )}
    </span>
  )

  if (!errorCode && !message) {
    message = <span>Something wrong happened. Please try again later.</span>
  }

  toastFailure(message)
}
