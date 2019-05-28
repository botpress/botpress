import { H5, Pre } from '@blueprintjs/core'
import { isArray } from 'lodash'
import React from 'react'

import style from '../style.scss'

export const Slots = props => {
  const { slots } = props.nlu
  if (!slots) {
    return null
  }

  return (
    <div className={style.block}>
      <H5>Slots</H5>
      <Pre>
        <ul>
          {Object.keys(slots).map((key, idx) => {
            const res = isArray(slots[key]) ? slots[key].map(s => s.value).join(',') : slots[key].value
            return (
              <li key={key + idx}>
                {key}: {res}
              </li>
            )
          })}
        </ul>
      </Pre>
    </div>
  )
}
