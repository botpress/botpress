import { Colors, Icon } from '@blueprintjs/core'
import cx from 'classnames'
import React, { FC } from 'react'

import styles from '../../style.scss'

interface Props {
  online: boolean
}

const AgentIcon: FC<Props> = ({ online }) => {
  return (
    <span style={{ position: 'relative' }}>
      <Icon icon="headset"></Icon>
      {online ? (
        <span className={cx(styles.dot)} style={{ backgroundColor: Colors.GREEN1 }}></span>
      ) : (
        <span className={cx(styles.dot)}></span>
      )}
    </span>
  )
}

export default AgentIcon
