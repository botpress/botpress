import React, { Component } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'

import EventBus from '~/util/EventBus'

export default class BackendToast extends Component {
  constructor(props) {
    super(props)

    const mostRecentToastId = {}

    EventBus.default.on('toast.*', function(options) {
      const eventName = this.event

      options.text = options.text.length > 64 ? `${options.text.slice(0, 63)}...` : options.text

      mostRecentToastId[eventName] = BackendToast[options.type](options, mostRecentToastId[eventName])
    })
  }

  static dismissIfActive = id => toast.isActive(id) && toast.dismiss(id)

  static info = ({ text, time }, id) => {
    BackendToast.dismissIfActive(id)

    return toast.info(text, { autoClose: time })
  }

  static success = ({ text }, id) => {
    BackendToast.dismissIfActive(id)

    return toast.success(text)
  }

  static error = ({ text }, id) => {
    BackendToast.dismissIfActive(id)

    return toast.error(text, { autoClose: false })
  }

  render = () => null
}
