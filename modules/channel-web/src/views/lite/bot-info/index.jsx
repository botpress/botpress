import React from 'react'

export default ({ bot, onDismiss }) => (
  <div>
    this is the bot info page props
    <button onClick={onDismiss} />
    <span>{bot.some}</span>
  </div>
)
