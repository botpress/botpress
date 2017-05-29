import React from 'react'
import PropTypes from 'prop-types'
import { Tooltip, OverlayTrigger } from 'react-bootstrap'

import classnames from 'classnames'

import style from './HelpButton.scss'

export default class HelpButton extends React.Component {

  constructor(props, context) {
    super(props, context)

    this.state = { shown: false }
  }

  toggleShown() {
    this.setState({ shown: !this.state.shown })
  }

  render() {

    const basePosition = this.state.shown ? 38 : 18
    const btnClass = name => classnames(style.link, style[name], {
      [style.show]: this.state.shown
    })

    const showIcon = negate => classnames('icon', 'material-icons', {
      [style.icon]: true,
      [style.show]: (negate ? this.state.shown : !this.state.shown)
    })

    const community = <Tooltip id='community-tooltip'>Slack <strong>Community</strong></Tooltip>
    const documentation = <Tooltip id='documentation-tooltip'>Official <strong>Documentation</strong></Tooltip>
    const tutorials = <Tooltip id='tutorials-tooltip'>Watch our <strong>tutorials</strong></Tooltip>

    return <div className={style.container}>
      <div className={style.button} onClick={::this.toggleShown}>
        <i className={showIcon(false)}>forum</i>
        <i className={showIcon(true)}>close</i>
      </div>
      <div className={style.menu}>
        <ul>
          <li className={btnClass('btn1')} style={{ bottom: (basePosition + 0) + 'px' }}>
            <OverlayTrigger placement="left" overlay={community}>
              <i className="icon material-icons">group</i>
            </OverlayTrigger>
          </li>
          <li className={btnClass('btn2')} style={{ bottom: (basePosition + 60) + 'px' }}>
            <OverlayTrigger placement="left" overlay={documentation}>
              <i className="icon material-icons">book</i>
            </OverlayTrigger>
          </li>
          <li className={btnClass('btn3')} style={{ bottom: (basePosition + 120) + 'px' }}>
            <OverlayTrigger placement="left" overlay={tutorials}>
              <i className="icon material-icons">video_library</i>
            </OverlayTrigger>
          </li>
        </ul>
      </div>
    </div>
  }

}
