import React, { Component } from 'react'
import { toast } from 'react-toastify'
import EventBus from '~/util/EventBus'

export default class BackendToast extends Component {
  constructor(props) {
    super(props)

    const uniqueCodes = [...new Set(props.codes)]
    uniqueCodes.forEach(code => {
      let id = null

      EventBus.default.on(`toast.${code}`, options => {
        options.text = options.text.length > 64 ? `${options.text.slice(0, 63)}...` : options.text

        id = BackendToast[options.type](options, id)
      })
    })
  }

  static isActive = id => toast.isActive(id) && toast.dismiss(id)

  static info = ({ text, time }, id) => {
    BackendToast.isActive(id)

    id = toast.info(text, { autoClose: time })

    return id
  }

  static success = ({ text }, id) => {
    BackendToast.isActive(id)

    id = toast.success(text)

    return id
  }

  static error = ({ text }, id) => {
    BackendToast.isActive(id)

    id = toast.error(text, { autoClose: false })

    return id
  }

  render = () => null
}
