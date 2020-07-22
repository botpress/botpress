import { ContextMenu, Menu, MenuItem, Pre } from '@blueprintjs/core'
import copy from 'copy-to-clipboard'
import _ from 'lodash'
import React, { useState } from 'react'
import JSONTree from 'react-json-tree'

import inspectorTheme from '../inspectorTheme'
import style from '../style.scss'

interface ExpandedPath {
  path: string
  level: number
}

export const Inspector = props => {
  const handleContextMenu = (e, joinedPaths) => {
    e.preventDefault()

    ContextMenu.show(
      <Menu>
        <MenuItem
          text="Copy event path"
          onClick={() => {
            console.log('test')
            copy(`{{${joinedPaths}}}`)
          }}
          icon="clipboard"
        />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  return (
    <div>
      <Pre className={style.inspectorContainer}>
        <div className={style.inspector}>
          <JSONTree
            data={props.data || {}}
            theme={inspectorTheme}
            labelRenderer={paths => {
              const key = paths[0]
              const joinedPaths = [...paths, 'event']
                .reverse()
                .map(x => x.toString())
                .join('.')

              return <span onContextMenu={e => handleContextMenu(e, joinedPaths)}>{key}:</span>
            }}
            invertTheme={false}
            hideRoot={true}
          />
        </div>
      </Pre>
    </div>
  )
}
