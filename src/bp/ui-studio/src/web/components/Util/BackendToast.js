import { Component } from 'react'
import _ from 'lodash'

import EventBus from '~/util/EventBus'
import { toast } from 'botpress/shared'

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
    toast.info(text)
  }

  static success = text => {
    toast.success(text)
  }

  static error = text => {
    toast.error(text)
  }

  render = () => null
}
