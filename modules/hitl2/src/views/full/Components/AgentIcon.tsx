import { Colors, Icon } from '@blueprintjs/core'
import React, { FC } from 'react'

interface Props {
  online: boolean
}

const AgentIcon: FC<Props> = props => {
  function dotStyle() {
    return {
      top: -3,
      right: -3,
      position: 'absolute' as 'absolute',
      width: 5,
      height: 5,
      backgroundColor: props.online ? Colors.GREEN1 : 'transparent',
      borderRadius: 5
    }
  }

  return (
    <span style={{ position: 'relative' }}>
      <Icon icon="headset"></Icon>
      <span style={dotStyle()}></span>
    </span>
  )
}

export default AgentIcon
