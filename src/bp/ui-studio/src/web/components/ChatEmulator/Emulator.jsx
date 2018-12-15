import React from 'react'

import { Glyphicon } from 'react-bootstrap'
import classnames from 'classnames'

import style from './Emulator.styl'

export default class EmulatorChat extends React.Component {
  constructor(props) {
    super(props)
    this.textInputRef = React.createRef()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isDockOpen && this.props.isDockOpen) {
      this.textInputRef.current.focus()
    }
  }

  render() {
    return (
      <div className={style.container}>
        <div className={style.history}>Hello</div>
        <input ref={this.textInputRef} className={style.msgInput} type="text" />
      </div>
    )
  }
}
