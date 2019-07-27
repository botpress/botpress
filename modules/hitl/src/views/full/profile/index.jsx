import React from 'react'
import 'react-toggle/style.css'
import style from './style.scss'

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
    console.log('this.currentSession---', this.props)
    const currentSession = this.props.currentSession
    const sessionId = currentSession - 1
    console.log('sessionId', sessionId)
    if (this.props.sessions.sessions && this.props.currentSession) {
      const session = this.props.sessions.sessions[sessionId]
      const userAttributes = JSON.parse(session.attributes)

      return (
        <div>
          <div className={style.profile}>{userAttributes.full_name || session.full_name}</div>
          <div className={style.imgContainer}>
            <img src={session.user_image_url} onError={this.onErrorLoadingImage} style={imgStyle} />
          </div>
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
      <div className={style.sidebar}>
        <div className={style.users} style={dynamicHeightUsersDiv}>
          {this.renderProfile()}
        </div>
      </div>
    )
  }
}
