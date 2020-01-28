import { Component } from 'react'
import { toastSuccess, toastError, toastInfo } from '../Shared/Utils'
import _ from 'lodash'

import EventBus from '~/util/EventBus'

export default class BackendToast extends Component {
  constructor(props) {
    super(props)

    EventBus.default.on('toast.*', function(options) {
      const eventName = this.event

      const text = options.text.length > 64 ? `${options.text.slice(0, 63)}...` : options.text

      mostRecentToastId[eventName] = BackendToast[options.type](text)
    })
  }

  static info = text => {
    toastInfo(text)
  }

  static success = text => {
    toastSuccess(text)
  }

  static error = text => {
    toastError(text)
  }

  render = () => null
}
