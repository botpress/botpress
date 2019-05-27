import { H5, Pre } from '@blueprintjs/core'
import React from 'react'

import style from '../style.scss'

export const Entities = props => {
  const { entities } = props.nlu
  if (!entities || !entities.length) {
    return null
  }

  return (
    <div className={style.block}>
      <H5>Entities</H5>
      <Pre>
        <ul>
          {entities.map(x => {
            return (
              <li key={x.name}>
                {x.name} ({x.type}
                ): {x.data.value}
              </li>
            )
          })}
        </ul>
      </Pre>
    </div>
  )
}
