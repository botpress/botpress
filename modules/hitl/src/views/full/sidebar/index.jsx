import React from 'react'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import 'react-toggle/style.css'
import style from './style.scss'

import User from '../user'

export default class Sidebar extends React.Component {
  constructor() {
    super()

    this.state = {
      allPaused: false,
      filter: true
    }
  }

  toggleAllPaused() {
    this.setState({
      allPaused: !this.state.allPaused
    })
  }

  toggleFilter = () => {
    this.props.toggleOnlyPaused()
  }

  renderUser = (value) => {
    const isCurrent = value.id === this.props.currentSession

    if (isCurrent || !this.props.filter || (this.props.filter && !!value.paused)) {
      return (
        <User
          className={isCurrent ? style.current : ''}
          key={value.id}
          session={value}
          setSession={() => this.props.setSession(value.id)}
        />
      )
    }

    return null
  }

  renderUsers() {
    const sessions = this.props.sessions.sessions

    if (sessions.length === 0) {
      return <p className={style.empty}>There's no conversation...</p>
    }

    return sessions.map(this.renderUser)
  }

  render() {
    const filterTooltip = <Tooltip id="tooltip">Show only paused conversations</Tooltip>
    const filterStyle = {
      color: this.props.filter ? '#56c0b2' : '#666666'
    }

    const dynamicHeightUsersDiv = {
      height: innerHeight - 160
    }

    return (
      <div className={style.sidebar}>
        <div className={style.header}>
          <div className={style.filter}>
            <OverlayTrigger placement="top" overlay={filterTooltip}>
              <i className="material-icons" style={filterStyle} onClick={this.toggleFilter}>
                bookmark
              </i>
            </OverlayTrigger>
          </div>
        </div>
        <div className={style.users} style={dynamicHeightUsersDiv}>
          {this.renderUsers()}
        </div>
      </div >
    )
  }
}
