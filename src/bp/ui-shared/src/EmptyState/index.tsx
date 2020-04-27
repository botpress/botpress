import React, { FC } from 'react'

import style from './style.scss'
import { EmptyStateProps } from './typings'

const EmptyState: FC<EmptyStateProps> = props => (
  <div className={style.emptyState}>
    {props.icon}
    <p>{props.text}</p>
  </div>
)

export default EmptyState
