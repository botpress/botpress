import { Colors, Icon, Position, Pre, Tooltip } from '@blueprintjs/core'
import _ from 'lodash'
import React, { useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import JSONTree from 'react-json-tree'

import inspectorTheme from '../inspectorTheme'
import style from '../style.scss'

const CopyPath = props => {
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 1000)
  }

  return (
    <Tooltip isOpen={copied} content="Path copied to clipboard" position={Position.TOP}>
      <CopyToClipboard text={props.path} onCopy={onCopy}>
        <Icon icon="clipboard" color={Colors.GRAY5} />
      </CopyToClipboard>
    </Tooltip>
  )
}

interface ExpandedPath {
  path: string
  level: number
}

export const Inspector = props => {
  const [expanded, setExpanded] = useState<ExpandedPath[]>([])

  const onContextMenu = (e: React.MouseEvent, path: string, currentLevel: number) => {
    e.preventDefault()
    path = path.replace('event.', '')

    const entries = [
      ...expanded.filter(x => x.path !== path),
      { path, level: (expanded.find(x => x.path === path)?.level ?? currentLevel) + 1 }
    ]

    setExpanded(_.orderBy(entries, x => x.path.length, ['desc']))
  }

  const shouldExpand = (key: string[], data, level: number) => {
    const path = [...key].reverse().join('.')
    const found = expanded.find(x => path.startsWith(x.path))

    return level <= (found?.level ?? 1)
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

              return (
                <span onContextMenu={e => onContextMenu(e, joinedPaths, paths.length)}>
                  <CopyPath path={'{{' + joinedPaths + '}}'} />
                  &nbsp;{key}:
                </span>
              )
            }}
            invertTheme={true}
            hideRoot={true}
            shouldExpandNode={shouldExpand}
          />
        </div>
      </Pre>
    </div>
  )
}
