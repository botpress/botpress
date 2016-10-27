import React from 'react'
import { Button } from 'react-bootstrap'

import style from './test.scss'

export default class HelloModule extends React.Component {

  clickHandler() {
    const skin = this.props.skin
    skin.events.emit('hello.notification', null)
  }

  render() {
    return <div>
      <Button onClick={this.clickHandler.bind(this)}>Send notification example</Button>
      <p className={style.hello}>This should be red.</p>
    </div>
  }
}
