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

export const toastInfo = message =>
  Toaster.create({ className: 'recipe-toaster', position: Position.TOP_RIGHT }).show({
    message,
    intent: Intent.PRIMARY,
    timeout: 1000
  })
