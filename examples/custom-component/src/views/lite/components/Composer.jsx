import React from 'react'

// This component is an example on how to replace the composer input of the web chat (text input)

export const Composer = props => {
  const {} = this.props.store.composer

  return (
    <div>
      <input type="text" placeholder="custom composer..."></input>
      <button type="button"></button>
    </div>
  )
}
