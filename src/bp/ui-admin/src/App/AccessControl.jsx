import React, { Component } from 'react'
import { checkRule } from 'common/auth'

export class AccessControl extends Component {
  render() {
    if (checkRule(this.props.permissions, this.props.operation, this.props.resource)) {
      return this.props.children
    }
    return null
  }
}
