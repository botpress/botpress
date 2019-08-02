import React from 'react'
import { OverlayTrigger, Tooltip, FormControl } from 'react-bootstrap'

import 'react-toggle/style.css'
import style from './style.scss'

import User from '../user'

export default class Sidebar extends React.Component {
  constructor() {
    super()

    this.state = {
      allPaused: false,
      filter: true,
      searchClicked: false,
      searchText: ''
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

  handleSearchClick = () => {
    this.setState({ searchClicked: !this.state.searchClicked }, () => {
      if (!this.state.searchClicked) {
        return this.props.handleSearchAction(this.state.searchText)
      }
    })
  }

  searchClearAction = () => {
    this.setState({ searchClicked: false, searchText: '' }, () => {
      this.props.handleSearchAction(this.state.searchText)
    })
  }

  handleChange = val => {
    this.setState({ searchText: val })
  }

  renderUser = value => {
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
    const searchTooltip = <Tooltip id="tooltip">Search By Name</Tooltip>
    const searchClearTooltip = <Tooltip id="tooltip">Clear Search</Tooltip>
    const filterStyle = {
      color: this.props.filter ? '#56c0b2' : '#666666'
    }
    const cancelsearch_style = {
      left: '90px'
    }

    const dynamicHeightUsersDiv = {
      height: innerHeight
    }

    return (
      <div className={style.sidebar}>
        <div style={{ display: this.state.searchClicked ? 'none' : 'block' }} className={style.header}>
          <div className={style.filter}>
            <OverlayTrigger placement="bottom" overlay={filterTooltip}>
              <i className="material-icons" style={filterStyle} onClick={this.toggleFilter}>
                bookmark
              </i>
            </OverlayTrigger>
          </div>
          <div className={style.initial_search}>
            <OverlayTrigger placement="bottom" overlay={searchTooltip}>
              <i
                className="material-icons"
                style={filterStyle}
                onClick={() => {
                  this.handleSearchClick()
                }}
              >
                search
              </i>
            </OverlayTrigger>
          </div>
          <div className={style.cancel_search}>
            <OverlayTrigger placement="bottom" overlay={searchClearTooltip}>
              <i
                className="material-icons"
                style={filterStyle}
                onClick={() => {
                  this.searchClearAction()
                }}
              >
                clear_all
              </i>
            </OverlayTrigger>
          </div>
        </div>

        <div style={{ display: this.state.searchClicked ? 'block' : 'none' }} className={style.header}>
          <div className={style.textfilter}>
            <FormControl
              value={this.state.searchText}
              onChange={e => {
                this.handleChange(e.target.value)
              }}
              placeholder="Search By Name"
            />
          </div>
          <div className={style.textbox_search}>
            <OverlayTrigger placement="bottom" overlay={searchTooltip}>
              <i
                className="material-icons"
                style={filterStyle}
                onClick={() => {
                  this.handleSearchClick()
                }}
              >
                search
              </i>
            </OverlayTrigger>
          </div>
          <div className={style.textbox_cancel}>
            <OverlayTrigger placement="bottom" overlay={searchClearTooltip}>
              <i
                className="material-icons"
                style={filterStyle}
                onClick={() => {
                  this.searchClearAction()
                }}
              >
                cancel
              </i>
            </OverlayTrigger>
          </div>
        </div>

        <div className={style.users} style={dynamicHeightUsersDiv}>
          {this.renderUsers()}
        </div>
      </div>
    )
  }
}
