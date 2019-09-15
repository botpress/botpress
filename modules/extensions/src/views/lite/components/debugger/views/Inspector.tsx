import { Pre } from '@blueprintjs/core'
import React from 'react'
import JSONTree from 'react-json-tree'

import inspectorTheme from '../inspectorTheme'
import style from '../style.scss'
const shouldExpand = (key, data, level) => {
  return level <= 1
}

export const Inspector = props => {
  return (
    <div>
      <Pre className={style.inspectorContainer}>
        <div className={style.inspector}>
          <JSONTree
            data={props.data || {}}
            theme={inspectorTheme}
            invertTheme={true}
            hideRoot={true}
            shouldExpandNode={shouldExpand}
          />
        </div>
      </Pre>
    </div>
  )
}
