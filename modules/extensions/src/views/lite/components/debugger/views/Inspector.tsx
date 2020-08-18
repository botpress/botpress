import { ContextMenu, Menu, MenuItem, Pre } from '@blueprintjs/core'
import copy from 'copy-to-clipboard'
import _ from 'lodash'
import React, { useState } from 'react'
import JSONTree from 'react-json-tree'

import lang from '../../../../lang'
import inspectorTheme from '../inspectorTheme'
import style from '../style.scss'

interface ExpandedPath {
  path: string
  level: number
}

export const Inspector = props => {
  const [expanded, setExpanded] = useState<ExpandedPath[]>([])

  const handleContextMenu = (e: React.MouseEvent, path: string, currentLevel: number) => {
    e.preventDefault()

    ContextMenu.show(
      <Menu>
        <MenuItem
          text={lang.tr('module.extensions.inspector.copyEventPath')}
          onClick={() => {
            copy(`{{${path}}}`)
          }}
          icon="clipboard"
        />
        <MenuItem
          text={lang.tr('module.extensions.inspector.expandAll')}
          onClick={() => {
            path = path.replace('event.', '')

            const entries = [
              ...expanded.filter(x => x.path !== path),
              { path, level: (expanded.find(x => x.path === path)?.level ?? currentLevel) + 1 }
            ]

            setExpanded(_.orderBy(entries, x => x.path.length, ['desc']))
          }}
          icon="expand-all"
        />
      </Menu>,
      { left: e.clientX, top: e.clientY }
    )
  }

  const shouldExpand = (key: string[], data, level: number) => {
    const path = [...key].reverse().join('.')
    const found = expanded.find(x => path.startsWith(x.path))

    return level <= (found?.level ?? 0)
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

              return <span onContextMenu={e => handleContextMenu(e, joinedPaths, paths.length)}>{key}:</span>
            }}
            invertTheme={false}
            hideRoot={true}
            shouldExpandNode={shouldExpand}
          />
        </div>
      </Pre>
    </div>
  )
}
