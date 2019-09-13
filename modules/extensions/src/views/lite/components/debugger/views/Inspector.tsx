import { Colors, Icon, Position, Pre, Tooltip } from '@blueprintjs/core'
import React, { useState } from 'react'
import CopyToClipboard from 'react-copy-to-clipboard'
import JSONTree from 'react-json-tree'

import inspectorTheme from '../inspectorTheme'
import style from '../style.scss'
const shouldExpand = (key, data, level) => {
  return level <= 1
}

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

export const Inspector = props => {
  return (
    <div>
      <Pre className={style.inspectorContainer}>
        <div className={style.inspector}>
          <JSONTree
            data={props.data || {}}
            theme={inspectorTheme}
            labelRenderer={paths => {
              const key = paths[0]
              const path =
                '{{' +
                [...paths, 'event']
                  .reverse()
                  .map(x => x.toString())
                  .join('.') +
                '}}'
              return (
                <span>
                  <CopyPath path={path} />
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
