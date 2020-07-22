import { Icon, Tooltip } from '@blueprintjs/core'
import { Icons, lang } from 'botpress/shared'
import React, { FC, useState } from 'react'

import style from './style.scss'
interface ToolItemProps {
  type: string
  id?: string
  icon?: any
  label: string
}

const Toolbar: FC = () => {
  return (
    <div className={style.toolbar} onContextMenu={e => e.stopPropagation()}>
      <ToolItem label={lang.tr('trigger')} type="node" id="trigger" icon="send-to-graph" />
      <ToolItem label={lang.tr('say')} type="node" id="say_something" icon={<Icons.Say />} />
      {<ToolItem label={lang.tr('prompt')} type="node" id="prompt" icon="citation" />}
      <ToolItem label={lang.tr('execute')} type="node" id="execute" icon="code" />
    </div>
  )
}

const ToolItem: FC<ToolItemProps> = ({ label, type, id, icon }) => {
  return (
    <div
      id={`btn-tool-${id}`}
      className={style.toolItem}
      key={id}
      draggable
      onDragStart={event => {
        event.dataTransfer.setData('diagram-node', JSON.stringify({ type, id }))
      }}
    >
      <Tooltip content={label}>
        <Icon icon={icon} />
      </Tooltip>
    </div>
  )
}

export default Toolbar
