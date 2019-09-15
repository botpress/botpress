import React, { Component } from 'react'
import loadingImage from '../media/loading-circle.svg'

class Loading extends Component {
  render() {
    const style = {
      position: 'absolute',
      display: 'flex',
      justifyContent: 'center',
      height: '100vh',
      width: '100vw',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'black'
    }

    return (
      <div style={style}>
        <img src={loadingImage} alt="loading" />
      </div>
    )
  }
}

export default Loading
