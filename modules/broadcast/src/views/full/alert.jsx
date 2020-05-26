import React from 'react'

import { Callout, Button, Intent } from '@blueprintjs/core'
import cx from 'classnames'
import style from './style.scss'
import { lang } from 'botpress/shared'

export default class DismissableAlert extends React.Component {
  state = { alertVisible: true }

  render() {
    const dismiss = () => this.setState({ alertVisible: false })
    if (this.state.alertVisible) {
      return (
        <Callout
          className={cx(style.error, 'bp3-elevation-1')}
          title={lang.tr('module.broadcast.alert.title')}
          intent={Intent.DANGER}
          onDismiss={dismiss}
        >
          <p>{lang.tr('module.broadcast.alert.message')}</p>
          <p>
            <Button intent={Intent.DANGER} onClick={dismiss} text={lang.tr('module.broadcast.alert.hide')} />
          </p>
        </Callout>
      )
    }

    return null
  }
}
