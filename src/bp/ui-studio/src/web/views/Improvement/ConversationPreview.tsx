import axios from 'axios'
import React, { FC, useEffect } from 'react'

export default props => {
  useEffect(() => {
    const fetchConversation = async () => {
      console.log('Fetching conversation')
      await axios.get(`${window.BOT_API_PATH}/messages/${props.item.sessionId}`).then(res => {
        console.log(res.data)
      })
    }
    fetchConversation()
  }, [props.item])

  return (
    <div>
      <h2>Conversation Preview</h2>
      Session Id: {props.item.sessionId}
    </div>
  )
}
