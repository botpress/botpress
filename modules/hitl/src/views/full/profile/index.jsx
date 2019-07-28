import React from 'react'
import 'react-toggle/style.css'
import style from './style.scss'
import moment from 'moment'
export default class Profile extends React.Component {
  constructor() {
    super()
    this.state = {
      displayImg: 'block'
    }
  }

  onErrorLoadingImage = () => {
    this.setState({
      displayImg: 'none'
    })
  }

  renderProfile = () => {
    const imgStyle = {
      display: this.state.displayImg
    }

    const currentSession = this.props.currentSession
    const sessionId = currentSession - 1

    if (this.props.sessions.sessions && this.props.currentSession) {
      const session = this.props.sessions.sessions[sessionId]
      let dateFormatted = moment(session.last_event_on).fromNow()
      dateFormatted = dateFormatted.replace('minutes', 'mins').replace('seconds', 'secs')
      const userAttributes = JSON.parse(session.attributes)

      return (
        <div className={style.header}>
          <div className={style.profilePic}>
            <img src={session.user_image_url} onError={this.onErrorLoadingImage} style={imgStyle} />
          </div>
          <h3>{userAttributes.full_name || session.full_name}</h3>
          <h5>{dateFormatted}</h5>
        </div>
      )
    }

    return null
  }

  render() {
    const dynamicHeightUsersDiv = {
      height: innerHeight
    }

    return (
      <div className={style.profile}>
        <div style={dynamicHeightUsersDiv}>{this.renderProfile()}</div>
      </div>
    )
  }
}
