import { Icon, Tooltip } from '@blueprintjs/core'
import { Icons, lang } from 'botpress/shared'
import React, { FC, Fragment, useState } from 'react'
import { connect } from 'react-redux'
import { buildNewSkill } from '~/actions'
import { AccessControl } from '~/components/Shared/Utils'

import style from './style.scss'

interface ToolItemProps {
  type: string
  id?: string
  icon?: any
  label: string
}

const Toolbar: FC = (props: any) => {
  return (
    <div className={style.toolbar} onContextMenu={e => e.stopPropagation()}>
      <ToolItem label={lang.tr('studio.flow.sidePanel.node')} type="node" id="standard" icon="chat" />
      {(window.EXPERIMENTAL || window.USE_ONEFLOW) && (
        <Fragment>
          {window.USE_ONEFLOW && <ToolItem label={lang.tr('trigger')} type="node" id="trigger" icon="send-to-graph" />}
          <ToolItem label={lang.tr('say')} type="node" id="say_something" icon={<Icons.Say />} />
          <ToolItem label={lang.tr('execute')} type="node" id="execute" icon="code" />
          <ToolItem label={lang.tr('listen')} type="node" id="listen" icon="hand" />
          <ToolItem label={lang.tr('router')} type="node" id="router" icon="fork" />
          <ToolItem label={lang.tr('action')} type="node" id="action" icon="offline" />
        </Fragment>
      )}
      <AccessControl resource="bot.skills" operation="write">
        {props.skills?.map(skill => (
          <ToolItem key={skill.id} label={lang.tr(skill.name)} type="skill" id={skill.id} icon={skill.icon} />
        ))}
      </AccessControl>
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

const mapStateToProps = state => ({
  skills: state.skills.installed
})

const mapDispatchToProps = {
  buildSkill: buildNewSkill
}

export default connect(mapStateToProps, mapDispatchToProps)(Toolbar)
